import type { ExpoConfig } from 'expo/config';

// Placeholder identifiers — must be finalized before the first store/TestFlight build,
// after which they are permanent.
const APP_ID = 'com.trophway.app';

const config: ExpoConfig = {
  name: 'Trophway',
  slug: 'trophway',
  scheme: 'trophway',
  version: '1.0.0',
  platforms: ['ios', 'android'],
  orientation: 'portrait',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: APP_ID,
    supportsTablet: true,
  },
  android: {
    package: APP_ID,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    // iOS 27 SDK requires the UIScene life cycle; remove on upgrade to Expo SDK 58.
    './plugins/with-scene-lifecycle',
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
