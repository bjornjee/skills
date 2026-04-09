---
name: react-native-patterns
description: REQUIRED when writing React Native or Expo code (.ts, .tsx files in a React Native project). Enforces expo-dev-client, worktree isolation with unique Metro ports, and platform-specific setup for Android AVDs and iOS Simulators.
---

# React Native Conventions — Mandatory

These are not suggestions. Every rule below MUST be followed in React Native projects.

## When to Activate

- Any task involving `.ts` or `.tsx` files in a React Native / Expo project
- Setting up development environments, emulators, or simulators
- This skill activates implicitly for React Native work

## Platform

- Build system: `expo-dev-client`, not Expo Go.
- Connection modes: `usb` (adb reverse + localhost), `wifi` (LAN IP), `emulator` (10.0.2.2).
- Prefer cloud-hosted signaling for WebRTC — local servers cause ICE failures on non-home networks.
- `adb reverse` only forwards TCP, not UDP — plan around this for media protocols.

## Worktree Environment Isolation

Each feature worktree gets a unique Metro port to avoid conflicts:

- Main project uses default port `8081`.
- Worktrees start from `8082`, incrementing.
- Scan all worktrees for `.metro-port` files to find ports in use. Verify with `lsof`.
- Write the assigned port to `.metro-port` in the worktree root.

### Android

- AVDs are named `feat-<feature_name>`.
- Created via `avdmanager`, device `pixel_6`.

### iOS

- Simulators are named `feat-<feature_name>`.
- Created via `xcrun simctl`, device `iPhone 16`.
- Store the Simulator UUID in `.sim-uuid` in the worktree root.

Ask the user which platform(s) to set up: Android, iOS, or Both.

## Cleanup

When tearing down a worktree environment:

1. Kill Metro process on the assigned port (read from `.metro-port`).
2. Delete Android AVD `feat-<feature_name>` via `avdmanager`.
3. Shut down and delete iOS Simulator (prefer UUID from `.sim-uuid`, fall back to name).
4. Remove marker files: `.metro-port`, `.sim-uuid`.
