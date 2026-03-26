---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/package.json"
  - "**/app.json"
---
# React Native

## Platform
- Build system: expo-dev-client, not Expo Go.
- Connection modes: `usb` (adb reverse + localhost), `wifi` (LAN IP), `emulator` (10.0.2.2).
- Prefer cloud-hosted signaling for WebRTC — local servers cause ICE failures on non-home networks.
- adb reverse only forwards TCP, not UDP — plan around this for media protocols.

## Worktree Environment Isolation
- Each feature worktree gets a unique Metro port.
- Main project uses default port `8081`. Worktrees start from `8082`, incrementing.
- Scan all worktrees for `.metro-port` files to find ports in use. Verify with `lsof`.
- Write the assigned port to `.metro-port` in the worktree root.
- AVDs are named `feat-<feature_name>`. Created via `avdmanager`, device `pixel_6`.
- iOS Simulators are named `feat-<feature_name>`. Created via `xcrun simctl`, device `iPhone 16`.
- Store the Simulator UUID in `.sim-uuid` in the worktree root.
- Ask the user which platform(s) to set up: Android, iOS, or Both.

## Cleanup
- Kill Metro process on the assigned port (read from `.metro-port`).
- Delete Android AVD `feat-<feature_name>` via `avdmanager`.
- Shut down and delete iOS Simulator (prefer UUID from `.sim-uuid`, fall back to name).
- Remove marker files: `.metro-port`, `.sim-uuid`.
