# Frontend: shared behavior and consumer policy

Inspect intended screens together before assigning independent screen work. Name
shared behavior, owning paths, consumers, state ownership, and inputs/events. Reuse
an existing component when its responsibility fits. Planned consumers can establish
shared needs before duplicated code exists.

## Observed structure: KPJ web frontend

Selected paths at `d02b69c` are relatively flat:

```text
frontend/src/
  App.tsx
  ChatSurface.tsx
  LiveTranscription.tsx
  ModelSelector.tsx
  FindingAnnotation.tsx
  audioSession.ts
  audioMedia.ts
  transcriptSse.ts
  ...colocated tests
```

Both `ChatSurface` and `LiveTranscription` import `ModelSelector` and
`FindingAnnotation`. The selector's actual public props are:

```typescript
type ModelSelectorProps = {
  disabled: boolean;
  onChange: (modelId: string) => void;
  options: readonly ModelOption[];
  value: string;
};
```

It owns selection presentation and interaction. Its consumers supply options and
control when selection is allowed. Audio session/media/protocol behavior has named
modules rather than being embedded in the selector. Reuse is visible in callers,
not inferred from a `shared/` directory. This is inspected structure, not a claim
that every screen in the project has ideal size or complete behavioral coverage.

## Ownership expectations

| Responsibility | Owns | Keep outside |
| --- | --- | --- |
| Theme and primitives | Semantic tokens, controls, typography, interaction/accessibility states | Feature policy, routing, application fetching |
| Shared domain interaction | Behavior actual consumers must keep consistent | Unrelated consumer modes and special-case workflow policy |
| Feature or screen flow | Its policy, state transitions, data access, compositions | Copies of established shared behavior |
| App composition | Routes, providers, feature assembly | Duplicated domain decisions |

Give fetching and state transitions named owners. UI contracts include applicable
loading, disabled, error, empty, and keyboard/focus states. Primitives consume values
and callbacks. Domain behavior must remain testable without reconstructing rendering
where it does not depend on the platform.

Preserve a coherent flat layout like KPJ's. As ownership becomes hard to locate,
group feature-only components, hooks, types, and tests by capability, and keep
shared primitives separately owned. Exact names such as `features/`, `components/ui/`,
or `theme/` are optional; unrelated features should not import private implementation
files. Avoid catch-all utility folders with no defined responsibility.

## Counterexamples

Copying the selector into both screens duplicates behavior even if screenshots
match. Conversely, giving it `chatMode`, `recordingMode`, and unrelated provider
side effects can turn reuse into coupling. If changing models must first stop a
recording, that policy belongs with the recording flow; the selector emits a change
request and reflects disabled state. This extension is illustrative, not a claim
about the source application's current behavior.

Do not require two implementations of different behavior to become one component
because they look alike. Extract what needs to remain consistent, and keep distinct
consumer policy outside it. A single giant frontend file is not justified merely
because a flat directory is acceptable.

## Demonstrate the boundary

Before dependent screen work expands, exercise representative consumers of the
shared contract. Give workers its paths and working examples. During integration,
trace imports and inspect both rendered interactions, including their different
states. Check duplicated state/data logic, competing tokens, and shared-contract
changes that broke another consumer. One import or a screenshot alone proves too
little; automated import-boundary tooling is optional unless justified by the task.

## Source provenance

The tree and props were extracted from KPJ at `d02b69c`; explanations are usable
without repository access. No new application trial was run for this extraction.

[Selector](https://github.com/deploy-co/sales-kpj-privacy/blob/d02b69cb47eae74634074237640676fa6ca1ecc2/frontend/src/ModelSelector.tsx),
[chat consumer](https://github.com/deploy-co/sales-kpj-privacy/blob/d02b69cb47eae74634074237640676fa6ca1ecc2/frontend/src/ChatSurface.tsx),
[transcription consumer](https://github.com/deploy-co/sales-kpj-privacy/blob/d02b69cb47eae74634074237640676fa6ca1ecc2/frontend/src/LiveTranscription.tsx).
