# uiux-design-loop

Two-loop discipline for UI/UX work. A **cold-context grader subagent** (outer loop) scores the rendered design against a fixed 7-dimension rubric; the **implementer** (inner loop) iterates from critique briefs. Forces declared user-flow + visual register + preservation contract before code, and screenshot plus behavior proof per iteration.

Purpose: prevent the single-pass "polish" failure mode where the implementer ships something that *sounds* disciplined but visually impoverishes the page, because the implementer is the only reviewer.

## What ships in this directory

| File | Purpose |
|---|---|
| `SKILL.md` | The skill prompt — workflow gates, anti-patterns, dispatch contract. |
| `rubric.md` | The 7 grading dimensions with 1/3/5 anchor descriptions and pass thresholds. |
| `templates/flow-map.md` | Visitor-flow declaration template. Filled per project. |
| `templates/register.md` | Visual register declaration template. Filled per project. |
| `templates/preservation-contract.md` | Compatibility-surface declaration template. Filled per project. |
| `templates/behavior-check.md` | Exit behavior evidence template. Filled before the skill exits. |
| `templates/critique-brief.md` | What the grader writes back; mirror of the verdict contract. |
| `impeccable-map.md` | Optional integration seams with the `impeccable` skill (Gate 0 register sourcing, Gate 4 named exit-pass). Loaded only when impeccable is available. |
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

The `uiux-grader` returns one of three overall verdicts:

- **PASS** — every dimension meets threshold. Skill exits.
- **ITERATE** — at least one dimension below threshold. Critique brief drives the next inner-loop pass.
- **REJECT** — design needs broader rework than the loop can deliver in its 6-iteration budget. Surface to the user; do not continue iterating mechanically.

## Per-project customisation

Drop override files into the host project's worktree. See `rubric.md` → "How to override per project" for the full list and effect of each.

## Composes with `impeccable`

If the host project uses the `impeccable` skill (`~/.claude/skills/impeccable/`), this loop reads `impeccable-map.md` at Gate 0 (source `register.md` from `PRODUCT.md` / `DESIGN.md` / a `/impeccable shape` brief) and Gate 4 (recommend a named exit-pass like `/impeccable polish <target>`). Otherwise the loop runs standalone. Division of labor: the loop owns *whether the design is right*; impeccable owns *how to make it right*.

## Out of scope

- Component generation from scratch → `frontend-design`.
- Broad build / typecheck / test verification → handled by the host project's normal flow. Preservation-surface behavior checks are in scope for this skill.
- Brand-voice rewriting → host project's content-rules; the grader cites, this skill does not rewrite.
- Telemetry across sessions → not in this skill; if useful, a separate skill.
