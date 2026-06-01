# Critique brief — example

> This is what the `uiux-grader` subagent writes back. The implementer reads only the `## Critique brief` section to drive the next inner-loop pass. Verdict block format is the contract — do not edit the grader's output, do not summarise it.

```
## Verdict
Overall: ITERATE
Weakest dimension: content-density (3.0/5)
Threshold: 3.0 ≥ 4 → not met
Iterations remaining: 5

## Per-dimension scores
- user-flow-fidelity:        4/5 (weight 1.0) — step-1-desktop: primary CTA is visible above the fold but eyebrow text competes for first eye-stop.
- visual-register-match:     4/5 (weight 1.0) — step-1-desktop, step-2-desktop: refined-minimal is committed in type and spacing; one footer block drifts toward generic SaaS card pattern.
- content-density:           3/5 (weight 1.0) — step-1-desktop: hero has one short headline and no supporting composition (image, lede, eyebrow). Register is refined-minimal so this is borderline; calling 3 because the second viewport (step-2-desktop) shows the section labelled "Sessions" with only a heading and an arrow card — that's the failure mode the rubric explicitly names.
- affordance-honesty:        2/5 (weight 1.0) — step-2-desktop: "Sessions →" card is the only path to session details but has no visible click affordance (no border, no hover state visible at default). Primary CTA in the hero is styled as a text link competing with body type.
- brand-voice-adherence:     N/A — no project-rules.md supplied; no rule violations visible.
- cross-locale-consistency:  N/A — only one locale's screenshots supplied.

## Critique brief
1. [affordance-honesty] step-2-desktop: the "Sessions →" cross-link card needs a visible click affordance — either a bordered card with explicit "Read about sessions" button text, or replace the pattern with an image-led card showing a session photo + headline. The arrow alone reads decorative. [Layer 1]
2. [content-density] step-1-desktop: the hero is one headline on a white field. Refined-minimal allows this if the typographic rhythm carries, but the headline at 3.5rem on a 1440 viewport reads as undersized for the negative space around it — either raise the headline to 5rem or add an eyebrow + 2-line lede to compose the block. [Layer 1]
3. [user-flow-fidelity] step-1-desktop: the eyebrow text is currently at 1.1rem and competes with the H1; the flow-map says the primary visitor task at step 1 is "read the headline". Reduce the eyebrow to 0.85rem so the H1 is the unambiguous first eye-stop. [Layer 1]
```

## How the implementer reads this

- Item #1 first. It targets the weakest weighted dimension (`affordance-honesty` at 2/5) — fixing it has the largest verdict impact.
- After the edit, capture fresh screenshots, dispatch a new grader pass.
- Do **not** also address items #2 and #3 in the same iteration. The grader will catch them in the next pass — or not, if #1's fix changed the composition enough to resolve them.
- Do **not** invent items not on the brief. The inner loop has no other input source.

## What the implementer does NOT do

- Argue with the verdict in the next dispatch. The grader is cold; arguing is wasted context.
- Pre-emptively "fix" things the grader didn't flag. They will be flagged next pass if they need fixing.
- Skip the screenshot step because the change is small. Diff-as-proof is the failure mode this skill exists to prevent.
