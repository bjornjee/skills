---
name: react-native-patterns
description: REQUIRED when writing React Native or Expo code (.ts, .tsx files in a React Native project). Enforces expo-dev-client, expo-router, typed context/hooks patterns, worktree isolation, and platform-specific setup.
---

# React Native Conventions — Mandatory

These are not suggestions. Every rule below MUST be followed in React Native projects.

## When to Activate

- Any task involving `.ts` or `.tsx` files in a React Native / Expo project
- Setting up development environments, emulators, or simulators
- This skill activates implicitly for React Native work

## Platform

- Build system: `expo-dev-client`, not Expo Go.
- Router: `expo-router` with file-based routing. Route groups use `(groupName)/` directories.
- Connection modes: `usb` (adb reverse + localhost), `wifi` (LAN IP), `emulator` (10.0.2.2).
- Prefer cloud-hosted signaling for WebRTC — local servers cause ICE failures on non-home networks.
- `adb reverse` only forwards TCP, not UDP — plan around this for media protocols.

## Project Structure

```
app/                    # expo-router pages (file-based routing)
  _layout.tsx           # Root layout
  (groupName)/          # Route groups
  index.tsx             # Home screen
src/
  components/           # UI components, grouped by feature domain
    ui/                 # Shared/generic UI primitives
  hooks/                # Custom hooks (useXxx.ts)
  providers/            # React context providers (XxxProvider.tsx)
  services/             # API clients, SDK wrappers (pure logic, no React)
  types/                # TypeScript type definitions
  config/               # App configuration
  constants/            # App-wide constants
```

## Component Patterns

### Typed Context + Provider + Hook

Every context follows this three-file pattern:

```tsx
// providers/FooProvider.tsx
import { createContext, useState } from "react";

export interface FooContextType {
  value: string;
  setValue: (v: string) => void;
}

export const FooContext = createContext<FooContextType>({
  value: "",
  setValue: () => {},
});

export function FooProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState("");
  return (
    <FooContext.Provider value={{ value, setValue }}>
      {children}
    </FooContext.Provider>
  );
}
```

```tsx
// hooks/useFoo.ts
import { useContext } from "react";
import { FooContext, FooContextType } from "@/providers/FooProvider";

export function useFoo(): FooContextType {
  const ctx = useContext(FooContext);
  if (!ctx) {
    throw new Error("useFoo must be used within a FooProvider");
  }
  return ctx;
}
```

Rules:
- Export the context type as an interface.
- Default context value matches the interface shape (use no-ops for functions).
- Hook throws if used outside the provider — fail fast over silent undefined.
- One provider per concern. Compose in `_layout.tsx`, not in a god-provider.

### Custom Hooks

- Name: `useXxx.ts` — one hook per file.
- Return typed objects, not tuples (except trivial `[value, setter]` patterns).
- Keep hooks pure: accept dependencies as parameters, not via module-level imports.
- Use `useCallback` and `useMemo` for stable references passed to children.

### Services

- Services are plain TypeScript — no React imports, no hooks.
- One service file per external integration (e.g., `livekit.ts`, `diagnosis.ts`).
- Accept configuration via parameters, not environment reads.

## Styling

- Use Expo's built-in styling: `StyleSheet.create()`.
- Shared design tokens (colors, spacing, typography) in `src/constants/`.
- Prefer `expo-linear-gradient`, `expo-blur` over third-party equivalents.

## TypeScript

- Strict mode. No `any` unless interfacing with untyped third-party code.
- Path aliases: `@/` maps to `src/`. Always use `@/` imports from `app/` files.
- Interfaces over type aliases for object shapes. `type` for unions and mapped types.

## Testing

- Framework: `jest` with `jest-expo` preset.
- Test hooks with `@testing-library/react-hooks` or `renderHook`.
- Test services as plain unit tests — no React required.
- Mock native modules in `jest.setup.ts`, not inline.

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
