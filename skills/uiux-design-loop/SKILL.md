---
name: uiux-design-loop
description: Two-loop discipline for UI/UX work — a cold-context grader subagent (outer loop) scores the rendered design against a fixed 7-dimension rubric while the implementer (inner loop) iterates from critique briefs. Prevents single-pass "polish" failures by forcing declared user-flow + visual register + preservation contract before code, and screenshot plus behavior proof per iteration. Use when the user asks to improve UX, storyline, flow, layout, register, or polish on a page or component — anything where the failure mode is "ship something that looks plausible but is actually wrong."
---

# /skills:uiux-design-loop — Outer-grade / inner-implement loop for UI/UX

## Why this skill exists

UI/UX work fails in a recognisable pattern: the implementer defaults to *polish*, ships a single pass with no graded review, conflates content rules (e.g. "stick to the source doc") with visual minimalism, and lands a page that is visually impoverished — sparse without being intentional. The implementer's own narrative ("I removed the unauthorised CTAs and added a clean cross-link card") *sounds* disciplined while the render *is* anaemic. The implementer cannot self-correct because they are the only reviewer.

This skill fixes that by separating two loops:

- **Outer loop — cold-context grader.** A `uiux-grader` subagent receives only screenshots + optional live-URL evidence + the declared user-flow + the declared visual register + the preservation contract + the rubric. It never sees the implementer's reasoning. It scores 7 fixed dimensions and emits a verdict + a critique brief.
- **Inner loop — implementer.** Reads the critique brief, makes the smallest change that addresses the weakest dimension, captures fresh screenshots, hands them back to a *new* grader pass. Loops until the weakest dimension clears threshold.

Result: UI/UX work cannot ship without (a) a declared flow, (b) a declared register, (c) a preservation contract for reachable surfaces, (d) a graded verdict, (e) screenshot-proof per iteration, and (f) behavior proof for preserved surfaces before exit.

## When to activate

| Signal | Activate? |
|---|---|
| User asks to "improve UX / storyline / flow" of a page or component | Yes |
| User asks to "polish", "refine", or "tighten" visuals | Yes — high risk of the single-pass-polish failure mode |
| Multi-locale UX parity work (EN↔CN, etc.) | Yes |
| Iterating on a design after stakeholder feedback | Yes |
| One-line CSS / typo / colour-hex fix | No — direct edit |
| New component being built from scratch with no existing reference | Hand to `frontend-design` first; activate this skill once a first render exists |
| Pure copywriting / brand-voice edits with no visual change | No — handle as content edit |

## Prerequisites

1. The project is running and the page(s) under work are reachable (local dev server or live URL).
2. A browser-driving tool is available (Playwright MCP or equivalent) for screenshot capture.
3. The orchestrator can dispatch the `uiux-grader` subagent (lives at `agents/uiux-grader.md` in this repo).
4. Optional: if `~/.claude/skills/impeccable/SKILL.md` is present, the loop will consult `skills/uiux-design-loop/impeccable-map.md` at Gate 0 (register sourcing) and Gate 4 (named exit-pass). Not required — the loop runs standalone if impeccable is absent.

If any of these is missing, halt and tell the user what's needed. Do not silently degrade to "describe the design in prose" — the grader needs renders.

## Workflow — five gates

Each gate halts until satisfied. The gates exist precisely because the implementer's instinct will be to skip them.

### Gate 0 — Declare scope (NO CODE YET)

Three artifacts must exist on disk in the project's worktree before any edit, plus one optional weights file:

1. **`.uiux-loop/flow-map.md`** — Filled from `skills/uiux-design-loop/templates/flow-map.md`. Names the visitor goal, the numbered flow steps, the decision points, and the failure/exit states. One screenshot per step will be captured in Gate 1.
2. **`.uiux-loop/register.md`** — Filled from `templates/register.md`. Declares the chosen visual register (editorial / dramatic / spacious / brutalist / refined-minimal / …), why, reference mockups, and what the register specifically rejects.
3. **`.uiux-loop/preservation-contract.md`** — Filled from `templates/preservation-contract.md`. For every reachable surface not being redesigned, enumerate the compatibility surface and the JS primitives + CSS classes it depends on.
4. **`.uiux-loop/weights.json`** (optional) — Per-dimension weight overrides. Default = all weights = 1.0 and skill loads `rubric.md` as-is.

If the host project has `PRODUCT.md`, `DESIGN.md`, or a prior `/impeccable shape` brief, load `skills/uiux-design-loop/impeccable-map.md` and use the Gate 0 sourcing table to populate `register.md` instead of re-declaring from scratch. The artifact must still exist on disk — sourcing does not skip the gate.

