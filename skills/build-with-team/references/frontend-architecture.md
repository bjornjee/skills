# Frontend architecture

Treat scaffolds as examples, not requirements. Choose structure from the application's
needs, framework, and existing conventions. Adopt useful parts of a supplied template
after checking fit and setup; empty folders alone demonstrate nothing.

## Establish ownership before parallel screen work

Inspect the planned screens together. In the project brief, name the shared
capabilities, their owning paths, consumers, and interfaces. These responsibility
categories can help; they need not become separate directories or layers:

| Responsibility | Owns | Reuse boundary |
| --- | --- | --- |
| Theme and primitives | Semantic tokens, typography, controls, interaction/accessibility states | No feature logic, routing, or application data fetching |
| Shared application components | Repeated domain interactions, such as a model selector | Explicit props/events; one implementation used by its consumers |
| Feature | Its components, state, domain rules, and data access | Keep feature-specific behavior here; expose deliberate cross-feature interfaces |
| App composition | Routes, providers, navigation, and feature assembly | Compose features rather than duplicate their logic |

Define shared UI states as part of the contract: loading, disabled, error, empty,
and relevant keyboard/focus or native accessibility behavior. Give data fetching
and state transitions a named owner; primitives consume values and callbacks.

Build the minimum foundation required by the planned consumers. Shared needs can
be clear before code exists; do not wait for duplication to justify them.
Extend an existing component when its responsibility fits. Keep distinct behavior
local when combining it would require unrelated modes or feature flags.

## Folder layout

One possible organization, illustrating the responsibilities above:

```text
src/
  app/                  Routes, providers, composition
  components/ui/        Domain-independent controls
  components/shared/    Components consumed across features
  features/<feature>/   Feature UI, hooks, domain types, data access, tests
  theme/                Shared design tokens
  lib/                  Shared technical clients and adapters
```

Adapt, combine, or omit these folders. Preserve a coherent existing layout;
do not reorganize it merely to match this example. Respect framework-owned route
locations and create directories only when they help organize actual code.

Choose dependency boundaries that keep reusable code independent of its consumers.
For example, domain-independent controls should not depend on feature implementations.
Cross-feature consumers use the owner's declared interface, not private files.
Colocate feature-only hooks, types, and tests; promote them when actual consumers
need them. Avoid catch-all `core/` or `utils/` folders without a defined responsibility.

## Demonstrate reuse

Before dependent screen work, implement representative consumers of the shared
contract. When two screens need it, both should import the same implementation.
Give workers those paths and examples; changes to shared contracts must account
for existing consumers.

During integration, trace imports and inspect rendered behavior. Check for copied
controls, competing token values, duplicated state/data logic, and dependency
violations. Two similar screenshots do not prove reuse; one import does not prove
the component handles both screens correctly. A library addition or boundary check
should address an observed need, not become mandatory template infrastructure.

## Evidence behind this guidance

KPJ privacy at revision `1403d1c` provides concrete reuse examples:

- [`ModelSelector`](https://github.com/deploy-co/sales-kpj-privacy/blob/1403d1cf01f395adb2cf205b9962d5d6750aa0b5/frontend/src/ModelSelector.tsx)
  accepts options, selection, disabled state, and a callback instead of fetching data.
- [`ChatSurface`](https://github.com/deploy-co/sales-kpj-privacy/blob/1403d1cf01f395adb2cf205b9962d5d6750aa0b5/frontend/src/ChatSurface.tsx)
  and [`LiveTranscription`](https://github.com/deploy-co/sales-kpj-privacy/blob/1403d1cf01f395adb2cf205b9962d5d6750aa0b5/frontend/src/LiveTranscription.tsx)
  both import `ModelSelector` and `FindingAnnotation`.

These are inspected ownership and reuse patterns, not certification of the whole
project. The folder layout above is illustrative, not KPJ's existing structure.
The guidance is self-contained; source links are optional examples, not prerequisites.
