# impeccable ↔ uiux-design-loop integration map

This file is the optional seam between `/skills:uiux-design-loop` (graded review) and the `impeccable` skill (production frontend craft). The loop owns *whether the design is right*; impeccable owns *how to make it right*. They compose; they do not overlap.

Load this file only when impeccable is available. The loop runs standalone if it is not.

## Detection

The orchestrator treats impeccable as available when either signal is true:

```bash
test -f "$HOME/.claude/skills/impeccable/SKILL.md"
test -f PRODUCT.md -o -f DESIGN.md   # host project already opted in
```

If neither is true, skip the rest of this file and proceed with the loop's standalone flow.

## Gate 0 — sourcing the register declaration from impeccable artifacts

The loop's `register.md` must still be written to disk before Gate 1 (the HARD-GATE is unchanged). But the *content* may be sourced from impeccable's existing brief artifacts rather than re-declared from scratch.

| impeccable source | `register.md` field |
|---|---|
| `PRODUCT.md` `register:` field (Brand vs. Product register) | **Chosen register** — paste verbatim, then map to the loop's named-register vocabulary if the project uses a custom name. |
| `PRODUCT.md` theme scene sentence (who uses this, where, ambient light, mood) | **Why this register** — paste; this is exactly the sentence the loop wants. |
| `DESIGN.md` color tokens + 2–3 named anchor references | **Reference mockups / sources** — link the file plus list each named anchor (specific products, brands, objects). |
| `DESIGN.md` "absolute bans" or "reflex-reject" notes; `/impeccable shape` brief sections 3 (Design Direction) and 5 (Layout Strategy) | **Out-of-bounds** + **How this register interacts with the rubric** — quote the bans verbatim; they are what the register specifically rejects. |

**Conflict policy.** If `register.md` (loop) and `PRODUCT.md` (impeccable) disagree, **`register.md` wins** — it is the declared scope of this specific iteration. Log the divergence in a one-line comment at the top of `register.md` so the next pass through the loop can resolve.

## Gate 4 — exit-pass picks

After the loop reaches `Overall: PASS`, the verdict-final summary names which dimension was weakest on the way to PASS. Use that signal to pick a single named impeccable exit-pass command. The pass is optional; the user accepts or skips.

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

**Do not auto-run.** Present one suggestion to the user; they decide.

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
| `preservation-regression` | `reference/audit.md` | Technical-quality regression checks. |

The implementer reads the impeccable reference for *technique* if they want to. The loop still grades on rendered evidence — diff-as-proof remains a failure mode.

## Anti-patterns

- **Don't re-run impeccable on the in-scope surface after PASS unless you also re-grade.** The loop owns the verdict, not impeccable. Any visible change after PASS requires a fresh grader pass.
- **Don't let impeccable's `craft` rewrite a preservation surface.** `preservation-contract.md` is binding. If `/impeccable craft` would touch a preservation surface, scope it down or escalate to the user.
- **Don't substitute `/impeccable critique` for the `uiux-grader` subagent.** Cold-context grading is the loop's invariant; `/impeccable critique` sees the implementer's session and is not cold. Use both, but the loop's grader is the gate.
