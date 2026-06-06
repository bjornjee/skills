# Critique brief — example

> This is what the `uiux-grader` subagent writes back. The implementer reads only the `## Critique brief` section to drive the next inner-loop pass. Verdict block format is the contract — do not edit the grader's output, do not summarise it.

```
## Verdict
Overall: ITERATE
Weakest dimension: affordance-honesty (2.0/5)
Threshold: 2.0 ≥ 4 → not met
Iterations remaining: 5

## Per-dimension scores
- user-flow-fidelity:        4/5 (weight 1.0) — step-1-desktop: primary CTA is visible above the fold but eyebrow text competes for first eye-stop.
- visual-register-match:     4/5 (weight 1.0) — step-1-desktop, step-2-desktop: refined-minimal is committed in type and spacing; one footer block drifts toward generic SaaS card pattern.
- content-density:           3/5 (weight 1.0) — step-1-desktop: hero has one short headline and no supporting composition (image, lede, eyebrow). Register is refined-minimal so this is borderline; calling 3 because the second viewport (step-2-desktop) shows the section labelled "Sessions" with only a heading and an arrow card — that's the failure mode the rubric explicitly names.
- affordance-honesty:        2/5 (weight 1.0) — step-2-desktop: "Sessions →" card is the only path to session details but has no visible click affordance (no border, no hover state visible at default). Primary CTA in the hero is styled as a text link competing with body type.
- brand-voice-adherence:     N/A — no project-rules.md supplied; no rule violations visible.
- cross-locale-consistency:  N/A — only one locale's screenshots supplied.

## Preservation gate
State: PASS
Evidence: behavior-check.md rows 1–3 PASS; live console clean; computedStyle on .settings-modal matches baseline.

## Brief diff (vs prior verdict)
- prior #1 [affordance-honesty]: not-addressed — step-2-desktop still shows the "Sessions →" card with no border or button label.
- prior #2 [content-density]: partial — hero headline raised to 4rem but lede + eyebrow still absent.
- prior #3 [user-flow-fidelity]: addressed — eyebrow reduced to 0.85rem; H1 is now first eye-stop.

## Critique brief
1. [affordance-honesty] step-2-desktop: the "Sessions →" cross-link card needs a visible click affordance — either a bordered card with explicit "Read about sessions" button text, or replace the pattern with an image-led card showing a session photo + headline. The arrow alone reads decorative. [Layer 1]
2. [content-density] step-1-desktop: the hero is one headline on a white field. Refined-minimal allows this if the typographic rhythm carries, but the headline at 4rem on a 1440 viewport still reads as undersized for the negative space around it — either raise the headline to 5rem or add an eyebrow + 2-line lede to compose the block. [Layer 1]
```

```json
{
  "overall": "ITERATE",
  "weakest_dimension": "affordance-honesty",
  "weakest_weighted_score": 2.0,
  "threshold_met": false,
  "iterations_remaining": "5",
  "scores": [
    { "dimension": "user-flow-fidelity", "raw": 4, "weight": 1.0, "weighted": 4.0, "screenshot": "step-1-desktop", "justification": "primary CTA visible above fold; eyebrow competes for first eye-stop" },
    { "dimension": "visual-register-match", "raw": 4, "weight": 1.0, "weighted": 4.0, "screenshot": "step-1-desktop", "justification": "refined-minimal committed in type and spacing; one footer block drifts to generic SaaS" },
    { "dimension": "content-density", "raw": 3, "weight": 1.0, "weighted": 3.0, "screenshot": "step-2-desktop", "justification": "Sessions section is heading + arrow card only" },
    { "dimension": "affordance-honesty", "raw": 2, "weight": 1.0, "weighted": 2.0, "screenshot": "step-2-desktop", "justification": "Sessions card has no visible click affordance; hero CTA styled as text link" },
    { "dimension": "brand-voice-adherence", "raw": null, "weight": 1.0, "weighted": null, "screenshot": null, "justification": "N/A — no project-rules.md supplied" },
    { "dimension": "cross-locale-consistency", "raw": null, "weight": 1.0, "weighted": null, "screenshot": null, "justification": "N/A — only one locale supplied" }
  ],
  "preservation_gate": {
    "state": "PASS",
    "evidence": "behavior-check.md rows 1–3 PASS; live console clean; computedStyle on .settings-modal matches baseline"
  },
  "critique_brief": [
    { "dimension": "affordance-honesty", "screenshot": "step-2-desktop", "change": "Bordered Sessions card with explicit 'Read about sessions' button label, or image-led card with session photo + headline", "layer": 1, "rule": null },
    { "dimension": "content-density", "screenshot": "step-1-desktop", "change": "Raise hero headline to 5rem, or add eyebrow + 2-line lede to compose the block", "layer": 1, "rule": null }
  ],
  "brief_diff": [
    { "prior_index": 1, "dimension": "affordance-honesty", "status": "not-addressed", "evidence": "step-2-desktop still shows Sessions card with no border or button label" },
    { "prior_index": 2, "dimension": "content-density", "status": "partial", "evidence": "hero headline raised to 4rem but lede + eyebrow still absent" },
    { "prior_index": 3, "dimension": "user-flow-fidelity", "status": "addressed", "evidence": "eyebrow reduced to 0.85rem; H1 is now first eye-stop" }
  ]
}
```

## How the implementer reads this

- Item #1 first. It targets the weakest weighted dimension (`affordance-honesty` at 2/5) — fixing it has the largest verdict impact.
- After the edit, capture fresh screenshots, dispatch a new grader pass.
- Do **not** also address item #2 in the same iteration. The grader will catch it in the next pass — or not, if #1's fix changed the composition enough to resolve it.
- Do **not** invent items not on the brief. The inner loop has no other input source.

## What the implementer does NOT do

- Argue with the verdict in the next dispatch. The grader is cold; arguing is wasted context.
- Pre-emptively "fix" things the grader didn't flag. They will be flagged next pass if they need fixing.
- Skip the screenshot step because the change is small. Diff-as-proof is the failure mode this skill exists to prevent.