**HARD-GATE.** No `Edit`, no `Write` on source files, no `git add` until all required artifacts exist and `preservation-contract.md` lists each compatibility surface. If the user pushes back ("the flow is obvious" or "out of scope means unchanged"), the answer is: implicit scope is exactly the bias the grader exists to correct.

If the user has not chosen a register, present 2–3 mockup directions (image refs or short prose) before they pick. Polish is *not* a register.

### Gate 1 — Baseline grade

1. Capture screenshots of every page-state named in `flow-map.md` via Playwright (or equivalent). Use viewport sizes the project cares about (default: desktop 1440×900 + mobile 390×844).
2. Save screenshots to `.uiux-loop/baseline/step-<n>-<viewport>.png`.
3. Dispatch the `uiux-grader` subagent. Pass it, in this order:
   - `skills/uiux-design-loop/rubric.md`
   - `.uiux-loop/flow-map.md`
   - `.uiux-loop/register.md`
   - `.uiux-loop/preservation-contract.md`
   - `.uiux-loop/weights.json` (if present)
   - `.uiux-loop/project-rules.md` (if present — project-specific Layer 2 rules, e.g. innerjoyreiki's "docx-led brand voice" rule)
   - The screenshots from step 2
   - The live URL or Playwright session handle if available
   - **Nothing else.** No implementer narrative. No diff. No "here's what I'm planning."
4. Wait for the grader to return. The grader is source-read-only and emits the verdict as its response; it does **not** write files. If a live browser channel is available, the grader may use it only for the rubric-scored checks in `agents/uiux-grader.md`. The orchestrator captures the response and writes it to `.uiux-loop/verdict-baseline.md`.

**HARD-GATE.** Verdict file exists before any source edit. If the baseline already returns `PASS`, the skill can exit early — the design is fine; the user wanted polish for its own sake.

### Gate 2 — Inner-loop iteration

1. Read the most recent verdict's **critique brief** section. Operate on that brief only — not your own ideas about the page.
2. Make the smallest change that addresses the brief's #1 item (or the weakest scored dimension, if the brief is empty but `Overall ≠ PASS`).
3. After every CSS / HTML / JS edit, run a structural-integrity check before grading: balanced braces, balanced /* */, every var(--*) resolves, and every imported symbol exists. If the check fails, revert the change and try smaller.
4. Run Playwright; capture fresh screenshots into `.uiux-loop/iter-<n>/step-<m>-<viewport>.png`.
5. Self-check: re-read the brief. Does the new screenshot address each brief item? If you cannot point to the visual difference, the change did not land — revert and retry.
6. Append a one-line note to `.uiux-loop/iter-<n>/change.md` describing what file you edited and why. This note is for the human reader, not the grader — the grader will not see it.

**HARD-GATE.** New screenshots captured (not just diff inspected). Diff-as-proof is the failure mode this skill exists to prevent. The diff says what changed in code; the screenshot says what changed in render. Only the second one is the deliverable.

**Anti-scope-creep.** No "while I'm here" additions. The grader will catch them next pass and penalise `content-density` or `affordance-honesty`. Make the brief's change only.

### Gate 3 — Re-grade

1. Dispatch a **fresh** `uiux-grader` subagent (new context — do not reuse the prior conversation). Pass it the same artifacts as Gate 1, but with the new screenshots from `.uiux-loop/iter-<n>/` and the live URL or Playwright session handle if available.
2. Wait for the grader to return. The orchestrator captures its response and writes it to `.uiux-loop/verdict-iter-<n>.md` (grader is source-read-only and cannot write files).
3. Compare verdicts: which dimension scores moved? Did any regress? Regressions are common signals that the change addressed brief #1 by visually damaging an un-scored area — log them and proceed.
4. Loop back to **Gate 2** until `Overall = PASS` or the user accepts a documented tradeoff (record the tradeoff in `.uiux-loop/tradeoff-<n>.md` — what dimension the user accepts as below threshold and why).

**Loop budget.** Hard cap at 6 iterations. If you have run 6 inner-loop passes without a `PASS`, the design needs broader rework than this loop can deliver — surface that to the user, do not keep iterating.

### Gate 4 — Exit

1. Final verdict copied to `.uiux-loop/verdict-final.md`.
2. Summary written to `.uiux-loop/summary.md`: number of iterations, per-dimension trajectory (baseline → final), tradeoffs accepted, total screenshots captured.
3. Fill `.uiux-loop/behavior-check.md` from `templates/behavior-check.md`. For each surface in `preservation-contract.md`, run the live app and record pass/fail with evidence.
4. User confirms. Skill exits only after every preservation surface passes or the user accepts a documented tradeoff.
5. Downstream `verify` skill (if active) can still run broader project verification. This skill owns preservation behavior checks because an in-scope visual PASS must not hide out-of-scope regressions.
6. If `impeccable` is installed, consult `skills/uiux-design-loop/impeccable-map.md`'s Gate 4 table and recommend a single named exit-pass command to the user (e.g. `/impeccable polish src/routes/home`). The pass is optional; the user accepts or skips. Do not auto-run it.

**HARD-GATE.** The skill refuses to exit until `.uiux-loop/behavior-check.md` shows every preservation surface passes.

## Output artifacts

By the end of a normal session:

```
.uiux-loop/
├── flow-map.md                 # Gate 0
├── register.md                 # Gate 0
├── preservation-contract.md    # Gate 0
├── weights.json                # Gate 0 (optional)
├── project-rules.md            # Gate 0 (optional)
├── baseline/                   # Gate 1 screenshots
│   └── step-<n>-<viewport>.png
├── verdict-baseline.md         # Gate 1
├── iter-1/
│   ├── step-<n>-<viewport>.png
│   └── change.md
├── verdict-iter-1.md           # Gate 3
├── iter-2/ … iter-N/
├── verdict-iter-N.md
├── tradeoff-<n>.md             # Gate 3 (one per accepted tradeoff, if any)
├── verdict-final.md            # Gate 4
├── behavior-check.md           # Gate 4
└── summary.md                  # Gate 4
```

Add `.uiux-loop/` to the project's `.gitignore`. None of this is committed.

## Anti-patterns

- **Skipping Gate 0 because "the flow is obvious."** See Gate 0 — the gate exists precisely because of this instinct.
- **Treating out-of-scope surfaces as invisible.** If a reachable surface is not being redesigned, it belongs in `preservation-contract.md` with its compatibility surface, JS primitives, and CSS classes.
- **Showing the grader the implementer's narrative.** Defeats the cold-context invariant. Pass screenshots + flow map + register only. If the grader's verdict ever cites the implementer's reasoning, the dispatch leaked context — fix the orchestrator, not the grader.
- **Inferring visual register from "the user seems to want polish."** Register must be explicitly declared from a finite set. *Polish is not a register* — it is what you do once a register has been chosen.
- **Treating strict-content-rules as a licence for sparse UI.** The `content-density` dimension exists precisely to catch this. If respecting a content rule (e.g. "use the docx wording verbatim") would produce a visually impoverished page, surface the tradeoff to the user *before* shipping the sparse version — do not call sparse "minimal" without a register that asks for minimal.
- **Diff-as-proof for visual change.** Screenshot or it didn't happen.
- **Screenshot-as-proof for behavior.** A screenshot cannot prove clicks, tab switches, console health, computed styles, or parser integrity. Use the live URL channel and Gate 4 behavior check.
- **"Card with just a heading and arrow" as a cross-link affordance.** Visually anaemic; flagged by `affordance-honesty`. Reach for a richer pattern (image-led card, integrated tab system, visual scroll-cue) or argue for the content rule being too strict.
- **Iterating without a critique brief.** The inner loop's only input is the brief. If you find yourself "improving" without a brief item to point to, stop — re-dispatch the grader for a fresh brief.
- **Manufacturing brief items to keep iterating after a PASS.** PASS means PASS. Exit.

## Reuse, don't duplicate

- **Grading rules** — `agents/uiux-grader.md` is the single source of truth. This skill orchestrates dispatch; it does not restate dimensions or verdict format.
- **Rubric dimensions + anchor scores** — `skills/uiux-design-loop/rubric.md`. Both this skill and the grader load it.
- **Component generation from scratch** — `frontend-design` skill. This skill wraps iteration; it does not replace generation.
- **Project-specific Layer 2 rules** — `.uiux-loop/project-rules.md` in the host project. The grader reads it; this skill does not duplicate its contents.
- **Brand-voice guidance** — host project's documentation (e.g., source-of-truth docs, memory entries). Grader cites; this skill does not embed.
- **Production-grade craft + register vocabulary** — `impeccable` skill. The loop owns the verdict; impeccable owns the craft. See `skills/uiux-design-loop/impeccable-map.md` for the seams (Gate 0 register sourcing, Gate 4 exit pass). Optional — the loop runs standalone if impeccable is absent.
