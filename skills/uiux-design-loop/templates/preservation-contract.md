# Preservation Contract

> Fill this in before Gate 1 of `/skills:uiux-design-loop`. Every reachable surface not being redesigned must be listed here. "Out of scope" means "preserve compatibility," not "ignore."

## In-scope redesign surfaces

List the exact pages, routes, components, or states the redesign is allowed to change.

| Surface | Path / selector / state | Intended change |
|---|---|---|
| `<surface>` | `<route or component>` | `<what may change>` |

## Compatibility surfaces

List every reachable surface that must keep working and visually remain compatible while the redesign happens.

| Surface | How to reach it | Preserve visually? | Preserve behavior? |
|---|---|---|---|
| `<surface>` | `<click path, route, or tab>` | `Yes / No` | `Yes / No` |

## Dependencies

For each compatibility surface, enumerate the JS primitives and CSS classes it depends on. Use concrete names from the app, not prose descriptions.

| Surface | JS primitives | CSS classes | Notes |
|---|---|---|---|
| `<surface>` | `<function, event handler, import, data key>` | `<class names>` | `<risk or invariant>` |

## Explicit non-goals

List surfaces that are unreachable or intentionally excluded, with the reason.

| Surface | Reason excluded | User accepted? |
|---|---|---|
| `<surface>` | `<why it is safe to skip>` | `Yes / No` |
