# Design

## Context

The repository is greenfield. It holds only OpenSpec/Claude tooling (`openspec/`, `.claude/`), `README.md`, and `CONTRIBUTING.md`, and it has no `package.json`, lockfile, or CI. The motivation is in proposal.md (Why). The requirements are in `specs/mobile-app-shell/spec.md` and `specs/monorepo-tooling/spec.md`.

Constraints that shape the approach:

- **Monorepo with a non-JS backend.** A .NET backend will be added beside the app later, so JS workspace tooling must not assume that every app is a JS package.
- **Permissive licenses, no paid services.** Only permissive-OSS dependencies are allowed, and nothing may require a paid tier. This rules out making EAS Build or Turborepo remote cache a hard dependency.
- **Versions at planning time (checked on npm).** `expo` 57.0.x (SDK 57), `react-native` 0.86.x, `react` 19.2.x, and `typescript` ~6.0 as pinned by the SDK 57 template. TypeScript 7.0 is published, but Expo does not pin it yet. Implementation MUST use the versions `expo install` resolves for SDK 57 instead of `latest`.
- **Local toolchain.** The machine has Node 24 LTS and npm 11. pnpm is not installed, and corepack is available.

## Goals / Non-Goals

**Goals:**

- Provide a layout and root toolchain that the backend and shared packages can join without restructuring.
- Keep the app's dependency surface small: only what Expo Router and the test/lint stack need.
- Run every quality check fully offline after install, with no accounts needed.

**Non-Goals:**

- The .NET backend, a shared API client package, or any `packages/*` content.
- Native builds in CI (simulator/emulator runs are checked by hand), EAS configuration, OTA updates, and app-store signing.
- State management, data fetching, theming/UI kit, i18n, and env-var plumbing. Each one arrives with the first feature that needs it.
- Automated license auditing of transitive dependencies (see Open Questions).

## Decisions

### D1. Layout: `apps/*` + `packages/*`, app at `apps/mobile`

```
/
├─ package.json            # private root; packageManager pin; root scripts
├─ pnpm-workspace.yaml     # packages: apps/*, packages/*
├─ turbo.json
├─ tsconfig.base.json      # shared strict compiler options
├─ .nvmrc  .editorconfig  .prettierrc.json  .prettierignore  .gitignore
├─ .github/workflows/ci.yml
├─ apps/
│  ├─ mobile/              # @trophway/mobile (Expo)
│  │  ├─ app.config.ts  package.json  tsconfig.json  eslint.config.js  jest config
│  │  ├─ assets/
│  │  ├─ __tests__/        # outside src/app on purpose (see D5)
│  │  └─ src/app/          # Expo Router routes: _layout, index, +not-found
│  └─ api/                 # reserved for .NET backend (NOT created here)
└─ packages/               # reserved for shared TS packages (NOT created here)
```

pnpm only treats a directory matched by the workspace globs as a workspace if it contains a `package.json`. A future `apps/api` holding a `.csproj` is therefore ignored by `pnpm install` and `turbo` automatically. That is how the spec's "non-JS app directory is ignored" scenario is met.

*Alternatives considered.* Flat `mobile/` + `backend/` folders. They are simpler, but they give shared TS code (for example a generated API client) no obvious home, and they break from the Turborepo/Expo monorepo conventions that the docs and examples assume. The user chose `apps/mobile`.

### D2. pnpm workspaces with the default isolated linker

- Pin the exact pnpm version in the root `package.json` `packageManager` field. Use the current pnpm major at implementation time (12.x on the planning date).
- pnpm is provided through corepack (`corepack enable`) or a standalone pnpm install. Both honor `packageManager`.
- pnpm settings live in `pnpm-workspace.yaml`, not in an `.npmrc`.
- Keep pnpm's default isolated `node_modules` layout, which Expo has supported since SDK 54. This preserves pnpm's protection against phantom dependencies.
- If a native module's autolinking or Metro resolution fails under isolated installs, fall back to `nodeLinker: hoisted` in `pnpm-workspace.yaml`. Record the reason in the commit message.
- pnpm 10+ blocks dependency lifecycle scripts by default. Allowlist only the packages that actually need a build script, and review each one. Do not disable the protection globally.

*Alternatives considered.* npm workspaces require no install step but hoist everything and are slower. Yarn and Bun were also options. The user chose pnpm.

### D3. Turborepo for root tasks, local cache only

