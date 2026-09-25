# trophway

Sync your PSN trophies automatically — track your progress, climb the leaderboards, and connect with fellow trophy hunters!

## Repository layout

```
apps/
  mobile/     # @trophway/mobile — Expo (React Native) app, iOS + Android
  api/        # reserved for the .NET backend (not created yet)
packages/     # reserved for shared TypeScript packages
openspec/     # OpenSpec specs and change proposals
```

JavaScript/TypeScript workspaces are managed with [pnpm workspaces](https://pnpm.io/workspaces) and orchestrated with [Turborepo](https://turborepo.com). Directories without a `package.json` (such as the future .NET backend) are ignored by both.

## Getting started

### Prerequisites

- **Node.js 24** (see `.nvmrc`; e.g. `nvm use`)
- **pnpm** — the exact version is pinned in `package.json` (`packageManager`). Enable it via corepack:

  ```bash
  corepack enable
  ```

- For running the app on a simulator/emulator (not needed for lint/typecheck/test):
  - **iOS**: macOS with Xcode selected as the active developer directory (`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`) and [CocoaPods](https://cocoapods.org)
  - **Android**: Android Studio (Android SDK + an emulator) and a JDK

No Expo/EAS account or any paid service is required.

### Install

```bash
pnpm install
```

### Repo-wide checks

Run from the repository root; each runs across every workspace that defines the task (Turborepo caches results locally — no remote cache is configured).

```bash
pnpm lint          # ESLint (warnings fail the check)
pnpm typecheck     # tsc --noEmit
pnpm test          # Jest
pnpm format        # Prettier — write
pnpm format:check  # Prettier — check only
```

Turborepo collects anonymous telemetry by default; opt out with `pnpm turbo telemetry disable` (or set `TURBO_TELEMETRY_DISABLED=1`).

CI (GitHub Actions, `.github/workflows/ci.yml`) runs a frozen-lockfile install followed by `lint`, `typecheck`, `test`, and `format:check` on every pull request and on pushes to `main`.

## Mobile app

`pnpm mobile <command>` runs a command in the `@trophway/mobile` workspace (shorthand for `pnpm --filter @trophway/mobile <command>`).

```bash
pnpm mobile start     # start the dev server; open in Expo Go or a development build
pnpm mobile ios       # local native build + run on the iOS simulator (expo run:ios)
pnpm mobile android   # local native build + run on the Android emulator (expo run:android)
```

- **Expo Go vs local builds**: `pnpm mobile start` is the quickest loop via Expo Go, but Expo Go can't open the app's own `trophway://` deep links or load custom native modules — use `pnpm mobile ios|android` for those.
- **Deep links**: with a local build installed, try `xcrun simctl openurl booted "trophway://"` (iOS) or `adb shell am start -W -a android.intent.action.VIEW -d "trophway://"` (Android).
- **Native projects**: `apps/mobile/ios` and `apps/mobile/android` are generated from `app.config.ts` (Continuous Native Generation) and git-ignored — never edit them by hand.
- **Adding dependencies**: use `pnpm mobile exec expo install <package>` so versions match the Expo SDK, and confirm the package's license is permissive (MIT, Apache-2.0, BSD, ISC).
- **Routes and tests**: routes live in `apps/mobile/src/app/` (Expo Router — every file there is a screen). Tests live in `apps/mobile/__tests__/`, **never** under `src/app/`, or they would be registered as routes.
