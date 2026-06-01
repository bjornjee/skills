# UI/UX rubric — 6 dimensions

This file is the single source of truth for the dimensions, score anchors, and pass thresholds used by `/skills:uiux-design-loop` and the `uiux-grader` subagent. If a rule needs to change, change it here.

## Scoring scale

Each dimension is scored on an integer 1–5:

- **1** — Render actively fails this dimension. Visitor would be confused, misled, or visually fatigued.
- **3** — Render is acceptable but unremarkable. Nothing wrong; nothing distinguishing.
- **5** — Render commits to this dimension with intent. A reasonable observer would name it as a strength.

Use 2 and 4 as the in-between gradations. Do not invent .5s.

## Weights

Default weight = 1.0 per dimension. A host project may override via `.uiux-loop/weights.json` with the form:

```json
{ "content-density": 1.5, "cross-locale-consistency": 0.5 }
```

Weighted score = raw score × weight.

## Pass threshold

The **weakest weighted score** across all scored dimensions determines the overall verdict:

| Weakest weighted score | Overall |
|---|---|
| ≥ 4 | `PASS` |
| 2 – 3.99 | `ITERATE` |
| < 2 OR > 5 critique items needed | `REJECT` |

Skipped dimensions (`N/A`) do not contribute to the weakest score.

---

## Dimension 1 — `user-flow-fidelity`

**Definition.** Does the render advance the visitor's declared goal at this step of `flow-map.md`? At each flow step, the visitor has one primary goal (read this, decide that, click here). The render either serves the goal or competes with it.

### Anchors
- **1.** Visitor would not know what to do next. Required affordance is missing or buried. Primary content is below the fold without a scroll cue.
- **3.** The right thing is on the page, but the visual hierarchy does not prioritise it — visitor will find it after some scanning.
- **5.** First eye-stop is exactly the thing the flow step says it should be. Affordance is unambiguous and at the visual centre of attention.

### Common failures
- "Improved" UX that removes the page's only CTA in service of strict content rules — visitor lands and has no next step.
- Hero hierarchy where eyebrow text or subheading out-weights the primary headline.
- Decision points in the flow that the render does not visually signal as decision points.

### Score from
- The screenshot per flow step.
- The visitor goal declared at that step in `flow-map.md`.

---

## Dimension 2 — `visual-register-match`

**Definition.** Does the render look like the declared register? `register.md` names one of editorial, dramatic, spacious, refined-minimal, brutalist, organic, retro, luxury, playful, industrial, or a project-specific register. The render either commits to that register or drifts toward a generic default.

### Anchors
- **1.** Render is in a different register entirely. A spacious register declared, render is dense. An editorial register declared, render is brutalist. Etc.
- **3.** Render is *not* in the declared register but also not in any other clear register — it is generic. Looks like a default Tailwind page.
- **5.** Render commits visibly to the declared register in type, colour, spacing, motion, and composition. A reasonable observer asked "what's the aesthetic here?" would name the declared register.

### Common failures
- **No register declared.** Grader treats this as a missing-artifact REJECT; do not score this dimension when the declaration is absent.
- "Polish" without a register — render is tighter, but tighter toward what?
- Inconsistent commitment: hero is editorial, footer is generic SaaS.

### Score from
- Every screenshot. Register is a property of the whole experience, not one section.

---

## Dimension 3 — `content-density`

**Definition.** Does the page carry enough content to serve its purpose, and does it carry it intentionally? This is the dimension that catches sparse-because-strict-content-rules masquerading as minimal.

### Anchors
- **1.** Render is *visually impoverished*. Page reads as half-finished. Sections that should support a visitor decision are stripped to a heading and one line of text. The implementer "respected content rules" by removing things, not by composing what remains.
- **3.** Density is uneven. Some sections carry their weight; others are placeholder-thin. No declared minimal register, so the thinness reads as incomplete rather than intentional.
- **5.** Either (a) content carries its weight throughout, with visible intent in every block; or (b) the declared register is minimal/spacious and the sparseness reads as *composed* (clear typographic rhythm, deliberate whitespace, intentional one-element compositions).

### Common failures
- Removing a section's only CTA to honour "use the source doc verbatim" — leaves a section that *names* a service with no way to engage with it.
- "Card with a heading and an arrow" cross-link patterns — visually anaemic; flag here AND on `affordance-honesty`.
- Heroes with one short headline and no supporting composition (image, eyebrow, lede), no minimal register to justify the bareness.

### Score from
- Screenshots, especially the first viewport per page.
- `register.md` — if minimal/spacious is the chosen register, recalibrate score 3 upward; if dramatic/editorial, recalibrate downward.