- `turbo.json` defines `lint`, `typecheck`, and `test`.
- `test` declares `coverage/**` as its output. The other tasks have no outputs.
- No `build` task exists yet. `dependsOn: ["^build"]` is added when the first `packages/*` library needs compiling.
- Root scripts: `lint` / `typecheck` / `test` → `turbo run <task>`.
- `format` / `format:check` → `prettier --write .` / `prettier --check .` run once at the root. Formatting is repo-wide, not per workspace, so going through turbo would add overhead with no benefit.
- Root convenience script `mobile` → `pnpm --filter @trophway/mobile`, so developers can run `pnpm mobile start`, `pnpm mobile ios`, or `pnpm mobile android`. Long-running dev servers stay out of turbo on purpose.
- No remote cache is configured. CI sets `TURBO_TELEMETRY_DISABLED=1`, and the README says how to opt out locally.

*Alternatives considered.* Plain `pnpm -r run <task>`. It works, but it has no caching, and its output ordering gets noisy once there are several packages. Nx is heavier and more opinionated than needed. The user chose Turborepo.

### D4. Generate from `blank-typescript`, then add Expo Router by hand

- Generate the app with `create-expo-app` using the SDK 57 `blank-typescript` template into `apps/mobile`, without installing. Then install from the root.
- Add Expo Router and its required native peers with `expo install` so the versions match SDK 57: `expo-router`, `react-native-safe-area-context`, `react-native-screens`, `expo-linking`, `expo-constants`, `expo-status-bar`.
- Set `"main": "expo-router/entry"`, and point routes at `src/app/`.
- Remove anything the generator creates that conflicts with the monorepo: a nested `.git`, or a lockfile inside `apps/mobile`.

*Alternatives considered.* The `default` template, followed by `reset-project`. That template brings `react-native-web`, `react-dom`, reanimated, gesture-handler, a tabs example, and assorted `expo-*` modules. We would delete most of them straight away, and each one we kept would be another license to vet and another upgrade to track. Starting from `blank-typescript` means everything in the tree was added on purpose. Expo Router lists web, reanimated, and gesture-handler packages as **optional** peers. We do not install them, and pnpm warnings about those optional peers are expected.

### D5. App shell structure

- `src/app/_layout.tsx`: the root `Stack`. Expo Router already mounts a safe-area provider at the root.
- `src/app/index.tsx`: the home screen. It renders "Trophway" inside a `SafeAreaView` from `react-native-safe-area-context`.
- `src/app/+not-found.tsx`: the not-found screen, with a `Link` to `/`.
- Typed routes are enabled (`experiments.typedRoutes`, if SDK 57 does not already turn them on). Invalid `href`s then fail `typecheck`.
- **Tests live outside `src/app/`.** Expo Router treats every file under `app/` as a route, so a test file there would register as a screen. Tests go in `apps/mobile/__tests__/`.
- Smoke tests use `renderRouter` from `expo-router/testing-library` against the real `src/app` directory. That covers both "root shows Trophway" and "unknown path shows not-found" without a device.

### D6. App config in `app.config.ts`

- Use a typed `ExpoConfig` with these values:
  - `name: "Trophway"`, `slug: "trophway"`, `scheme: "trophway"`
  - `platforms: ["ios", "android"]` (no web)
  - `userInterfaceStyle: "automatic"`
  - placeholder `ios.bundleIdentifier` / `android.package`, both `com.trophway.app` (see Open Questions)
- The New Architecture is the RN 0.86 default, and nothing is overridden.

*Alternatives considered.* A static `app.json`. It is fine today, but the backend integration will soon need per-environment values such as the API base URL. A TS config lets those come from `process.env` and is type-checked. Switching later is cheap either way. The TS form was chosen to avoid churn in the first backend-integration change.

### D7. TypeScript configuration

- `tsconfig.base.json` at the root holds only the strictness and hygiene flags:
  - `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`, `skipLibCheck`
  - no `jsx`, `module`, or `moduleResolution` settings, because those are platform-specific
- `apps/mobile/tsconfig.json` uses `extends: ["expo/tsconfig.base", "../../tsconfig.base.json"]`. In a TS array extend, later entries win, so the repo's strictness overrides Expo's defaults while Expo's RN-specific module and JSX settings are kept.
- The path alias `@/*` → `./src/*` is resolved natively by Metro.
- `include` covers `**/*.ts`, `**/*.tsx`, `.expo/types/**/*.ts`, and `expo-env.d.ts`.
- `typecheck` script: `tsc --noEmit`.
- TypeScript stays on the SDK 57-pinned ~6.0, not 7.0 (see Context).

*Alternatives considered.* A `packages/tsconfig` workspace package. It is the idiomatic choice once shared packages exist, but it is premature with only one consumer. A single root file can move into a package later without touching any consumer except its `extends` path.

### D8. Lint, format, test stack

