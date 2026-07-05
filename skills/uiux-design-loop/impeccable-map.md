# impeccable ↔ uiux-design-loop integration map

This file is the **required** integration contract between `/skills:uiux-design-loop` (graded review) and the `impeccable` skill (production frontend craft). The loop owns *whether the design is right*; impeccable owns *how to make it right*. They compose; they do not overlap.

Load this file at session start. The loop refuses to run without impeccable — see the Gate 0 precondition HARD-GATE in `SKILL.md`.

## Precondition

The orchestrator asserts impeccable is installed before any Gate 0 work:

```bash
test -f "$HOME/.claude/skills/impeccable/SKILL.md" || {
  echo "impeccable skill is required by /skills:uiux-design-loop."
  echo "Install it from the skills marketplace, then re-run."
  exit 1
}
```

`PRODUCT.md` / `DESIGN.md` in the host project are downstream signals — they source the register declaration via the Gate 0 pre-flight. They are **not substitutes** for the install check. Without `~/.claude/skills/impeccable/SKILL.md`, the loop halts immediately. There is no degraded path.

Once the precondition passes, the loop **actively runs `node "$HOME/.claude/skills/impeccable/scripts/context.mjs"` at Gate 0 pre-flight** to auto-populate register declaration (see Gate 0 sourcing below). The script either prints `PRODUCT.md` content or reports `NO_PRODUCT_MD`; both branches are handled in `SKILL.md`.

## Gate 0 — sourcing the register declaration from impeccable artifacts

The loop's `register.md` must still be written to disk before Gate 1 (the HARD-GATE is unchanged). But the *content* is sourced from impeccable's brief artifacts at pre-flight rather than re-declared from scratch.

### Register taxonomy

The two skills speak different register dialects. impeccable picks the **family** (`brand` vs `product`); the loop picks the **member** (10 named registers). The dialects are orthogonal — a `product` register can still be `refined-minimal` OR `industrial` OR `playful`. Without an explicit mapping, the two skills get decided independently and the implementer ends up declaring both, in opposite order, with different names.

| impeccable register | uiux-loop register options |
|---|---|
| `product` | `refined-minimal`, `industrial`, `playful` (rare for dashboards) |
| `brand` | `editorial`, `dramatic`, `spacious`, `luxury`, `brutalist`, `organic`, `retro` |

**Rule.** impeccable's register chooses the family; the loop picks the member; never override. If `PRODUCT.md` says `register: product`, the loop's `register.md` must pick a member from row 1. Re-declaring `editorial` (a `brand`-family register) when PRODUCT.md says `product` is a dialect mismatch — fix PRODUCT.md or pick a row-1 member, do not override.

### Field-level mapping (what the pre-flight populates)

| impeccable source | `register.md` field |
|---|---|
| `PRODUCT.md` `register:` field | **Chosen register** — map through the taxonomy table above to pick a member of the corresponding family. Never paste `brand` or `product` verbatim; the loop scores against named members, not families. |
| `PRODUCT.md` theme scene sentence (who uses this, where, ambient light, mood) | **Why this register** — paste; this is exactly the sentence the loop wants. |
| `DESIGN.md` color tokens + 2–3 named anchor references | **Reference mockups / sources** — link the file plus list each named anchor (specific products, brands, objects). |
| `DESIGN.md` "absolute bans" or "reflex-reject" notes; `/impeccable shape` brief sections 3 (Design Direction) and 5 (Layout Strategy) | **Out-of-bounds** + **How this register interacts with the rubric** — quote the bans verbatim; they are what the register specifically rejects. |

**Pre-flight behavior.** The orchestrator reads `register:` from `PRODUCT.md`, looks up the row in the taxonomy table, and either auto-picks the most context-fitting member (when only one matches the theme scene sentence) or asks the user to choose among row members via `AskUserQuestion`. Either way, the final `register.md` `Chosen register` field is a row member, never the impeccable family name verbatim.

**Conflict policy.** Gate 0 pre-flight resolves conflicts *before* `register.md` is written: the orchestrator auto-populates from `PRODUCT.md` and asks the user to confirm or override. Whatever the user picks lands in `register.md` as the declared scope for this iteration. If the user overrides PRODUCT.md (rare), record the divergence in the `User confirmed at Gate 0` line of the template's `## Auto-populated from PRODUCT.md` block — the next pass reads that line to know which artifact won.

**Anchor sourcing.** If `PRODUCT.md` references concrete brand exemplars or screenshots, copy them into `.uiux-loop/register-anchors/` and list them in `register.md`'s `## Reference screenshots` block. Anchors are positive references the grader uses to score `visual-register-match` against your committed register, instead of falling back to its training-data prior.

