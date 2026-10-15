# Preservation Contract

> Fill this in before Gate 1 of `/skills:uiux-design-loop`. List compatibility surfaces affected by the declared journeys, including adjacent entry/exit transitions. Bound the list to the change and its dependencies; do not inventory the entire application. "Out of scope" means "preserve compatibility," not "ignore."

## In-scope redesign surfaces

List the exact pages, routes, components, or states the redesign is allowed to change.

| Surface | Path / selector / state | Intended change |
|---|---|---|
| `<surface>` | `<route or component>` | `<what may change>` |

## Compatibility surfaces

List affected surfaces that must keep working and visually remain compatible. Reference flow-map IDs for saved data, edit/cancel behavior, navigation, selection, shared links, and downstream results that must survive; do not duplicate the control inventory.

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
