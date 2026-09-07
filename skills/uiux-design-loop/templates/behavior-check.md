# Behavior Check

> Fill this in before every grader dispatch of `/skills:uiux-design-loop`. Run the live app and verify every compatibility surface from `preservation-contract.md`. This file feeds the grader's `## Preservation gate` block — the state declared at the top is an independent acceptance gate.

## Preservation gate state

**State:** `PASS | WARN | FAIL | N/A`

| State | When |
|---|---|
| `PASS` | Every row below has `Pass` with fresh evidence; nothing in `preservation-contract.md` is missing from this file. |
| `WARN` | Required evidence is missing/stale or a visual deviation needs authorization, with no confirmed blocking defect. |
| `FAIL` | Any row below has `Fail`. |
| `N/A` | `preservation-contract.md` declares no reachable surfaces outside the redesign scope. |

`WARN` and `FAIL` block the loop's exit. Repair and verify the regression; an authorized intentional contract change must be recorded and verified against the revised contract.

## Run context

| Field | Value |
|---|---|
| URL / environment | `<live URL or local URL>` |
| Browser / viewport | `<browser and dimensions>` |
| Source revision / content fingerprint | `<identifier including uncommitted edits>` |
| Captured at | `<timestamp>` |

## Preservation surfaces

| Surface | Steps run | Pass/fail | Evidence | Console messages |
|---|---|---|---|---|
| `<surface>` | `<clicks, tab switches, route, input>` | `Pass / Fail` | `<screenshot, trace, observed DOM text, computedStyle check>` | `<none or messages>` |

## Failures

For every failed surface, record the exact behavior and the concrete repair required.

| Surface | Failure | Blocking? | Tradeoff file |
|---|---|---|---|
| `<surface>` | `<what failed>` | `Yes / No` | `<tradeoff path or n/a>` |