## Gate 1.5 / 3.5 — impeccable audit contract

The cold-context grader cannot see the code. `impeccable audit` is the right tool for implementation fidelity (a11y, perf, motion, structural integrity); the grader is the right tool for visual fidelity. Gate 1.5 and Gate 3.5 plumb them so each gate knows what the other can see.

**Trigger.** Every grader pass. At Gate 1.5 the audit target is the files rendering the `flow-map.md` surfaces (baseline may have no changed files yet); at Gate 3.5 and Gate 4 the target narrows to the changed files in `git status`. Impeccable's presence is guaranteed by the Gate 0 precondition; no install check at this gate.

**Dispatch.** The loop's orchestrator runs `impeccable audit <target-files>` immediately **before** the corresponding grader pass (Gate 1 for baseline, Gate 3 for re-grade) so the findings file rides in the grader bundle. Two valid implementations:

1. **Subagent dispatch.** Spawn a subagent that runs `/impeccable audit <changed-files>` per `reference/audit.md` and emits findings to disk.
2. **CLI dispatch.** When `npx impeccable audit` is detected, run it directly with `--format=json`.

**Output format.** Severity-tagged findings (P0/P1/P2), each with:
- `severity`: `P0` | `P1` | `P2`
- `dimension`: `accessibility` | `technical-quality` (so the grader can map findings to the right dimension)
- `file`: relative path
- `line`: line number (optional but preferred)
- `rule`: one-line rule name (e.g., `role-tablist-misuse`, `missing-prefers-reduced-motion`, `label-for-missing`, `touch-target-too-small`)
- `evidence`: one-line concrete observation

**Storage.** Orchestrator writes:
- `.uiux-loop/audit-baseline.md` / `.json` at Gate 1.5
- `.uiux-loop/audit-iter-<n>.md` / `.json` at Gate 3.5
- `.uiux-loop/audit-final.md` / `.json` at Gate 4 step 3; `.uiux-loop/audit-exit-pass.md` / `.json` on the Gate 4 exit-pass re-entry

**Merging into the grader bundle.** The orchestrator passes the matching audit file as `audit-findings.md` into the grader's bundle. The grader uses it to score dimensions 7 (`accessibility`) and 8 (`technical-quality`) per the severity → score mapping in `rubric.md`, and emits the `## Audit gate` state.

**Gate semantics.**

| Audit output | `audit_gate` state | Overall verdict impact |
|---|---|---|
| Zero P0/P1 findings + fresh `audit-findings.md` | `PASS` | No impact (does not block) |
| Only P2 findings, OR changed-files set empty, OR `audit-findings.md` stale | `WARN` | Downgrades Overall to `ITERATE` |
| One or more P0/P1 findings unaddressed | `FAIL` | Downgrades Overall to `ITERATE` |
| Changed-files set empty AND no audit-relevant code paths touched | `N/A` | No impact (does not block); rare — most UI loops touch at least one audit-relevant surface |

**Tradeoff escape.** A user may sign off on a specific P1 by recording `.uiux-loop/tradeoff-audit.md` with the verbatim finding row, reason, and acceptance. The audit then reads as PASS for that finding only. The gate exists precisely to surface these — do not use tradeoffs as a routine workaround.

## Gate 4 — exit-pass picks

After the loop reaches `Overall: PASS`, the verdict-final summary names which dimension was weakest on the way to PASS. The orchestrator picks a single named impeccable exit-pass command from the table below and **fires `AskUserQuestion` with that command pre-selected as Recommended**. The exit-pass is **mandatory** — the user confirms which pass to run, but a `Skip — ship as-is` option is not offered inside the gate. The only escape is aborting the loop entirely; shipping past Gate 4 without running the suggested pass is the failure mode this gate exists to prevent.

| Weakest pre-final dimension or remaining gap | Suggested exit pass |
|---|---|
| `content-density` or `visual-register-match` borderline | `/impeccable polish <target>` |
| Production-readiness gap: i18n, error states, edge cases, empty states | `/impeccable harden <target>` |
| Colour still feels flat or generic | `/impeccable colorize <target>` |
| Typography hierarchy or font pairing still feels off | `/impeccable typeset <target>` |
| Spacing, rhythm, or hierarchy still uneven | `/impeccable layout <target>` |
| Motion absent or generic | `/impeccable animate <target>` |
| Design still feels safe / bland | `/impeccable bolder <target>` |
| Design feels loud or overstimulating | `/impeccable quieter <target>` |
| UX copy, labels, or errors still generic | `/impeccable clarify <target>` |
| Final verdict already strong on every dimension | No pass needed; ship. |

