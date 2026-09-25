# Proposal

## Why

The repository has OpenSpec tooling but no application code yet. Every upcoming mobile feature (PSN linking, trophy lists, leaderboards, profile comparison) needs a working React Native app plus a monorepo layout where the .NET backend can live beside it later. Setting the workspace structure, toolchain pins, and quality gates now avoids later restructuring that would touch every feature.

## What Changes

- Turn the repo root into a **pnpm workspace** (`apps/*`, `packages/*`), orchestrated by **Turborepo**, with pinned Node and pnpm versions.
- Add a new **Expo (SDK 57) + TypeScript** app at `apps/mobile` (package `@trophway/mobile`). It uses **Expo Router** file-based routing under `apps/mobile/src/app/`.
- Ship a minimal app shell: root stack layout, a placeholder home screen, a not-found screen, and a `trophway://` deep-link scheme. Only the iOS and Android targets are enabled (no web).
- Add strict TypeScript config. The shared compiler options live in a root `tsconfig.base.json` that future `packages/*` will extend.
- Add root-level quality tasks: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format` / `pnpm format:check`. They run across all JS workspaces through Turborepo, using the local cache only.
- Add ESLint (`eslint-config-expo`), Prettier, and a Jest (`jest-expo`) + React Native Testing Library smoke test for the home screen.
- Use Continuous Native Generation: the generated `ios/` and `android/` directories are git-ignored, not committed.
- Add a GitHub Actions CI workflow that runs install (frozen lockfile), lint, typecheck, test, and format check on pull requests.
- Nothing requires a paid service. EAS / Expo accounts and Turborepo remote cache are **not** used or required.

No existing behavior changes (greenfield). There are no breaking changes.

### Layers touched

- **Mobile (RN/Expo)**: yes, the new `apps/mobile` app.
- **Repo-root tooling** (shared by all layers): yes, covering the workspace, task runner, formatting, and CI.
- **Backend (.NET)**: no. The layout reserves `apps/api` for it, but nothing is created there.
- **Database (PostgreSQL)**: no.
- **Cache (Redis)**: no.

This change does not touch PSN account linking or trophy sync, so no PSN ToS note is required.

### New dependencies and licenses

All licenses below were checked against the permissive-OSS policy in project context. Every one of them complies.

| Package / tool | Purpose | License |
|---|---|---|
| `expo` | App runtime / CLI | MIT |
| `expo-router` | File-based navigation | MIT |
| `react`, `react-native` | UI runtime | MIT |
| `react-native-screens`, `react-native-safe-area-context` | Expo Router native deps | MIT |
| `expo-linking`, `expo-constants`, `expo-status-bar` | Expo Router / shell deps | MIT |
| `@expo/metro-runtime`, `@expo/log-box` | Required peers of `expo-router`, declared explicitly | MIT |
| `typescript` | Type checking | Apache-2.0 |
| `@types/react`, `@types/jest` | Type definitions | MIT |
| `eslint`, `eslint-config-expo`, `eslint-config-prettier` | Linting | MIT |
| `prettier` | Formatting | MIT |
| `jest`, `jest-expo`, `@react-native/jest-preset` | Test runner + Expo preset (+ its required peer) | MIT |
| `@testing-library/react-native` (13.x) + `react-test-renderer` | Component tests | MIT |
| `turbo` | Monorepo task runner (local cache only) | MIT |
| `pnpm` | Package manager / workspaces | MIT |
| `create-expo-app` | One-time generator, not a runtime dependency | BSD-3-Clause |
| GitHub Actions: `actions/checkout`, `actions/setup-node`, `pnpm/action-setup` | CI | MIT |

Transitive dependencies are not audited one by one in this change. See the open question in `design.md` about adding an automated license check.

## Capabilities

### New Capabilities

- `mobile-app-shell`: the Expo/React Native app's baseline runtime behavior. It launches on iOS and Android, has a routing shell with a home route and a not-found route, handles the deep-link scheme, and targets mobile platforms only.
- `monorepo-tooling`: repo-root developer tooling. It covers the single-install workspace, pinned toolchain, root-level lint/typecheck/test/format tasks, room for non-JS layers, CI checks, and running locally without paid services.

### Modified Capabilities

None. There are no existing specs.

## Impact

- **New files at repo root**: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `tsconfig.base.json`, `.nvmrc`, `.editorconfig`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, and `.github/workflows/ci.yml`.
- **New directory**: `apps/mobile/`, containing the Expo app, its config, source, assets, and tests.
- **Reserved, not created**: `apps/api/` (.NET backend, future change) and `packages/` (shared TS packages, future change).
- **Docs**: `README.md` gains a "Getting started" section with prerequisites and root commands. `CONTRIBUTING.md` is unchanged.
- **Developer prerequisites**: Node 24 LTS, pnpm (pinned via `packageManager`, enabled through corepack), and Xcode / Android Studio for simulator runs. No Expo account is needed.
- **CI**: new GitHub Actions workflow. It is free for this repo's usage level, and no paid runners or secrets are needed.
