---
name: uiux-design-loop
description: Two-loop discipline for UI/UX work — a cold-context grader subagent (outer loop) scores the rendered design against an 8-dimension rubric plus binary preservation and audit gates while the implementer (inner loop) iterates from critique briefs. Prevents single-pass "polish" failures by forcing declared user-flow + visual register + preservation contract before code, screenshot plus behavior proof per iteration, and a parallel `impeccable audit` pass that gates PASS on a11y/perf/structural P1s. The `impeccable` skill is a hard precondition — the loop refuses to run without it. Use when the user asks to improve UX, storyline, flow, layout, register, or polish on a page or component — anything where the failure mode is "ship something that looks plausible but is actually wrong."
---

# /skills:uiux-design-loop — Outer-grade / inner-implement loop for UI/UX

## Why this skill exists

UI/UX work fails in a recognisable pattern: the implementer defaults to *polish*, ships a single pass with no graded review, conflates content rules (e.g. "stick to the source doc") with visual minimalism, and lands a page that is visually impoverished — sparse without being intentional. The implementer's own narrative ("I removed the unauthorised CTAs and added a clean cross-link card") *sounds* disciplined while the render *is* anaemic. The implementer cannot self-correct because they are the only reviewer.

This skill fixes that by separating two loops:

- **Outer loop — cold-context grader.** A `uiux-grader` subagent receives only screenshots + optional live-URL evidence + the declared user-flow + the declared visual register + the preservation contract + the rubric + the audit findings file. It never sees the implementer's reasoning. It scores 8 fixed dimensions, reports binary preservation and audit gates, and emits a verdict + a critique brief.
- **Inner loop — implementer.** Reads the critique brief, makes the smallest change that addresses the weakest dimension, captures fresh screenshots, re-runs `impeccable audit`, hands the bundle back to a *new* grader pass. Loops until the weakest dimension clears threshold and both gates are PASS or N/A.

Result: UI/UX work cannot ship without (a) a declared flow, (b) a declared register, (c) a preservation contract for reachable surfaces, (d) a graded verdict, (e) screenshot-proof per iteration, (f) behavior proof for preserved surfaces before exit, and (g) a clean `impeccable audit` pass on changed files.

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
4. **Hot-reload check (informational).** The orchestrator runs a one-shot detection looking for any of: `package.json` `"dev"` script, `vite.config.*`, `webpack.config.*`, a `make dev` target, `next dev` / `astro dev` / `nuxt dev` in scripts, or a watcher process already listening. If at least one signal is present, log `"Hot reload detected — fast iteration expected (~2s per pass)."` If none, log `"Hot reload not detected — each iteration likely rebuilds the binary (~30s+ per pass). Recommend reducing the Gate 3 loop budget from 6 to 3 unless you have a faster pipeline."` This is informational; it does not block.
5. **Impeccable precondition.** Impeccable is required. The orchestrator runs `test -f "$HOME/.claude/skills/impeccable/SKILL.md"` before any Gate 0 work. If the file is absent, halt with: *"impeccable is required by /skills:uiux-design-loop. Install it from the skills marketplace, then re-run."* There is no degraded mode — every prior shipped failure of this loop traced back to the orchestrator skipping the audit. With the skill installed, the loop activates four seams automatically: Gate 0 pre-flight (auto-populates register from `PRODUCT.md` or recommends `/impeccable init`), Gate 1.5 / 3.5 (`impeccable audit` runs on changed files; P0/P1 findings block PASS), Dimensions 7 + 8 (`accessibility` and `technical-quality` score from audit findings), and Gate 4 (`AskUserQuestion` confirms the suggested `/impeccable <pass>` exit-pass — no opt-out path). Full seam contracts live in `skills/uiux-design-loop/impeccable-map.md`.

**HARD-GATE.** No Gate 0 work begins until `~/.claude/skills/impeccable/SKILL.md` exists on disk. The orchestrator MUST run the `test -f` check first and halt with the install message above if it fails. Proceeding without impeccable is the exact failure mode this gate exists to prevent.