---

## Dimension 4 — `affordance-honesty`

**Definition.** Do interactive elements look interactive, and do decorative-only elements stay decorative? Affordances should not over-promise (a decorative arrow that looks clickable but isn't) or under-promise (a primary action styled as ghost text).

### Anchors
- **1.** Render contains "cards" that are entire sections of clickable surface but no visible affordance — or, conversely, prominent affordances that lead to dead ends. Primary CTA styled less prominently than secondary chrome.
- **3.** Affordances are present and roughly correct, but inconsistent: similar elements use different styles for the same action.
- **5.** Every interactive element has a clear affordance language. Hover states, focus rings, cursor changes (where applicable to the screenshot's evidence) reinforce honesty. Decorative arrows are decorative; clickable cards have visible click-targets.

### Common failures
- **"Card with heading and arrow only"** — flag here even if `content-density` already penalised it. Two failure modes, two scores.
- Primary CTA styled as a text link; secondary nav element styled as a button.
- "Read more →" patterns where the arrow is the only affordance for an entire content block.

### Score from
- Screenshots showing interactive elements. If the orchestrator can provide hover-state screenshots, factor them in. If not, score from default-state only and note the limit.

---

## Dimension 5 — `brand-voice-adherence`

**Definition.** Does the render respect the project's brand-voice rules as declared in `project-rules.md` (if present)? This dimension is the *visible textual* layer — headlines, CTAs, body type that appears in screenshots. It is not about prose quality in general; it is about whether the render contradicts project rules.

### Anchors
- **1.** Render visibly violates a quoted `project-rules.md` rule. (E.g., rule says "do not stamp the practitioner's name on every block"; render has "Workshops with [name]", "Healing with [name]", "Learn from [name]" stacked.)
- **3.** No declared rules visibly violated, but voice is generic SaaS where the rules imply a specific tone (warm, plural, docx-led, etc.). Render does not contradict; it also does not serve.
- **5.** Render carries the rules' tone visibly. Headlines sound like the project, not like a template.

### Common failures
- Repeated personal-attribution stamps where the rules ask for restraint.
- Generic CTAs ("Get Started", "Learn More") on a project whose rules call for warmth or specificity.
- Headlines invented in the implementer's voice when the source doc has a specific phrasing the rules say to use.

### Score from
- Screenshots — what visible text the render exposes.
- `project-rules.md` — if absent, score only against `flow-map.md` declared tone; if no tone is declared and no rules exist, score `N/A`.

### Hard rule on this dimension
You may cite a violation. You may **not** suggest the replacement copy. The implementer rewrites with the source doc; you grade.

---

## Dimension 6 — `cross-locale-consistency`

**Definition.** Where the project ships multiple locales (EN + CN, etc.), do the locales agree on what they should agree on, and diverge intentionally where they should diverge?

### Score `N/A` when
- Only one locale's screenshots were supplied, or
- `project-rules.md` does not declare multi-locale behaviour, or
- `flow-map.md` covers only one locale.

### Anchors (when scoring)
- **1.** Locales disagree on something that should be invariant (primary visual register, brand presence, key affordance layout) — and disagree on it accidentally, not as a documented divergence.
- **3.** Locales mostly agree on the invariants but diverge on small details that read as drift rather than intent.
- **5.** Invariants are visibly shared. Intentional divergences (e.g., per `project-rules.md` "CN partners-block placement differs from EN") are honoured.

### Common failures
- One locale gets a "polish pass," the other doesn't — they drift.
- The locales' page structures diverge in ways neither `flow-map.md` nor `project-rules.md` declared.

### Score from
- Screenshot pairs from each locale, same flow step.
- `project-rules.md` — divergence declarations.

---

## How to cite findings

When the grader writes a critique-brief item, every item must:

1. Name the dimension (verbatim from the 6 fixed names).
2. Reference at least one screenshot (`step-<n>-<viewport>`).
3. Describe the *visible change* that would raise the score.
4. If a `project-rules.md` rule is cited, quote it verbatim with `[Layer 2: "<quote>"]`.

See `agents/uiux-grader.md` for the full verdict-block contract.

## How to override per project

In the host project's worktree:

| File | What it changes |
|---|---|
| `.uiux-loop/weights.json` | Per-dimension weights (default 1.0). Higher weight raises the bar; lower weight allows that dimension to be relatively weak. |
| `.uiux-loop/project-rules.md` | Layer 2 rules the grader cites verbatim. Use for project-specific brand-voice, locale divergence rules, register preferences. |

The grader loads these if present. Without them, the canonical defaults above apply.
