# Behavior Check

> Fill this in before every grader dispatch of `/skills:uiux-design-loop`. Run the live app through the selected journeys and controls from `flow-map.md`, plus every compatibility surface from `preservation-contract.md`. Journey results feed the existing flow/affordance dimensions; the preservation state below remains a separate acceptance gate.

## Preservation gate state

**State:** `PASS | WARN | FAIL | N/A`

| State | When |
|---|---|
| `PASS` | Every preservation surface has `Pass` with fresh evidence; nothing in `preservation-contract.md` is missing from this file. |
| `WARN` | Required evidence is missing/stale or a visual deviation needs authorization, with no confirmed blocking defect. |
| `FAIL` | Any preservation surface has `Fail`. |
| `N/A` | `preservation-contract.md` explicitly has no surfaces to preserve. Behaviors within the redesign scope can still require preservation. |

`WARN` and `FAIL` block successful acceptance. Repair and verify within the remaining budget; if it is exhausted, stop and report incomplete verification or unresolved defects as SKILL.md requires. An authorized intentional contract change must be recorded and verified against the revised contract.

## Run context

| Field | Value |
|---|---|
| URL / environment | `<live URL or local URL>` |
| Browser / viewport | `<browser and dimensions>` |
| Source revision / content fingerprint | `<identifier including uncommitted edits>` |
| Captured at | `<timestamp>` |

## Journey and control results

Use IDs from the flow map. Cover every scoped control or justified equivalent group, and run complete selected journeys through real controls rather than jumping between screens. Capture relevant recovery and keyboard/focus behavior; omitted required checks are `Unverified`, never successful empty results.

| Journey / control IDs | Preconditions and actual steps | Expected result | Observed destination, state, persistence and recovery | Result | Evidence |
|---|---|---|---|---|---|
| J1 / C1 | `<data, mode, clicks, inputs, keys>` | `<completion contract>` | `<actual result; focus; save/reopen or reload where promised>` | `Pass / Fail / Unverified` | `<trace or observed DOM/state, screenshots, timestamp>` |

Distinguish the declared persistence boundary: navigating away and reopening can prove a local draft transaction; it does not establish durable storage. For Save/Cancel, compare all changed draft content with the committed state. Check downstream selection, counts, previews, or consumers where the journey depends on them. A success toast alone proves no effect.

## Preservation surfaces

Reference the result rows above where they already prove compatibility; do not repeat the journey.

| Surface | Result row / steps run | Result | Evidence | Console messages / applicable computed styles |
|---|---|---|---|---|
| `<contract surface>` | `<J1 / C1 or additional steps>` | `Pass / Fail / Unverified` | `<observed result or trace>` | `<observed values or messages>` |

## Simulation and verification gaps

Name which integrations were exercised, simulated, disabled, or unavailable, and what resets on reload. Record untested required branches and why. A prototype PASS is limited to its declared simulation; required product integration or persistence that was not exercised remains unverified.

## Failures

For every failed surface, record the exact behavior and the concrete repair required.

| Surface | Failure | Blocking? | Tradeoff file |
|---|---|---|---|
| `<surface>` | `<what failed>` | `Yes / No` | `<tradeoff path or n/a>` |
