# uiux-design-loop

Two-loop discipline for UI/UX work. A **cold-context grader subagent** (outer loop) scores the rendered design against a fixed 6-dimension rubric; the **implementer** (inner loop) iterates from critique briefs. Forces declared user-flow + visual register before code, and screenshot-proof per iteration.

Purpose: prevent the single-pass "polish" failure mode where the implementer ships something that *sounds* disciplined but visually impoverishes the page, because the implementer is the only reviewer.

## What ships in this directory

| File | Purpose |
|---|---|
| `SKILL.md` | The skill prompt — workflow gates, anti-patterns, dispatch contract. |
| `rubric.md` | The 6 grading dimensions with 1/3/5 anchor descriptions and pass thresholds. |
| `templates/flow-map.md` | Visitor-flow declaration template. Filled per project. |
| `templates/register.md` | Visual register declaration template. Filled per project. |
| `templates/critique-brief.md` | What the grader writes back; mirror of the verdict contract. |
| `README.md` | This file. |

The grader subagent itself lives at `agents/uiux-grader.md` at the repo root (same level as other strict-review agents).

## How to invoke

| Mode | When | Form |
|---|---|---|
| Direct | User asks to improve UX / storyline / flow / register of a page or component | `/skills:uiux-design-loop` |
| Wrapped | After `frontend-design` produces a first render | Activate this skill on the rendered output |

## What you need before starting

1. The project's page(s) are reachable (local dev server or live URL).
2. A browser-driving tool is available — Playwright MCP or equivalent — for screenshot capture. The skill does not run Playwright; the orchestrator does, per the script in `SKILL.md`.
3. The host project has (or will accept) a gitignored `.uiux-loop/` directory for artifacts.

## How the verdict gates iteration

The `uiux-grader` returns one of three overall verdicts:

- **PASS** — every dimension meets threshold. Skill exits.
- **ITERATE** — at least one dimension below threshold. Critique brief drives the next inner-loop pass.
- **REJECT** — design needs broader rework than the loop can deliver in its 6-iteration budget. Surface to the user; do not continue iterating mechanically.

## Per-project customisation

Drop any of these into the host project's worktree to override defaults:

| File | Effect |
|---|---|
| `.uiux-loop/weights.json` | Re-weight rubric dimensions (e.g., a content-heavy site weights `content-density` 1.5). |
| `.uiux-loop/project-rules.md` | Project-specific Layer 2 rules the grader cites verbatim (e.g., "brand voice follows the source docx, do not stamp the practitioner's name on every block"). |

The skill loads these if present; otherwise uses the canonical `rubric.md` as-is.

## Out of scope

- Component generation from scratch → `frontend-design`.
- Build / typecheck / test verification → handled by the host project's normal flow.
- Brand-voice rewriting → host project's content-rules; the grader cites, this skill does not rewrite.
- Telemetry across sessions → not in this skill; if useful, a separate skill.
