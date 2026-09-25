# Spec Delta

## Purpose

Defines the baseline runtime behavior of the Trophway mobile app: how it launches on iOS and Android, how the navigation shell resolves known and unknown routes, and which platforms it targets. Every feature screen builds on this shell.

## ADDED Requirements

### Requirement: App launches on iOS and Android

The mobile app SHALL build and launch on both an iOS simulator and an Android emulator from a clean checkout using only the documented local development commands. On a successful launch it SHALL show the home screen with no red-box error or unhandled-exception overlay.

#### Scenario: Launch on iOS simulator
- **WHEN** a developer follows the documented setup on a clean checkout and starts the app on an iOS simulator
- **THEN** the app opens and shows the home screen
- **AND** no runtime error overlay appears

#### Scenario: Launch on Android emulator
- **WHEN** a developer follows the documented setup on a clean checkout and starts the app on an Android emulator
- **THEN** the app opens and shows the home screen
- **AND** no runtime error overlay appears

### Requirement: Home route renders a placeholder home screen

The app's root route SHALL render a home screen that shows the product name "Trophway". The screen's content SHALL stay inside the device safe area, so it is not hidden behind a notch, status bar, or home indicator.

#### Scenario: Root route shows product name
- **WHEN** the app opens at its root route
- **THEN** the text "Trophway" is visible on screen

#### Scenario: Content respects safe area
- **WHEN** the home screen is shown on a device with a notch or home indicator
- **THEN** no home-screen text is covered by system UI

#### Scenario: Automated home screen smoke test
- **WHEN** the app's automated test suite runs on the unmodified scaffold
- **THEN** a test renders the home route and asserts that "Trophway" is visible
- **AND** the test passes

### Requirement: Unknown routes show a not-found screen

When the app is asked to open a route that does not exist, it SHALL show a not-found screen instead of crashing or showing a blank screen. The not-found screen SHALL give the user a control that goes back to the home screen.

#### Scenario: Deep link to a non-existent route
- **WHEN** the app is opened via a deep link to a path that matches no route (for example `trophway://does-not-exist`)
- **THEN** a not-found screen is shown
- **AND** the app does not crash

#### Scenario: Return home from not-found
- **WHEN** the user activates the "go to home" control on the not-found screen
- **THEN** the home screen is shown

### Requirement: App registers the `trophway` deep-link scheme

The app SHALL register the custom URL scheme `trophway`, so that `trophway://` URLs open the app on both iOS and Android.

#### Scenario: Open app via root deep link
- **WHEN** the URL `trophway://` is opened on a device or simulator where the app is installed
- **THEN** the app opens and shows the home screen

### Requirement: Mobile platforms only

The app SHALL be configured to target only iOS and Android. A web build target SHALL NOT be enabled.

#### Scenario: Web target is not available
- **WHEN** the app's platform configuration is inspected
- **THEN** it lists only iOS and Android as supported platforms
