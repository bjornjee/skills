# UI/UX rubric — eight dimensions and two acceptance gates

The rubric owns scoring and gate semantics. The parent owns evidence collection and the loop budget. Scores measure the declared surface and requested outcome, not a generic preferred design style.

## Scoring scale

For each applicable dimension with sufficient evidence, use an integer 1–5: 1 fails the declared purpose, 3 is usable with a concrete quality gap, and 5 is a demonstrated strength. Use 2 and 4 for intermediate quality. Include all eight dimension keys in every verdict.

Use `null` instead of a number only with a matching `score_exceptions` entry containing a state and evidence-based reason:
- `N/A`: the declared scope makes the dimension inapplicable under its rules below. Only brand-voice-adherence and cross-locale-consistency permit this state.
- `UNVERIFIED`: required evidence is missing, stale, or insufficient to assign a score. Also record the missing evidence in `verification_gaps`; this prevents PASS and ACCEPTED_TRADEOFF.

Missing evidence never establishes inapplicability. Numeric scores have no `score_exceptions` entry. Do not substitute zero, a fabricated passing score, or the string `N/A` for a null score.

## Priority weights

Optional `.uiux-loop/weights.json` contains positive finite multipliers, default 1.0:

```json
{ "content-density": 1.5, "cross-locale-consistency": 0.5 }
```

For numeric scores, priority = `(5 - raw_score) * weight`. Higher weight moves a defect earlier in the repair queue. Do not calculate priority for null scores; required evidence collection and blocking gate repairs take precedence over visual refinements. **Acceptance always uses raw scores**, never multiplied scores: a raw 5 with weight 0.5 still passes; a raw 3 with weight 1.5 still fails the four-point floor. Unknown dimension keys, zero/negative/nonfinite weights, and out-of-range numeric scores are invalid input. Report invalid input as a verification gap and request its correction; do not silently normalize it.

## Overall verdict

- `PASS`: every applicable dimension has a numeric score >=4, the requested outcome is fulfilled, fresh audit PASS, preservation PASS/N/A, established reviewer independence, and no verification gaps. Valid N/A dimensions are excluded from the score threshold.
- `REWORK`: a raw score is 1 or the declared flow needs broader redesign. Explain the needed work; this does not authorize expanding scope.
- `ACCEPTED_TRADEOFF`: the user explicitly accepted a named nonblocking visual shortfall; audit PASS, preservation PASS/N/A, and complete evidence are still mandatory. Record the acceptance and affected score. This is not PASS.
- `ITERATE`: acceptance has not been reached and REWORK does not apply, including a score of 2–3, an unfulfilled requested outcome, or a mandatory gate/evidence check that has not passed.

Evaluate PASS first, then ACCEPTED_TRADEOFF for explicitly accepted nonblocking visual shortfalls only, then REWORK, otherwise ITERATE. ACCEPTED_TRADEOFF requires established independence, no verification gaps, and all other applicable dimensions at least four; it cannot waive a required flow or behavior. These verdicts describe the evidence, not permission to run another iteration. The parent alone enforces the loop budget and reports exhaustion separately without rewriting the grader's verdict.

No score, user tradeoff, or exhausted budget waives unresolved P0/P1 findings or missing evidence. An intentional change to a preservation contract must be explicitly authorized and then verified against the revised contract.

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
- **No register declared.** Use a null score with an UNVERIFIED exception and a verification gap; request the missing declaration rather than inventing a register. Apply the overall verdict rules above.
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
- `project-rules.md` — if absent, score only against `flow-map.md` declared tone. Use N/A only when the declared scope establishes that no brand/voice constraints apply. If brand rules or tone are required but not supplied, use UNVERIFIED.

### Hard rule on this dimension
You may cite a violation. You may **not** suggest the replacement copy. The implementer rewrites with the source doc; you grade.

---

## Dimension 6 — `cross-locale-consistency`

