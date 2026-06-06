# uiux-design-loop

Two-loop discipline for UI/UX work. A **cold-context grader subagent** (outer loop) scores the rendered design against an 8-dimension rubric plus binary preservation and audit gates; the **implementer** (inner loop) iterates from critique briefs. Forces declared user-flow + visual register + preservation contract before code, screenshot plus behavior proof per iteration, and a parallel `impeccable audit` pass that blocks PASS on P0/P1 a11y / perf / structural findings. The `impeccable` skill is a **required dependency** — the loop refuses to start without it.

Purpose: prevent the single-pass "polish" failure mode where the implementer ships something that *sounds* disciplined but visually impoverishes the page, because the implementer is the only reviewer.

## What ships in this directory

| File | Purpose |
|---|---|
| `SKILL.md` | The skill prompt — workflow gates (incl. Gate 0 pre-flight, Gate 1.5/3.5 audit half-gates, Gate 4 active exit-pass prompt), anti-patterns, dispatch contract. |
| `rubric.md` | The 8 grading dimensions with 1/3/5 anchor descriptions, the preservation gate (PASS/WARN/FAIL/N/A), the audit gate (PASS/WARN/FAIL/N/A), and pass thresholds. |
| `templates/flow-map.md` | Visitor-flow declaration template. Filled per project. |
| `templates/register.md` | Visual register declaration template. Filled per project. |
| `templates/preservation-contract.md` | Compatibility-surface declaration template. Filled per project. |
| `templates/behavior-check.md` | Exit behavior evidence template. Filled before the skill exits. |
| `templates/critique-brief.md` | What the grader writes back; mirror of the verdict contract. |
| `impeccable-map.md` | Integration seams with the `impeccable` skill: Gate 0 pre-flight + register-taxonomy table (brand/product → loop registers), Gate 1.5/3.5 `impeccable audit` contract, Gate 4 mandatory exit-pass prompt, dimension → reference lookup. Impeccable is a required dependency; the loop refuses to start without it (Gate 0 precondition HARD-GATE). |
| `README.md` | This file. |

The grader subagent itself lives at `agents/uiux-grader.md` at the repo root (same level as other strict-review agents).

## How to invoke

| Mode | When | Form |
|---|---|---|
| Direct | User asks to improve UX / storyline / flow / register of a page or component | `/skills:uiux-design-loop` |
| Wrapped | After `frontend-design` produces a first render | Activate this skill on the rendered output |

## What you need before starting

1. The project's page(s) are reachable (local dev server or live URL).
2. A browser-driving tool is available — Playwright MCP or equivalent — for screenshot capture and live behavior checks. The skill does not run Playwright; the orchestrator does, per the script in `SKILL.md`.
3. The host project has (or will accept) a gitignored `.uiux-loop/` directory for artifacts.

## How the verdict gates iteration

The `uiux-grader` returns one of three overall verdicts. PASS requires all three inputs:

- **PASS** — weakest of the 8 dimension scores ≥ 4 **and** preservation gate ∈ {`PASS`, `N/A`} **and** audit gate ∈ {`PASS`, `N/A`}. Skill exits after the Gate 4 mandatory exit-pass AskUserQuestion roundtrip — the user confirms which `/impeccable <pass>` to run; there is no Skip option.
- **ITERATE** — any dimension below threshold, or either gate is `WARN` / `FAIL`. Critique brief (plus the `## Brief diff` section comparing to the prior verdict) drives the next inner-loop pass; the audit pass at Gate 3.5 re-runs `impeccable audit` on the changed files.
- **REJECT** — design needs broader rework than the loop can deliver in its 6-iteration budget. Surface to the user; do not continue iterating mechanically.

Each verdict is emitted as prose followed by a fenced ` ```json ` block carrying the same data. The orchestrator writes both: `verdict-iter-<n>.md` (prose + JSON) and `verdict-iter-<n>.json` (extracted JSON) for CI / dashboards.

## Per-project customisation

Drop override files into the host project's worktree. See `rubric.md` → "How to override per project" for the full list and effect of each.

## Requires `impeccable`

The `impeccable` skill (`~/.claude/skills/impeccable/`) is a required dependency. The loop's Gate 0 precondition HARD-GATE refuses to start without it. Four seams from `impeccable-map.md` fire on every run:

1. **Gate 0 pre-flight** — runs `context.mjs` to auto-populate `register.md` from `PRODUCT.md` (mapped through the register-taxonomy table); recommends `/impeccable init` if `NO_PRODUCT_MD`.
2. **Gate 1.5 + 3.5** — dispatches `impeccable audit <changed-files>` in parallel with each grader pass. P0/P1 findings = audit gate `FAIL` = block PASS.
3. **Dimensions 7 + 8** — `accessibility` and `technical-quality` score from the audit findings (severity → score mapping in `rubric.md`).
4. **Gate 4 mandatory exit-pass** — at PASS, fires `AskUserQuestion` with a single suggested `/impeccable <pass> <target>` command pre-selected as Recommended. There is no Skip option; the user confirms the pass or aborts the loop.

Division of labor: the loop owns *whether the design is right*; impeccable owns *how to make it right* + *whether the code is right*. To install impeccable, run `/plugin install impeccable` from the skills marketplace before invoking `/skills:uiux-design-loop`.

## Out of scope

- Component generation from scratch → `frontend-design`.
- Broad build / typecheck / test verification → handled by the host project's normal flow. Preservation-surface behavior checks are in scope for this skill.
- Brand-voice rewriting → host project's content-rules; the grader cites, this skill does not rewrite.
- Telemetry across sessions → not in this skill; if useful, a separate skill.
