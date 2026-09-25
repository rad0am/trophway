# Spec Delta

## Purpose

Defines the developer-facing contract of the repository root: how the monorepo is installed, which toolchain versions are pinned, which quality checks can run from the root across all JavaScript/TypeScript workspaces, and what CI enforces. The same root serves both the mobile app and the future backend.

## ADDED Requirements

### Requirement: Single root install

A developer SHALL be able to install dependencies for every JavaScript/TypeScript workspace with one install command run at the repository root. A dependency lockfile SHALL be committed. Installing with the lockfile frozen SHALL succeed on a clean checkout.

#### Scenario: Fresh clone install
- **WHEN** a developer runs the documented install command at the root of a fresh clone
- **THEN** dependencies for all workspaces, including `apps/mobile`, are installed
- **AND** no install command has to be run inside a workspace directory

#### Scenario: Frozen lockfile install
- **WHEN** the install runs in frozen-lockfile mode on a clean checkout
- **THEN** it succeeds without changing the lockfile

### Requirement: Pinned toolchain versions

The repository SHALL pin the Node.js major version and the exact package-manager version in version-controlled files. Local development and CI SHALL both use these pins.

#### Scenario: Node version is declared
- **WHEN** a developer inspects the repository root
- **THEN** a version file names the required Node.js major version

#### Scenario: Package manager version is declared
- **WHEN** a developer inspects the root package manifest
- **THEN** it names the exact package-manager name and version

### Requirement: Root-level quality tasks

The repository root SHALL expose `lint`, `typecheck`, and `test` scripts that run the matching task in every JavaScript/TypeScript workspace that defines it. It SHALL also expose `format` and `format:check` scripts that apply to the whole repository. Each script SHALL exit non-zero when any workspace, or any checked file, fails.

#### Scenario: Clean scaffold passes all checks
- **WHEN** `lint`, `typecheck`, `test`, and `format:check` are run from the root on the unmodified scaffold
- **THEN** each exits with status 0

#### Scenario: Lint failure in a workspace fails the root task
- **WHEN** a lint violation is introduced in `apps/mobile` and `lint` is run from the root
- **THEN** the command exits non-zero and reports the offending file

#### Scenario: Type error in a workspace fails the root task
- **WHEN** a type error is introduced in `apps/mobile` source and `typecheck` is run from the root
- **THEN** the command exits non-zero and reports the offending file

#### Scenario: Unformatted file fails format check
- **WHEN** a tracked source file is not formatted to the repository's formatting rules and `format:check` is run from the root
- **THEN** the command exits non-zero and names the file

#### Scenario: Unchanged re-run is cached locally
- **WHEN** `lint`, `typecheck`, or `test` is run twice from the root with no file changes in between
- **THEN** the second run reuses local cached results for unchanged workspaces
- **AND** no remote cache or network service is contacted

### Requirement: Strict TypeScript

All TypeScript workspaces SHALL compile with strict type checking enabled. Shared compiler options SHALL be defined once at the repository root, and workspaces SHALL inherit them.

#### Scenario: Implicit any is rejected
- **WHEN** a function parameter without a type annotation (implicit `any`) is added to `apps/mobile` source and `typecheck` is run
- **THEN** the typecheck fails

### Requirement: Workspace layout accommodates non-JS layers

The repository SHALL use the layout `apps/<name>` for deployable applications and `packages/<name>` for shared libraries. A directory under `apps/` or `packages/` that is not a JavaScript/TypeScript workspace (for example the future .NET backend at `apps/api`) SHALL NOT break the root install or the root quality tasks.

#### Scenario: Non-JS app directory is ignored
- **WHEN** a directory with no JavaScript package manifest exists under `apps/`
- **THEN** the root install and the root `lint`, `typecheck`, and `test` scripts still succeed
- **AND** they do not try to process that directory

### Requirement: Generated native projects are not committed

Native iOS and Android project directories generated from the app configuration SHALL be excluded from version control, along with other build output, caches, local environment files, and signing credentials.

#### Scenario: Native generation leaves git clean
- **WHEN** a developer generates native projects or runs a local native build for `apps/mobile`
- **THEN** the generated `ios/` and `android/` directories and build caches do not appear as untracked changes in git

### Requirement: Local development requires no paid service or account

A developer SHALL be able to install, lint, typecheck, test, and run the mobile app on a local simulator or emulator without an Expo/EAS account, a paid remote build service, a remote cache account, or any paid API key.

#### Scenario: Run without a hosted-service account
- **WHEN** a developer who is not signed in to any hosted build or cache service follows the documented setup
- **THEN** they can run every root quality task and launch the app on a local simulator or emulator

### Requirement: CI enforces quality checks on pull requests

The repository SHALL run an automated CI check on every pull request that touches JavaScript/TypeScript workspaces or root tooling. The check SHALL perform a frozen-lockfile install and then run `lint`, `typecheck`, `test`, and `format:check`, and SHALL report failure if any step fails. CI SHALL use the pinned toolchain versions and SHALL NOT require repository secrets.

#### Scenario: Passing pull request
- **WHEN** a pull request against the unmodified scaffold is opened
- **THEN** the CI check runs all steps and reports success

#### Scenario: Failing pull request
- **WHEN** a pull request introduces a lint violation, type error, failing test, or unformatted file
- **THEN** the CI check reports failure for the step that failed
