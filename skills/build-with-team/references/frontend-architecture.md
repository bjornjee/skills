# Frontend: shared behavior and consumer policy

Inspect intended screens together before assigning independent screen work. Name
shared behavior, owning paths, consumers, state ownership, and inputs/events. Reuse
an existing component when its responsibility fits. Planned consumers can establish
shared needs before duplicated code exists.

## Design preview and agreement

Resolve visual authority before designing screens:

1. A theme or client resource/website explicitly selected by the user for design
   controls the visual direction.
   Inspect that source; do not blend in DeployCo branding unless requested.
2. For changes without a redesign request, preserve the application's approved theme.
3. Otherwise use `@deploy-co/design-system` and the DeployCo Brand System PDF.

Inspect the package's available components, tokens and consumption guidance, and
the PDF's relevant pages. Record the selected sources and reusable components in
the existing design/brief artifact. The package supplies reusable interaction and
token primitives; the brand reference supplies visual direction, not product layout.
Use suitable package components when compatible with the stack. For native or
non-React UI, adapt the reference's visual principles using platform components;
do not change frameworks or copy the package internals just to imitate it.
Client themes can use the package's product-local theming without replacing its
accessible behavior. Verify the installed/approved version; do not pin a moving
prerelease in this skill.

Known reference locations: the canonical repository is
`https://github.com/deploy-co/design-system` (local checkout, when available:
`/Users/bjornjee/Code/deployco/design-system`); the supplied brand reference is
`/Users/bjornjee/Downloads/DeployCo Brand System.pdf`. These are discovery hints,
not prerequisites at those paths. Resolve project-provided or available copies;
if unavailable, identify the missing source rather than claim to have inspected it.
The PDF's colour guidance (pages 10–11) uses a white/grey/black foundation with
sparing accents. Inspect typography, components and imagery too; a palette alone
is not a design system. Do not substitute a package's generic defaults for a
contradictory user-approved brand reference.

Before dependent UI implementation, use Impeccable's planning guidance to establish
the flow and show legible screen-preview images in the conversation, with artifact
links for reopening. Prefer rendered design prototypes using actual components;
ImageGen mockups are also proposals, never proof of implemented behavior. Keep
prototype work limited to design review, without committing backend or domain choices.

Show a representative journey with realistic content and density, covering distinct
layouts and consequential interactions. Include an empty, loading, error/recovery or
narrow-screen view when it changes a design decision. Approve the visual system and
flow, not a mockup of every state; apply approved patterns to the remaining screens.
A lone attractive landing screen cannot approve a multi-screen workflow.
Annotate the action, next state, shared component and source inspiration where needed.
Label previews as proposed screens, not screenshots of a working product.

Present these with the conceptual architecture image and separate Markdown source
tree at one proposal checkpoint. Ask through the main skill's interview for agreement
on the flow and visual direction; reuse explicit prior agreement. Keep approval scoped
to what was shown and revisit material departures, not every routine layout adjustment.
For a screen addition, reuse approved architecture/source artifacts when their
boundaries remain valid; show only the affected flow and visual changes.
Then implement against the agreed previews and verify actual screenshots and live
interactions with the UI/UX design-loop guidance. A grader's score cannot override
the user's selected direction or substitute for user-flow smoke testing.

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
