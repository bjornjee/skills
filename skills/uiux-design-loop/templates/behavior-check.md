# Behavior Check

> Fill this in during Gate 4 of `/skills:uiux-design-loop`. Run the live app and verify every compatibility surface from `preservation-contract.md`. This file feeds the grader's `## Preservation gate` block — the state declared at the top is binary against `PASS`, not a 1–5 score.

## Preservation gate state

**State:** `PASS | WARN | FAIL | N/A`

| State | When |
|---|---|
| `PASS` | Every row below has `Pass` with fresh evidence; nothing in `preservation-contract.md` is missing from this file. |
| `WARN` | Surfaces render and basic behavior works, but visible differences exist that `preservation-contract.md` did not authorize. The redesign leaked. |
| `FAIL` | Any row below has `Fail`. |
| `N/A` | `preservation-contract.md` declares no reachable surfaces outside the redesign scope. |

`WARN` and `FAIL` block the loop's exit. Either fix the regression and re-run, or record a tradeoff in `.uiux-loop/tradeoff-preservation.md` that the user signs off on.

## Run context

| Field | Value |
|---|---|
| URL / environment | `<live URL or local URL>` |
| Browser / viewport | `<browser and dimensions>` |
| Build / commit | `<identifier>` |

## Preservation surfaces

| Surface | Steps run | Pass/fail | Evidence | Console messages |
|---|---|---|---|---|
| `<surface>` | `<clicks, tab switches, route, input>` | `Pass / Fail` | `<screenshot, trace, observed DOM text, computedStyle check>` | `<none or messages>` |

## Failures

For every failed surface, record the exact behavior and whether the user accepted a tradeoff.

| Surface | Failure | Blocking? | Tradeoff file |
|---|---|---|---|
| `<surface>` | `<what failed>` | `Yes / No` | `<tradeoff path or n/a>` |
