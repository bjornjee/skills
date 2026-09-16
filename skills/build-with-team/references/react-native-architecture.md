# React Native architecture

Apply [frontend ownership and reuse](frontend-architecture.md). This reference adds
mobile boundaries; it does not prescribe a navigation library, state manager, or
Expo versus bare React Native. Preserve a suitable existing setup.

## Illustrative organization

```text
app/                    Routes when using Expo Router
src/
  features/<feature>/   Screens, feature state, domain behavior, tests
  components/           Shared native UI
  theme/                Semantic tokens and typography
  platform/             Camera, microphone, storage, device integrations
```

Adapt or omit folders. With another router, keep its navigation composition in
the project's existing location. Expo Router treats files in its app directory
as routes, so reusable components belong outside it.
[Expo routing conventions](https://docs.expo.dev/router/basics/core-concepts/).

## Decisions that affect reuse

- Separate reusable domain calculations and data contracts from native rendering
  and device APIs. Share UI across platforms only where behavior and accessibility
  requirements align; visual resemblance alone is insufficient.
- Give long-lived resources one owner: capture sessions, subscriptions, connections,
  and persisted state. Screens request actions through that owner rather than
  independently starting duplicate sessions.
- Keep platform differences at the affected boundary, such as platform-specific
  component files or a device adapter. Do not build a generic device framework
  for a single call.
- Record which behavior must survive navigation, backgrounding, disconnection,
  and permission denial. Those requirements determine state placement and cleanup.

## Evidence

Verify shared controls in their actual screen contexts on the target platforms.
For affected device resources, exercise entry, exit, interruption, and re-entry;
check that resources are released and duplicate sessions are not created.
Web rendering alone does not establish native lifecycle behavior.
