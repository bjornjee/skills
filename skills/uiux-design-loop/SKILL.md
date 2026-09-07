---
name: uiux-design-loop
description: Improve UI flow, layout, visual register, and preservation using Impeccable audits, live behavior evidence, and an independent grader. Use for requested interface improvement; not for backend or documentation-only work.
---
# UI/UX Design Loop

The parent owns implementation, live verification, artifact freshness, and completion. Impeccable owns design/audit guidance. The grader evaluates only the supplied evidence. Read [rubric.md](rubric.md) and [impeccable-map.md](impeccable-map.md); use the templates only for the artifacts needed by the selected surfaces.

## Scope and authority

Preserve the user's requested surface, behavior, and exclusions. A successful grade does not authorize deployment, additional redesign, or changes outside the request. No visual score can waive unresolved P0/P1 security, accessibility, or behavior defects.

Work scales with the declared page-states and viewports, not the entire application. Batch independent screenshots and checks. Follow the active root verification profile. For a new surface with nothing to preserve, explicitly record an empty preservation contract.

## Prerequisites

- Resolve the loaded `impeccable` skill from the runtime's actual skill catalog and read its entrypoint. Do not assume a Claude or Codex home path. Impeccable is required; if unavailable, report the missing dependency and complete independent preparation without inventing an audit.
- **Hot-reload:** identify the existing development server (`make dev`, `npm run dev`, Vite, or equivalent). Confirm that a render reflects current source before recording evidence.
- Identify a browser capability for the parent. A URL alone is not behavior evidence. The grader is read-only and does not need browser access.
- Identify independent-agent support. In Codex, dispatch with `fork_turns: "none"`; in other runtimes select equivalent isolation. If isolation cannot be established, label the review as self-review and do not claim an independent grade.

## Gate 0 — Declare the work

Before editing, record:

1. `.uiux-loop/flow-map.md`: selected states, actions, viewports, and expected outcomes.
2. `.uiux-loop/register.md`: surface mode, visual direction, relevant product/brand constraints, and optional reference anchors. Use existing `PRODUCT.md` for durable context and a surface brief for strategy; do not require product-wide visual categories. Infer routine choices from the request and ask only for materially unresolved preferences.
3. `.uiux-loop/preservation-contract.md`: compatibility surface, including affected JS primitives, CSS classes, routes, behaviors, and intentional changes. Empty contracts are explicit.
4. Optional `.uiux-loop/weights.json`: positive finite **priority** multipliers. These rank repair work; they never multiply acceptance scores.

Name the source revision or worktree content fingerprint and evidence capture time in every audit, behavior report, and verdict. Evidence from a different revision is stale even if its filename is unchanged. See [templates/behavior-check.md](templates/behavior-check.md).

## Gate 1 — Baseline evidence and grade

The parent captures screenshots for each selected state and viewport into `.uiux-loop/baseline/`. Run the live actions and fill `.uiux-loop/behavior-check-baseline.md`: what was clicked, expected/actual results, keyboard traversal, console messages, and applicable computed styles. Use screenshots plus behavior evidence, not screenshots alone.

### Gate 1.5 — Audit before grading

Run Impeccable's available audit workflow on the files rendering the `flow-map.md` surfaces; baseline cannot rely on an empty changed-file list. Save `.uiux-loop/audit-baseline.md` with finding IDs, severity, location, impact, and evidence revision. Complete this **before the Gate 1 grader dispatch**.

Dispatch the fresh `uiux-grader` with only:

- This skill's rubric; the flow map, register, preservation contract, and applicable project rules.
- Fresh audit passed as `audit-findings.md`, fresh behavior report passed as `behavior-check.md`, and matching screenshots.
- Optional `.uiux-loop/register-anchors/` images and priority weights.
- On later grades, the prior verdict as `prior-verdict.md` for tracking resolved findings.

No implementation narrative, source diff, or inherited conversation. Capture the grader's prose and JSON into `.uiux-loop/verdict-baseline.md` and `.json`. If it returns PASS and the requested outcome is already present, stop. A rubric PASS does not cancel an unfulfilled explicit user request.

## Gate 2 — Implement and verify

Address the evidenced findings and requested outcome in one coherent batch. Preserve scope. Use the project's parser/compiler/tests for structural integrity; balanced braces alone cannot prove valid code. Check that every imported symbol exists and relevant CSS variables resolve.

Record fresh screenshots and repeat the affected live actions after editing, including preservation surfaces. Save `.uiux-loop/iter-<n>/` evidence and `behavior-check-iter-<n>.md` with the current revision. Never reuse baseline behavior evidence after a relevant change.

### Gate 3.5 — Re-audit before grading

Run Impeccable audit on the full declared change since the baseline (including new files), not just currently unstaged edits. Save `.uiux-loop/audit-iter-<n>.md`. Complete this **before the Gate 3 grader dispatch**.

## Gate 3 — Re-grade

Dispatch a fresh isolated grader with the same contract and the new screenshots, behavior report, audit, and `.uiux-loop/verdict-iter-<n-1>.md` (or baseline on the first iteration). Save its response without altering scores.

Follow Impeccable's bounded verification cycle: one initial inspection and at most one confirmation round by default. A user-requested larger budget must be explicit. The parent tracks rounds and decides whether another dispatch is allowed; ITERATE or REWORK is a quality assessment, not authorization to continue. When the budget is exhausted without acceptance, preserve the grader's verdict and separately report budget exhaustion and the incomplete result; do not manufacture PASS or enter another polishing loop. A non-passing dimension can be an explicitly accepted tradeoff only under the rubric's separate `ACCEPTED_TRADEOFF` outcome.

## Gate 4 — Finish

After the last edit, ensure screenshots, behavior evidence, and audit all describe the final revision **before** the final grade. The last confirmation grade may serve as final when no source or evidence changed afterward. Otherwise a fresh grade consumes the remaining budget; if none remains, report incomplete.

Copy that matching verdict and evidence to `verdict-final.md`, `verdict-final.json`, `audit-final.md`, and `behavior-check.md`. Report the outcome, remaining defects/tradeoffs, and evidence locations. PASS requires that the preservation gate is `PASS` or `N/A` and the audit gate is `PASS`; missing evidence never counts as N/A.

PASS means exit. Do not require a confirmation for a no-op or force another Impeccable pass. An optional follow-up such as `/impeccable polish` is a separate user choice; declining it does not invalidate completed work.

## Evidence and failure rules

- A missing dependency, tool, screenshot, or behavior report is a verification gap, not success.
- New source changes invalidate affected evidence and the associated verdict.
- Screenshots do not prove clicks, keyboard behavior, console health, or computed styles.
- Unresolved P0/P1 findings prevent completion regardless of scores or iteration budget.
- An accepted nonblocking visual tradeoff stays visible in the final result; never relabel it PASS.
