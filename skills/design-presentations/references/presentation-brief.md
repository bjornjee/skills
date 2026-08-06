# Mutable presentation brief

Create this compact contract before designing. It is task-local state, not a fixed
enum or a file that must be committed. Accept the user's own words and choices.

```text
Mode/purpose: <technical sharing, proposal, pitch, training, review, workshop, custom>
Audience and desired action: <who; what should change after the talk>
Length and setting: <minutes/slides; live, async, leave-behind, workshop>
Story authority: <source documents, data, existing deck, speaker direction>
Style authority: <exact template, visual references, verbal art direction, delegated>
Template: <required source; optional source; none>
Visual direction: <tone, palette, typography, density, imagery, motion, exclusions>
Output and editor: <PPTX, Google Slides, both; intended final review surface>
Editability: <fully editable, narrative editable, selected flattened assets>
Assets and restrictions: <logos, fonts, photos, diagrams, licenses, confidentiality>
QA depth: <draft, review-ready, delivery-ready>
Mutation authority: <local only; upload/create/copy/replace/share permissions>
Open decisions: <only choices that materially block the next step>
```

## Resolve style authority

Use the strongest user-selected authority available:

1. exact template/master or approved deck;
2. selected visual references with stated elements to preserve;
3. explicit verbal art direction;
4. agent-proposed directions only when the user delegates the choice.

Do not mix authorities silently. If a supplied template conflicts with a newer user
instruction, surface the conflict and ask only when the choice materially changes the
result. Otherwise apply the newer explicit instruction and record the exception.

## Update the mode without restarting

When the user changes the mode, style, or template:

1. Restate only the changed brief fields.
2. Preserve all unmodified decisions and source provenance.
3. Identify the invalidation set: story spine, all slides, selected slides, shared
   layouts, palette/type system, diagrams, or final QA only.
4. Rework the smallest coherent set. If a shared master or style token changes,
   inspect every slide that consumes it.
5. Keep the last known-good deck and assets until the revised direction passes QA.

Examples of valid changes include `make this investor-facing`, `keep the story but
use the supplied dark template`, `switch from technical sharing to a workshop`, or
`retain the master but make the diagrams editorial and high contrast`.

## Defaults when the user delegates

Use conservative defaults only for undecided fields:

- editable narrative;
- 16:9 unless the template dictates otherwise;
- one clear conclusion per slide;
- restrained motion;
- accessible contrast and presentation-scale readability;
- local outputs and no external mutation.

Label these as proposed defaults, not user decisions. The user may replace them at
any point.
