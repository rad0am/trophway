This is the Trophway Expo/React Native mobile app (`@trophway/mobile`), one workspace in a pnpm + Turborepo monorepo. Prioritize mobile-first patterns, performance, and cross-platform compatibility. iOS and Android only — no web target.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Run from the repository root. `pnpm mobile <cmd>` is shorthand for `pnpm --filter @trophway/mobile <cmd>`.

```bash
pnpm mobile exec expo install <package>  # ALWAYS use instead of pnpm add — resolves SDK-compatible versions
pnpm mobile start                        # start the dev server (Expo Go)
pnpm mobile ios | android                # local native build + run (needed for deep links / native modules)
pnpm --dir apps/mobile dlx expo-doctor   # diagnose dependency and config issues
pnpm mobile exec expo install --fix      # fix incompatible package versions
pnpm lint && pnpm typecheck && pnpm test # repo-wide checks (Turborepo)
```

Run lint, typecheck, and test before declaring any task done. Before adding any dependency, confirm its license is permissive (MIT, Apache-2.0, BSD, ISC); see `openspec/config.yaml`.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Tests live in `__tests__/`, never under `src/app/` (a test file there would become a route).
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Builds

Local builds (`pnpm mobile ios|android`, Xcode / Android Studio) are the supported path. EAS is an optional convenience, never a required step — do not add EAS-only configuration or workflows.

## Rules

- `ios/` and `android/` are generated (Continuous Native Generation) and git-ignored. Never create or edit them by hand — configure native behavior in `app.config.ts` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build (`pnpm mobile ios|android`).
- Prefer recommended Expo modules over third-party libraries. Docs: https://docs.expo.dev/versions/latest/index.md