If any of items 1–3 is missing, halt and tell the user what's needed. Do not silently degrade to "describe the design in prose" — the grader needs renders.

## Workflow — seven gates

Five primary gates (0, 1, 2, 3, 4) plus two audit half-gates (1.5, 3.5) that run in parallel with the grader passes. Each gate halts until satisfied. The gates exist precisely because the implementer's instinct will be to skip them.

### Gate 0 — Declare scope (NO CODE YET)

**Pre-flight.** Before declaring the register manually, the orchestrator runs `node "$HOME/.claude/skills/impeccable/scripts/context.mjs"` exactly once. (The precondition above guarantees impeccable is installed; this script will exist.) Parse the output:

- **If it prints a `PRODUCT.md` block** (the project has already opted into impeccable's brief format): auto-populate `.uiux-loop/register.md`'s `Chosen register`, `Why this register`, and `Reference mockups / sources` fields from PRODUCT.md's `register:` field, theme scene sentence, and named anchors respectively. Use the **register-taxonomy table in `impeccable-map.md`** to map impeccable's `brand|product` register to the loop's named register vocabulary (impeccable picks the family; the loop picks the member). Then call `AskUserQuestion` with one question — "I auto-populated register.md from PRODUCT.md — `<chosen-register>` mapped from `<impeccable-register>`. Confirm or override?" — and wait for confirmation before proceeding to artifact 2.
- **If it reports `NO_PRODUCT_MD`** (impeccable is installed but the project hasn't been initialised): recommend `/impeccable init` as the path of least surprise BEFORE manual register declaration. Print: "PRODUCT.md is missing. Recommended: run `/impeccable init` to declare register + theme + anti-references once, then re-enter Gate 0. Manual declaration is still allowed — pick `Manual` to fall through." Fire `AskUserQuestion` with two options: `Run /impeccable init (Recommended)` and `Manual declaration`. Do not auto-run.

The HARD-GATE on artifact existence below is unaffected — `register.md` must exist on disk before Gate 1 regardless of sourcing path. Auto-population fills fields; it does not skip the gate.

**Required artifacts.** Three artifacts must exist on disk in the project's worktree before any edit, plus one optional weights file:

1. **`.uiux-loop/flow-map.md`** — Filled from `skills/uiux-design-loop/templates/flow-map.md`. Names the visitor goal, the numbered flow steps, the decision points, and the failure/exit states. One screenshot per step will be captured in Gate 1.
2. **`.uiux-loop/register.md`** — Filled from `templates/register.md`. Declares the chosen visual register (editorial / dramatic / spacious / brutalist / refined-minimal / …), why, reference mockups, and what the register specifically rejects. If the template's `## Reference screenshots` block is filled in, place those screenshots under `.uiux-loop/register-anchors/` — the grader will use them to anchor `visual-register-match` against your positive references rather than its training-data prior, which is the failure mode behind "intentional negative space scored as icons floating mid-row."
3. **`.uiux-loop/preservation-contract.md`** — Filled from `templates/preservation-contract.md`. For every reachable surface not being redesigned, enumerate the compatibility surface and the JS primitives + CSS classes it depends on.
4. **`.uiux-loop/weights.json`** (optional) — Per-dimension weight overrides. Default = all weights = 1.0 and skill loads `rubric.md` as-is.

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
   - `.uiux-loop/register-anchors/*.png` (if any are declared in `register.md`)
   - The live URL or Playwright session handle if available
   - **Nothing else.** No implementer narrative. No diff. No "here's what I'm planning."
4. Wait for the grader to return. The grader is source-read-only and emits the verdict as its response — prose verdict block followed by a fenced ` ```json ` block; it does **not** write files. If a live browser channel is available, the grader may use it only for the rubric-scored checks in `agents/uiux-grader.md`. The orchestrator captures the response and writes it to `.uiux-loop/verdict-baseline.md`, then extracts the JSON block to `.uiux-loop/verdict-baseline.json` for downstream CI/dashboard consumption.

**HARD-GATE.** Verdict file exists before any source edit. If the baseline already returns `PASS`, the skill can exit early — the design is fine; the user wanted polish for its own sake.

### Gate 1.5 — Impeccable audit (parallel with Gate 1)

The cold-context grader cannot see the code. Every P0/P1 finding from `impeccable audit` — role misuse, missing `<label for>`, undersized touch targets, missing `prefers-reduced-motion`, animations that ship blank in headless renderers — is invisible to a screenshot-only grader. Gate 1.5 closes that hole by running the audit in parallel with Gate 1 and merging findings into the grader's bundle.

1. **When to run.** `git status --short` shows at least one changed file in the surfaces being graded. (Impeccable's presence is already guaranteed by the Gate 0 precondition.)
2. **What runs.** Dispatch `impeccable audit <changed-files>` writing findings to `.uiux-loop/audit-baseline.md` + `.uiux-loop/audit-baseline.json`. See `impeccable-map.md` `## Gate 1.5 / 3.5 — impeccable audit contract` for the dispatch options (subagent vs CLI), output schema, and severity → score mapping.
3. **Merge into the Gate 1 grader bundle.** Pass `.uiux-loop/audit-baseline.md` to the grader as `audit-findings.md`. The grader scores dimensions 7+8 from it and emits the `## Audit gate` block.
4. **Parallel-by-default.** Fire the audit and the grader in a single message with two tool calls. They share no state mid-run; merging happens on completion.

**HARD-GATE.** The loop refuses to ship PASS while `impeccable audit` reports P0 or P1 findings on changed files. The audit gate downgrades Overall to `ITERATE` regardless of dimension scores. The only escape is a tradeoff in `.uiux-loop/tradeoff-audit.md` signed off by the user. The audit gate is symmetric to the preservation gate — both are required, neither is optional.

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

1. Dispatch a **fresh** `uiux-grader` subagent (new context — do not reuse the prior conversation). Pass it the same artifacts as Gate 1, with three additions: (a) the new screenshots from `.uiux-loop/iter-<n>/`, (b) the live URL or Playwright session handle if available, and (c) the prior verdict file `.uiux-loop/verdict-iter-<n-1>.md` (or `.uiux-loop/verdict-baseline.md` on first iteration) as `prior-verdict.md`. The prior verdict enables the grader's `## Brief diff` block scoring whether prior critique items were addressed; per-dimension scoring stays cold.
2. Wait for the grader to return. The orchestrator captures the full response (prose + JSON) to `.uiux-loop/verdict-iter-<n>.md` and extracts the trailing fenced JSON to `.uiux-loop/verdict-iter-<n>.json` (grader is source-read-only and cannot write files).
3. Compare verdicts: which dimension scores moved? Did any regress? Regressions are common signals that the change addressed brief #1 by visually damaging an un-scored area — log them and proceed. The grader's `## Brief diff` block already names which prior items landed.
4. Loop back to **Gate 2** until `Overall = PASS` or the user accepts a documented tradeoff (record the tradeoff in `.uiux-loop/tradeoff-<n>.md` — what dimension the user accepts as below threshold and why).

**Loop budget.** Hard cap at 6 iterations. If you have run 6 inner-loop passes without a `PASS`, the design needs broader rework than this loop can deliver — surface that to the user, do not keep iterating.

### Gate 3.5 — Re-audit (parallel with Gate 3)

Mirror of Gate 1.5. The Gate 2 iteration may have introduced new P0/P1 findings (motion without reduced-motion fallback, an aria-hidden swap that broke screen-reader access, etc.) that the screenshot-only grader cannot see. Re-run the audit on the currently-changed files in parallel with the Gate 3 re-grader.

1. Dispatch `impeccable audit <changed-files>` exactly as in Gate 1.5, writing to `.uiux-loop/audit-iter-<n>.md` and `.uiux-loop/audit-iter-<n>.json`.
2. Pass the new audit file as `audit-findings.md` into the Gate 3 grader dispatch. The grader's `## Brief diff` block names which prior-iter brief items landed; the new audit covers what the screenshots can't show.
3. Compare audit deltas alongside dimension deltas: did the fix introduce new P1s while resolving brief #1?

**HARD-GATE.** Same rule as Gate 1.5 — any unresolved P0/P1 on changed files = `audit_gate: FAIL` = block PASS. The grader can never assign `PASS` to Overall while the audit reports unresolved P1s, regardless of how high the dimension scores are. Tradeoffs in `.uiux-loop/tradeoff-audit.md` are the only escape, and require an explicit user sign-off.

### Gate 4 — Exit

1. Final verdict copied to `.uiux-loop/verdict-final.md` and `.uiux-loop/verdict-final.json` (prose + JSON, same as iteration verdicts).
2. Summary written to `.uiux-loop/summary.md`: number of iterations, per-dimension trajectory (baseline → final), preservation + audit gate trajectories, tradeoffs accepted, total screenshots captured.
3. Fill `.uiux-loop/behavior-check.md` from `templates/behavior-check.md`. For each surface in `preservation-contract.md`, run the live app and record pass/fail with evidence. The file's top-of-document state line (`Preservation gate state: PASS | WARN | FAIL | N/A`) is what feeds the grader's preservation gate.
4. **Preservation gate check.** Read the final verdict's `## Preservation gate` block. The state must be `PASS` or `N/A` to exit. If `WARN` or `FAIL`, either fix the regression and re-grade, or record an explicit tradeoff in `.uiux-loop/tradeoff-preservation.md` that the user signs off on.
5. Downstream `verify` skill (if active) can still run broader project verification. This skill owns preservation behavior checks because an in-scope visual PASS must not hide out-of-scope regressions.
6. **Exit confirmation — mandatory exit-pass.** Read `verdict-final.md` for the weakest pre-final dimension and look it up in `impeccable-map.md`'s Gate 4 exit-pass table. Fire `AskUserQuestion` with a **single** option — `"Run /impeccable <pass> <target> (Recommended)"` — pre-selected as the default. The user confirms (orchestrator dispatches the command and re-enters Gate 1 + Gate 1.5 once more — visible change after PASS requires a fresh grade + audit) or, in the only escape, declines and aborts the loop entirely. There is no opt-out path inside the gate: shipping past the loop without running the suggested exit-pass is the failure mode the mandatory exit-pass exists to prevent. If the verdict-final table row is `No pass needed; ship.` (every dimension already strong), the orchestrator fires `AskUserQuestion` confirming the no-op ship — the AskUserQuestion roundtrip itself is unconditional.

**HARD-GATE.** The skill refuses to exit until the final verdict's preservation gate is `PASS` or `N/A` AND the final verdict's audit gate is `PASS` or `N/A`. `WARN` and `FAIL` on either gate block exit — they are not sliding scores you can iterate around.

## Output artifacts

By the end of a normal session:

```
.uiux-loop/
├── flow-map.md                 # Gate 0
├── register.md                 # Gate 0 (optionally auto-populated from PRODUCT.md at pre-flight)
├── register-anchors/           # Gate 0 (optional, referenced from register.md)
│   └── <anchor>.png
├── preservation-contract.md    # Gate 0
├── weights.json                # Gate 0 (optional)
├── project-rules.md            # Gate 0 (optional)
├── baseline/                   # Gate 1 screenshots
│   └── step-<n>-<viewport>.png
├── verdict-baseline.md         # Gate 1 (prose + fenced JSON)
├── verdict-baseline.json       # Gate 1 (extracted JSON for CI/dashboards)
├── audit-baseline.md           # Gate 1.5 (impeccable audit on changed files)
├── audit-baseline.json         # Gate 1.5 (structured P0/P1/P2 findings)
├── iter-1/
│   ├── step-<n>-<viewport>.png
│   └── change.md
├── verdict-iter-1.md           # Gate 3
├── verdict-iter-1.json         # Gate 3
├── audit-iter-1.md             # Gate 3.5
├── audit-iter-1.json           # Gate 3.5
├── iter-2/ … iter-N/
├── verdict-iter-N.md
├── verdict-iter-N.json
├── audit-iter-N.md
├── audit-iter-N.json
├── tradeoff-<n>.md             # Gate 3 (one per accepted tradeoff, if any)
├── tradeoff-preservation.md    # Gate 4 (only if preservation gate WARN/FAIL was accepted)
├── tradeoff-audit.md           # Gate 4 (only if audit gate WARN/FAIL was accepted — rare; requires explicit user sign-off on a specific P1)
├── verdict-final.md            # Gate 4
├── verdict-final.json          # Gate 4
├── audit-final.md              # Gate 4 (final audit pass)
├── audit-final.json            # Gate 4
├── behavior-check.md           # Gate 4 (feeds the preservation gate)
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
- **Treating the preservation gate as a sliding score.** It is binary by design — `PASS`, `WARN`, `FAIL`, or `N/A`. There is no "3.5/5 preservation" to nudge upward by dropping screenshots into a directory. Either the contract surfaces have fresh behavior evidence in `behavior-check.md` (gate = `PASS`), or they don't (gate ≤ `WARN`).
- **Declaring register from screenshots when PRODUCT.md exists.** Gate 0 pre-flight runs `context.mjs` precisely so register comes from one source. If you skip the pre-flight and declare from screenshots, you produce the dialect mismatch this skill exists to prevent (refined-minimal in register.md vs. register: product in PRODUCT.md).
- **Treating Gate 1.5 / 3.5 as optional.** The audit gate is required, not advisory. Visual PASS while the audit reports a P1 a11y finding is exactly the failure mode dimensions 7+8 and the audit gate exist to prevent.
- **Letting a screenshot-only PASS hide an a11y P1.** The cold-context grader cannot see keyboard traversal, ARIA role correctness, or motion-opt-out. If `audit-findings.md` is missing, the orchestrator didn't dispatch Gate 1.5 — fix the dispatch, don't ship the verdict.
- **Quietly downgrading P1 findings to P2 to make the audit gate green.** The audit is the source of truth. If you disagree with a P1, either fix it or record a tradeoff in `tradeoff-audit.md` with explicit user sign-off. Rewriting severity to dodge the gate is the same pattern as supplying screenshots without behavior evidence to push the preservation gate from `WARN` to `PASS`.

## Reuse, don't duplicate

- **Grading rules** — `agents/uiux-grader.md` is the single source of truth. This skill orchestrates dispatch; it does not restate dimensions or verdict format.
- **Rubric dimensions + anchor scores** — `skills/uiux-design-loop/rubric.md`. Both this skill and the grader load it.
- **Component generation from scratch** — `frontend-design` skill. This skill wraps iteration; it does not replace generation.
- **Project-specific Layer 2 rules** — `.uiux-loop/project-rules.md` in the host project. The grader reads it; this skill does not duplicate its contents.
- **Brand-voice guidance** — host project's documentation (e.g., source-of-truth docs, memory entries). Grader cites; this skill does not embed.
- **Production-grade craft + register vocabulary + code-fidelity audit** — `impeccable` skill. The loop owns the verdict; impeccable owns the craft. See `skills/uiux-design-loop/impeccable-map.md` for the seams (Gate 0 pre-flight + register-taxonomy table, Gate 1.5/3.5 audit gate, Dimensions 7+8 scoring, Gate 4 mandatory exit-pass prompt). All four seams fire on every run — impeccable is a required dependency, enforced by the Gate 0 precondition HARD-GATE.
