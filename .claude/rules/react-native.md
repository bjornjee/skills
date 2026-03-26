---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/package.json"
  - "**/app.json"
---
# React Native

- Build system: expo-dev-client, not Expo Go.
- Isolated environments per feature: unique Metro port, dedicated AVD/Simulator per worktree.
- Connection modes: `usb` (adb reverse + localhost), `wifi` (LAN IP), `emulator` (10.0.2.2).
- Prefer cloud-hosted signaling for WebRTC — local servers cause ICE failures on non-home networks.
- adb reverse only forwards TCP, not UDP — plan around this for media protocols.
