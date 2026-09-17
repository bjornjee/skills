# React Native: composition and resource ownership

Apply [frontend ownership and reuse](frontend-architecture.md). This reference adds
native lifetimes and a concrete arrangement; preserve a suitable existing router,
state manager, and Expo or bare React Native setup.

## Observed structure: car inspection

Selected paths at `3be2132`:

```text
mobile-reactnative/
  app/                         Expo routes and navigation composition
  src/
    components/
      ui/                      Button, Typography, StatusPill, etc.
      review/                  Review-specific compositions
      recording/
      engine/
      enriched-review/
    hooks/
    providers/
    services/
    types/
    constants/
```

The review route imports shared UI and review-specific cards, inspection/audio hooks,
providers, report operations, and summary functions. `components/ui/Button.tsx` owns
visual variants, loading/disabled behavior, and accessibility state; it consumes the
theme and receives `onPress`. `services/reviewSummary.ts` is a plain TypeScript
calculation without native rendering imports.

These paths demonstrate distinct responsibilities rather than mandate a folder
count. The inspected review route still has substantial screen orchestration; do not
copy its size or assume every existing route is thin.

## Scaffold intent and adaptation

The user's React Native scaffold at `52137d6` separates platform-independent
`core/{hooks,models,services,constants,utils}`, shared `components`, thin `screens`,
and `navigation`. Most are placeholders. Extract the intended separation, not its
bare React Native installation procedure or its exact names. The inspected car
application uses Expo routing instead. Keep reusable components outside route-owned
locations when the router treats files there as routes.

## Boundaries to establish

- Screens compose controls and invoke owned behavior. Domain calculations and data
  contracts should not depend on native rendering or navigation when unnecessary.
- Put native permissions, capture, playback, storage, and platform differences at
  their actual boundaries. A device hook can be native-specific; do not describe
  it as platform-independent merely because it is in `core/`.
- Give each long-lived session, subscription, or connection one owner. Its lifetime
  follows requirements across navigation, backgrounding, denial, and disconnection.
- Share UI only when behavior and accessibility requirements align. Theme and
  control behavior should remain consistent without absorbing feature policy.

## Counterexample and proof

If a capture flow must keep recording while a guidance overlay opens, both screens
must not independently start a camera session. The flow owns it; the overlay reads
status and requests actions. If capture should end with its sole screen, keep that
shorter ownership instead of adding a global manager. This is an illustrative change
scenario, not an executed lifecycle trial of the source app.

Exercise shared controls in real screen contexts. For affected device resources,
verify entry, interruption, navigation, exit, and re-entry on target platforms;
check release and duplicate sessions. Unit tests can establish independent domain
calculations; web screenshots cannot establish native lifecycle behavior.

## Source provenance

[Scaffold intent](https://github.com/bjornjee/scaffold-templates/blob/52137d61f758739d50c9dade0d8ed0ce8dcbd236/react-native-app/README.md),
[review route](https://github.com/deploy-co/sales-car-inspection-demo/blob/3be2132217494afd2e0f19a5fd81daee546b394c/mobile-reactnative/app/%28review%29/index.tsx),
[shared button](https://github.com/deploy-co/sales-car-inspection-demo/blob/3be2132217494afd2e0f19a5fd81daee546b394c/mobile-reactnative/src/components/ui/Button.tsx),
[domain calculation](https://github.com/deploy-co/sales-car-inspection-demo/blob/3be2132217494afd2e0f19a5fd81daee546b394c/mobile-reactnative/src/services/reviewSummary.ts).
These are inspected sources, not a new execution or blanket quality certification.
