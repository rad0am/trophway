// Adopts the UIKit scene-based life cycle on iOS. Apps built with the iOS 27 SDK (Xcode 27)
// are killed at launch without it, and Expo SDK 57's native template predates that
// requirement. This mirrors the changes in Expo SDK 58's native template, using classes the
// SDK 57 runtime already ships (`ExpoAppSceneDelegate`, `ExpoReactNativeFactoryProvider`).
// Delete this plugin when upgrading to SDK 58.
const fs = require('fs');
const path = require('path');
const {
  IOSConfig,
  withAppDelegate,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins');

const TAG = '[with-scene-lifecycle]';
const SCENE_DELEGATE_FILE = 'SceneDelegate.swift';
const SCENE_DELEGATE_SOURCE = `internal import Expo

@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
  // Extension point for config plugins.
}
`;

const APP_DELEGATE_CLASS = 'class AppDelegate: ExpoAppDelegate {';
const APP_DELEGATE_WINDOW_START = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

`;
// Under the scene life cycle UIKit no longer calls these; ExpoAppSceneDelegate forwards the
// events to ExpoAppDelegate and React Native's linking manager instead.
const APP_DELEGATE_LINKING_OVERRIDES =
  /\n {2}\/\/ Linking API\n[\s\S]*?\n {2}\/\/ Universal Links\n[\s\S]*?\|\| result\n {2}\}\n/;

function replaceOrThrow(contents, search, replacement, what) {
  const found = typeof search === 'string' ? contents.includes(search) : search.test(contents);
  if (!found) {
    // Fail the prebuild rather than emit an app that crashes at launch.
    throw new Error(
      `${TAG} Could not find ${what} in AppDelegate.swift. The Expo native template changed; update or remove this plugin.`,
    );
  }
  return contents.replace(search, replacement);
}

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return config;
  });
}

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    const { language, contents } = config.modResults;
    if (language !== 'swift') {
      throw new Error(`${TAG} Expected a Swift AppDelegate, got ${language}.`);
    }
    if (contents.includes('ExpoReactNativeFactoryProvider')) {
      return config; // already adopted
    }
    let next = replaceOrThrow(
      contents,
      APP_DELEGATE_CLASS,
      'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {',
      'the AppDelegate class declaration',
    );
    next = replaceOrThrow(
      next,
      APP_DELEGATE_WINDOW_START,
      '    // The window is created and React Native is started by `SceneDelegate` under the\n' +
        '    // scene-based life cycle (required by the iOS 27 SDK).\n',
      'the window / startReactNative block',
    );
    next = replaceOrThrow(next, APP_DELEGATE_LINKING_OVERRIDES, '', 'the linking overrides');
    config.modResults.contents = next;
    return config;
  });
}

function withSceneDelegateFile(config) {
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const { platformProjectRoot, projectName } = config.modRequest;
      fs.writeFileSync(
        path.join(platformProjectRoot, projectName, SCENE_DELEGATE_FILE),
        SCENE_DELEGATE_SOURCE,
      );
      return config;
    },
  ]);
  return withXcodeProject(config, (config) => {
    const { projectName } = config.modRequest;
    const filepath = `${projectName}/${SCENE_DELEGATE_FILE}`;
    if (!config.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath,
        groupName: projectName,
        project: config.modResults,
      });
    }
    return config;
  });
}

module.exports = function withSceneLifecycle(config) {
  config = withSceneManifest(config);
  config = withSceneAppDelegate(config);
  config = withSceneDelegateFile(config);
  return config;
};
