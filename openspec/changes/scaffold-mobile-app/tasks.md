# Tasks

This change covers **repo-root tooling** and **mobile (RN/Expo)** only. It has no backend (.NET), database (PostgreSQL), or cache (Redis) tasks. No task requires a real PSN account or token. Tasks marked **(manual)** need a simulator or emulator and are verified by hand. iOS tasks also require macOS with Xcode.

Every dependency is installed with `expo install` where the Expo SDK covers it, so versions match SDK 57 (design.md, Context). Before adding a package, confirm that its license matches the table in proposal.md. If it doesn't, stop and ask.

## 1. Repo root: workspace and toolchain

- [x] 1.1 Create branch `feat/scaffold-mobile-app-impl` from `main` (the planning branch `feat/scaffold-mobile-app` was already merged in #4) (per CONTRIBUTING.md), and verify with `git branch --show-current`
- [x] 1.2 Add the root `package.json` (`private: true`, `name: "trophway"`, exact `packageManager: "pnpm@<version>"`, `engines.node: ">=24"`), `.nvmrc` (`24`), and `pnpm-workspace.yaml` (`apps/*`, `packages/*`). Run `corepack enable`. Verify that `pnpm -v` prints the pinned version and that `pnpm install` at the root succeeds and creates `pnpm-lock.yaml`
- [x] 1.3 Add a root `.gitignore` for repo-wide patterns, with Expo/React Native patterns in `apps/mobile/.gitignore` (design.md D9). Originally listed: (node_modules, `.expo`, `dist`, `.turbo`, `coverage`, `expo-env.d.ts`, `ios/`, `android/`, `.env*.local`, `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`) and `.editorconfig`. Verify that `git status` shows no `node_modules/`
- [x] 1.4 Add root `tsconfig.base.json` with only the strictness flags from design.md D7 (no `jsx`/`module` settings). Verify it parses with `pnpm --package=typescript@~6.0.3 dlx tsc -p tsconfig.base.json --showConfig` (a TS18003 "no inputs" error is expected at the root), using the same TypeScript major as Expo pins
- [x] 1.5 Add `prettier` as a root dev dependency, plus `.prettierrc.json`, and a `.prettierignore` covering lockfiles, build/cache output, `openspec/`, and `.claude/`. Add the root `format` and `format:check` scripts. Verify that `pnpm format:check` passes, then fails on a deliberately misformatted scratch `.ts` file (delete it afterwards)
- [x] 1.6 Add `turbo` as a root dev dependency, plus `turbo.json` defining `lint`, `typecheck`, and `test` (the `test` output is `coverage/**`). Add root scripts `lint` / `typecheck` / `test` → `turbo run <task>`, and `mobile` → `pnpm --filter @trophway/mobile`. Verify that `pnpm turbo run lint --dry-run` succeeds and that no remote cache is configured (no `.turbo/config.json` and no `TURBO_TOKEN`)

## 2. Mobile: Expo app and routing shell (`apps/mobile`)

- [x] 2.1 Generate `apps/mobile` with `create-expo-app` using the SDK 57 `blank-typescript` template, without installing. Rename the package to `@trophway/mobile` with `private: true`. Delete any nested `.git` or lockfile the generator created, then run `pnpm install` at the root. Verify that `pnpm mobile ls expo` shows 57.x and that no lockfile exists under `apps/mobile`
- [x] 2.2 Review the "ignored build scripts" notice from `pnpm install`, and allowlist only the dependencies that really need a build script in `pnpm-workspace.yaml`. If isolated installs break Metro or autolinking in later tasks, switch to `nodeLinker: hoisted` and give the reason in the commit message (design.md D2). Verify that a re-run of `pnpm install` prints no unexpected ignored-script warnings
- [x] 2.3 Install the Expo Router set with `pnpm mobile exec expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar` plus expo-router's required peers `@expo/metro-runtime` and `@expo/log-box`, with `autoInstallPeers: false` in `pnpm-workspace.yaml` (see design.md D4). Set `"main": "expo-router/entry"`, and delete the template's `App.tsx` / `index.ts`. Do **not** install web, reanimated, or gesture-handler peers. Verify that `pnpm mobile exec expo install --check` reports every dependency as compatible
- [x] 2.4 Replace `app.json` with a typed `app.config.ts` per design.md D6: name `Trophway`, slug `trophway`, scheme `trophway`, `platforms: ["ios", "android"]`, placeholder `com.trophway.app` IDs, and typed routes enabled. Verify that `pnpm mobile exec expo config --type public` shows only `ios`/`android` platforms and `scheme: "trophway"`
- [x] 2.5 Configure `apps/mobile/tsconfig.json` with `extends: ["expo/tsconfig.base", "../../tsconfig.base.json"]`, the `@/*` → `./src/*` path alias, and the `include` list from D7. Add a `typecheck` script (`tsc --noEmit`). Verify that `pnpm mobile typecheck` passes, then fails when a temporary untyped (implicit-`any`) parameter is added (revert it)
- [x] 2.6 Implement the routes in `src/app/`: `_layout.tsx` (root `Stack`), `index.tsx` (renders "Trophway" inside a `SafeAreaView`), and `+not-found.tsx` (not-found message plus a `Link` to `/`). Verify that `pnpm mobile typecheck` passes and that `pnpm mobile start` bundles with no errors
- [x] 2.7 Set up ESLint with `pnpm mobile exec expo lint`, producing a flat `eslint.config.js` based on `eslint-config-expo`, and add `eslint-config-prettier`. Add a `lint` script. Verify that `pnpm mobile lint` passes, then fails on a deliberately unused variable (revert it)
- [x] 2.8 Set up Jest with the `jest-expo` preset, `jest` pinned to the major that `jest-expo` depends on (not npm `latest`), `@types/jest`, `@react-native/jest-preset`, `@testing-library/react-native` 13.x, and `react-test-renderer` (see design.md D8). Add a `test` script. Write the tests in `apps/mobile/__tests__/` (not under `src/app/`) using `renderRouter` from `expo-router/testing-library`, covering three cases:
  - the root route shows "Trophway"
  - `/does-not-exist` shows the not-found screen
  - pressing the home link on the not-found screen returns to the home screen

  Verify that `pnpm mobile test` passes
- [x] 2.13 (must precede 2.9) Add the `apps/mobile/plugins/with-scene-lifecycle.js` config plugin (design.md D11), which adopts the UIScene life cycle required by the iOS 27 SDK, and register it in `app.config.ts`. Verify that `expo prebuild --platform ios --clean` generates an `AppDelegate.swift` and a `SceneDelegate.swift` identical to Expo SDK 58's template, that `Info.plist` has `UIApplicationSceneManifest`, and that the app launches on an iOS 27 simulator without the "UIScene life cycle is required" crash
- [ ] 2.9 **(manual)** Build and run on an iOS simulator with `pnpm mobile ios` (a local native build; Expo Go cannot handle the custom scheme). Verify these three things:
  - the home screen shows "Trophway", with no error overlay and no text under the notch or status bar
  - `xcrun simctl openurl booted "trophway://"` opens the home screen
  - `xcrun simctl openurl booted "trophway://does-not-exist"` shows not-found, and its home link works
- [ ] 2.10 **(manual)** Build and run on an Android emulator with `pnpm mobile android`. Verify these three things:
  - the home screen shows "Trophway" with no error overlay
  - `adb shell am start -W -a android.intent.action.VIEW -d "trophway://"` opens the home screen
  - the same command with `trophway://does-not-exist` shows not-found, and its home link works
- [x] 2.11 After 2.9 and 2.10, verify that `git status` shows no untracked `apps/mobile/ios/`, `apps/mobile/android/`, `.expo/`, or `expo-env.d.ts`
- [x] 2.12 Add a "Mobile app" section to `README.md`. It should cover:
  - `pnpm mobile start` / `ios` / `android`
  - Expo Go vs local native builds (deep links need the local build)
  - that no Expo account is needed
  - the "tests live in `__tests__/`, never under `src/app/`" convention

  Verify that each documented command runs as written

## 3. Repo root: cross-workspace integration

- [x] 3.1 Verify that `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm format:check` all exit 0 from the root. Also verify that a second `pnpm typecheck` with no changes reports a full local turbo cache hit
- [x] 3.2 Verify that failures propagate: a temporary lint violation in `apps/mobile` makes root `pnpm lint` exit non-zero and name the file, and a temporary type error does the same for `pnpm typecheck`. Revert both
- [x] 3.3 Verify that non-JS directories are ignored: create a temporary `apps/api/README.md` (no `package.json`), and confirm that `pnpm install`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` still succeed and don't list it as a workspace. Remove it afterwards
- [x] 3.4 Add a "Getting started" section to the root `README.md`. It should cover:
  - prerequisites: Node 24 via `.nvmrc`, `corepack enable`, and Xcode / Android Studio for simulators
  - `pnpm install`
  - the root `lint` / `typecheck` / `test` / `format` / `format:check` commands
  - the `apps/` + `packages/` layout, including `apps/api` reserved for the .NET backend
  - how to opt out of Turborepo telemetry

  Verify that each documented command runs as written

## 4. Repo root: CI

- [x] 4.1 Add `.github/workflows/ci.yml` per design.md D10:
  - triggers: `pull_request`, and `push` to `main`
  - steps: `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` (`node-version-file: .nvmrc`, pnpm cache), `pnpm install --frozen-lockfile`, then separate `lint` / `typecheck` / `test` / `format:check` steps
  - env: `TURBO_TELEMETRY_DISABLED=1`, `EXPO_NO_TELEMETRY=1`
  - no secrets

  Add one line to the README describing what CI runs. Verify by pushing the branch and opening a draft PR (ask the user before pushing), then confirm the CI check passes
- [x] 4.2 Verify the CI failure path on a throwaway branch: push a commit with a lint violation, confirm the CI check fails on the `lint` step, then delete the throwaway branch (ask the user before pushing)

## 5. Final integration check

- [x] 5.1 Clone the branch into a scratch directory (done before the first commit by copying the git-visible files; CI repeats it on a real checkout), then run `corepack enable`, `pnpm install --frozen-lockfile`, and all four root checks, and run `pnpm mobile start` until the bundle succeeds. Verify that all of this works while `pnpm mobile exec expo whoami` reports that you are not logged in
- [x] 5.2 Run `pnpm licenses list`, and verify that every direct dependency of the root and `apps/mobile` matches the license table in proposal.md. Report any deviation to the user instead of proceeding
- [x] 5.3 Verify that `openspec validate scaffold-mobile-app --strict` passes