**Definition.** Where the project ships multiple locales (EN + CN, etc.), do the locales agree on what they should agree on, and diverge intentionally where they should diverge?

### Applicability
- Use N/A when the declared flow and applicable project constraints establish that cross-locale comparison is outside this task's scope, such as an explicitly single-locale flow.
- If multiple locales are required but screenshots or comparison criteria are missing, use UNVERIFIED. The number of supplied screenshots does not determine applicability.

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

## Dimension 7 — `accessibility`

Evaluate the applicable accessibility standard, declared flow, and actual interaction evidence. Use `audit-findings.md` and keyboard/assistive-technology checks in `behavior-check.md`; screenshots cannot prove focus order, semantics, labels, or computed contrast.

- **1:** a confirmed P0 accessibility defect prevents the flow.
- **2:** a confirmed P1 defect remains.
- **3:** a material nonblocking usability gap is demonstrated; explain its impact.
- **4:** required interaction evidence passes, with only disclosed minor P2 findings.
- **5:** a fresh audit has no relevant findings and the complete applicable interaction checks pass.

Missing evidence is a verification gap and prevents PASS regardless of a provisional score. P2 does not automatically mean score 3: distinguish a minor finding from a material usability gap. Validate target sizes and contrast against the applicable standard and exceptions, not an invented universal threshold.

## Dimension 8 — `technical-quality`

Use fresh audit findings plus browser/parser/build evidence: correct rendering, no blocking console errors, resolved imports and CSS variables, appropriate reduced-motion behavior, and measured performance where a budget is declared. Do not infer performance from a screenshot or impose unrelated stylistic bans.

Use the same severity/evidence anchors as accessibility: P0=1, P1=2, a material nonblocking gap=3, verified behavior with minor disclosed P2 findings=4, and complete evidence without relevant findings=5. Missing or stale evidence blocks PASS. This dimension assesses the changed implementation; preservation assesses the declared compatibility surface.

## Preservation gate

This gate is independent of the raw scores. States are `PASS | WARN | FAIL | N/A`:

| State | Meaning |
|---|---|
| PASS | Every declared surface has fresh screenshot and live behavior evidence at the current revision and meets the authorized contract. |
| WARN | Required evidence is missing/stale, or an unapproved visual deviation needs resolution; no confirmed blocking defect is known. |
| FAIL | A confirmed preserved behavior is broken, unreachable, or violates the required contract. |
| N/A | The preservation contract explicitly has no surfaces to preserve. |

Confirmed failure takes precedence over missing evidence. The parent records clicks, tab switches, route transitions, console messages, and computedStyle checks as applicable in `behavior-check.md` **before grading**. Screenshots alone cannot establish PASS. Required verification gaps are never N/A.

## Audit gate

States are `PASS | WARN | FAIL`; an audit is required, so N/A is not an audit state:

| State | Meaning |
|---|---|
| PASS | Fresh complete audit at the evidence revision, no unresolved P0/P1; any P2 findings are disclosed. |
| WARN | Audit is absent, stale, or incomplete and there is no known unresolved P0/P1. |
| FAIL | One or more known P0/P1 findings remain unresolved, regardless of evidence freshness. |

These conditions are disjoint. Audit the baseline surface files, then the entire declared change since baseline. An empty unstaged diff does not mean there is nothing to audit. User acceptance cannot turn an unresolved P1 into PASS.

## Evidence and output

Every finding cites a screenshot, behavior row, or audit finding ID, states impact, and gives a concrete repair. Include applicable project constraints as evidence; do not require a prewritten rule for an observable defect. Record gate findings in their gate blocks and include actionable repairs in the critique brief when work remains.

The grader returns the JSON contract defined in the repository's `agents/uiux-grader.md`. It includes all eight score keys, exceptions for null scores, evidence revision, independence, gate states, verification gaps, prior-verdict finding changes, and explicit accepted tradeoffs. Optional `project-rules.md` constrains the surface; it does not waive security, accessibility, or the evidence gate.