- **ESLint:** flat config at `apps/mobile/eslint.config.js`, built from `eslint-config-expo` plus `eslint-config-prettier`. It is set up with `expo lint` so that a compatible ESLint major is installed.
- **Prettier:** config at the root. `.prettierignore` excludes lockfiles, build and cache output, and the tool-managed `openspec/` and `.claude/` trees. Those files are generated or regenerated by OpenSpec, and reformatting them would cause churn.
- **Tests:** Jest uses the `jest-expo` preset with `@testing-library/react-native` and its renderer peer. **The `jest` major must match the one `jest-expo` depends on (29.x for SDK 57), not npm `latest` (30.x).** Install it with `expo install` where the package is covered by the SDK, and otherwise pin it by hand.

### D9. Continuous Native Generation, no EAS dependency

- `ios/` and `android/` are generated (`expo prebuild` / `expo run:*`) and git-ignored.
- `.gitignore` also covers:
  - `node_modules`, `.expo`, `dist`, `.turbo`, `coverage`, and `expo-env.d.ts`
  - `.env*.local`
  - signing material: `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`
- Supported local run paths:
  - Expo Go, for fast iteration with no login
  - `expo run:ios` / `expo run:android`, for local native builds (Xcode / Android Studio)
- EAS may be adopted later as an optional convenience but must never be the only build path.
- `expo-dev-client` is not added yet. It arrives with the first custom native module.

### D10. CI: one GitHub Actions workflow

- File: `.github/workflows/ci.yml`. Triggers: `pull_request`, and `push` to `main`. There is no `paths` filter, for two reasons:
  - The JS checks take a minute or two.
  - Path-filtered workflows that end up skipped leave required status checks pending forever.
- Backend jobs will be added to this workflow, or a sibling one, with job-level filtering when `apps/api` lands.
- Steps:
  1. `actions/checkout`
  2. `pnpm/action-setup` (reads `packageManager`)
  3. `actions/setup-node` with `node-version-file: .nvmrc` and the pnpm cache
  4. `pnpm install --frozen-lockfile`
  5. `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm format:check`, each as its own step so the failing step is named
- Env: `TURBO_TELEMETRY_DISABLED=1`, `EXPO_NO_TELEMETRY=1`. No secrets.
- Actions are pinned to major version tags. SHA pinning is optional extra hardening.

## Risks / Trade-offs

- **Isolated pnpm installs break a native module's autolinking or Metro resolution.** → Switch to `nodeLinker: hoisted` (D2). The change is a single setting and is reversible.
- **The newest pnpm major (12.x) has an incompatibility with Expo CLI's package-manager detection or `expo install`.** → Pin the previous pnpm major in `packageManager`. Nothing else depends on the exact major.
- **pnpm's blocked lifecycle scripts silently skip a needed postinstall.** → Watch for pnpm's "ignored build scripts" notice during the first install, and allowlist only what is required (D2).
- **Expo Go from the app stores stops supporting SDK 57 once a newer SDK ships.** → `expo run:ios|android` local builds are a documented first-class path (D9), and SDK upgrades are routine follow-up changes.
- **Transitive dependencies carry licenses outside the policy.** Build tooling often pulls in data-only packages such as `caniuse-lite` (CC-BY-4.0). → Direct dependencies are all vetted in proposal.md. Automated transitive auditing is tracked as an open question and is not claimed as done.
- **Expo Router's optional peers (web, reanimated, gesture-handler) produce pnpm peer warnings.** → Accept warnings about optional peers. Do not install web packages, because they would contradict the mobile-only requirement.
- **A test file placed under `src/app/` becomes a route.** → Tests live in `apps/mobile/__tests__/` (D5), and the README states this convention.
- **Metro fails to resolve a future `packages/*` library.** → Expo SDK 52+ configures Metro for monorepos automatically, so no custom `metro.config.js` is added now. Add one only if the first shared package proves it necessary.
- **Trade-off: formatting runs outside turbo, so it is not cached.** Prettier over this repo size is fast, and one root invocation is simpler than a per-package format task.

## Migration Plan

This is a greenfield addition with no data or runtime to migrate. The change lands as a single PR. Rollback means reverting that PR, which removes all root tooling and `apps/mobile` and leaves `openspec/` and `.claude/` untouched.

## Open Questions

- **Final iOS bundle identifier and Android application ID.** The placeholder is `com.trophway.app`. It is a config-only change until the first store submission, and permanent after it. This must be decided before any store or TestFlight build.
- **Automated transitive license audit.** Should CI gain a job that fails on licenses outside the permissive allowlist? That would need its own tool choice, license-vetted in turn, and an agreed exception list (for example CC-BY-4.0 data packages). It is proposed as a follow-up change.