**Do not auto-run the pass without `AskUserQuestion`.** The roundtrip is unconditional: even when the table row is `No pass needed; ship.`, the orchestrator fires `AskUserQuestion` to confirm the no-op ship. Skip is not an option — the user picks the pass to run or aborts the loop.

## Dimension → impeccable reference (informational lookup)

For implementers who want to dig into the craft detail behind a critique-brief item, the matching impeccable reference file goes deepest on that dimension's craft area. Pure lookup — not a dispatch contract; the loop's inner-loop (Gate 2) is unchanged.

| Rubric dimension | impeccable reference | Notes |
|---|---|---|
| `user-flow-fidelity` | `reference/shape.md`, `reference/interaction-design.md` | Discovery → primary user action; flow modeling. |
| `visual-register-match` | `reference/brand.md`, `reference/product.md` | Register vocabulary + scene-sentence theme. |
| `content-density` | `reference/layout.md`, `reference/distill.md` | Density without sparseness; composed minimalism. |
| `affordance-honesty` | `reference/interaction-design.md`, `reference/polish.md` | Affordance language; hover/focus states. |
| `brand-voice-adherence` | `reference/clarify.md`, `reference/brand.md` | UX copy aligned to brand. |
| `cross-locale-consistency` | `reference/harden.md`, `reference/adapt.md` | i18n + responsive parity. |
| `accessibility` | `reference/audit.md`, `reference/harden.md` | A11y P0/P1 findings drive this dimension. Score inherited from `audit-findings.md` at Gate 1.5 / 3.5; always present because impeccable is mandatory. |
| `technical-quality` | `reference/audit.md`, `reference/optimize.md` | Motion-opt-out, perf budget, structural integrity. Same severity → score mapping as `accessibility`; always present because impeccable is mandatory. |
| `preservation-gate` | `reference/audit.md` | Out-of-scope regression checks. The loop tracks preservation as a binary gate (PASS/WARN/FAIL/N/A), not a scored dimension. Distinct from `technical-quality`: preservation scores regression in untouched surfaces; tech-quality scores craft of *new* code. |
| `audit-gate` | `reference/audit.md` | Binary gate fed by `impeccable audit`. Symmetric to preservation gate. P0/P1 on changed files = `FAIL` = block PASS. |

The implementer reads the impeccable reference for *technique* if they want to. The loop still grades on rendered evidence — diff-as-proof remains a failure mode.

## Anti-patterns

- **Don't re-run impeccable on the in-scope surface after PASS unless you also re-grade and re-audit.** The loop owns the verdict, not impeccable. Any visible change after PASS requires a fresh grader pass (Gate 1) and a fresh audit pass (Gate 1.5).
- **Don't let impeccable's `craft` rewrite a preservation surface.** `preservation-contract.md` is binding. If `/impeccable craft` would touch a preservation surface, scope it down or escalate to the user.
- **Don't substitute `/impeccable critique` for the `uiux-grader` subagent.** Cold-context grading is the loop's invariant; `/impeccable critique` sees the implementer's session and is not cold. Use both, but the loop's grader is the gate.
- **Don't declare register without consulting `PRODUCT.md`'s `register:` field.** When `PRODUCT.md` exists, run the Gate 0 pre-flight and map through the register-taxonomy table above. Re-declaring from screenshots produces the dialect mismatch the table exists to prevent. (If `PRODUCT.md` is absent, run `/impeccable init` first — it is the recommended path through the `NO_PRODUCT_MD` branch.)
- **Don't skip `impeccable audit` at Gate 1.5/3.5 because "the screenshots look fine."** The audit gate exists precisely to surface what screenshots can't: keyboard traversal, ARIA correctness, motion-opt-out, structural integrity. Skipping it means dimensions 7+8 cannot score and the loop is back to its pre-2026 screenshot-only blind spot.
- **Don't paste impeccable's `brand` / `product` register verbatim into `register.md`.** The loop grades against named members (editorial, refined-minimal, etc.). The taxonomy table maps families to members; use it.
- **Don't run the Gate 4 exit-pass silently.** When the loop reaches PASS, the orchestrator MUST fire `AskUserQuestion` with the suggested command pre-selected. Printing the recommendation as text and exiting is the failure mode the mandatory prompt exists to fix. There is no Skip — the user confirms which pass to run or aborts the loop entirely.
