# Technical diagrams and raster assets

## Contents

- [Choose the medium](#choose-the-medium)
- [Visual system](#visual-system)
- [Value-bearing patterns](#value-bearing-patterns)
- [Raster prompt templates](#raster-prompt-templates)
- [Asset handling](#asset-handling)

## Choose the medium

Prefer native editable shapes, text, and connectors when they can explain the system
cleanly. Use raster image generation only when it materially improves a technical
visual, such as a dense architecture illustration or a coherent icon family. Do not
use raster generation to avoid learning the template or to decorate empty space.

Before drawing, state the diagram’s question and the one relationship it must make
obvious. A diagram without a decision, state change, ownership boundary, failure path,
or feedback loop is decoration.

Choose the label strategy before generating a raster asset:

- **Editable overlay (preferred):** reserve deliberate whitespace in the raster and
  add every label as native theme text in the deck.
- **Self-contained raster:** embed only stable, exact short labels when the asset must
  travel independently; validate every label and regenerate on any text defect.

## Visual system

- Canvas: light or white, sized to the intended slide region.
- Palette: DeployCo charcoal plus cyan, mint, and lavender sampled from the active
  template. Use neutrals for containers and rules.
- Typography: the theme’s modern sans-serif; short exact labels only.
- Hierarchy: one primary flow, secondary evidence or state, tertiary annotations.
- Connectors: thin, precise, with explicit arrow direction and minimal crossings.
- Nodes: consistent geometry and spacing; accent color communicates a defined role.
- Exclusions: no paragraphs inside diagrams, gradients, shadows, glow, bevels, 3D,
  pseudo-isometric infrastructure, cartoon characters, or generic box-and-arrow art.

Use labels that name concrete things: `exact diff`, `candidate graph`, `gate passed`,
`router weights`, `normalized evidence`. Avoid vague labels such as `process`, `AI`,
`system`, or `data` unless the slide defines them.

## Value-bearing patterns

- **Closed loop:** ordered stages across the top with a visible evidence/learning path
  returning to the next change.
- **Parallel review with one writer:** deterministic input fans out to read-only
  personas and scanners, reconverges at validation, then crosses one publication
  boundary.
- **Candidate routing:** stable origin enters the main reverse proxy; header/cookie
  selectors choose a pinned candidate graph while malformed selectors fail closed.
- **Cross-runtime proof:** immutable candidate flows through orchestrator, browser/API
  proof, Windows/native proof, and a revision-bound evidence ledger.
- **Traffic switch:** passing evidence is a precondition; desired weights change on the
  same deployed graph; audit and inverse weights make rollback explicit.
- **Continuous assurance:** scheduled sources normalize evidence, triage the first hard
  failure, route it to an owner, and feed the result back into coverage.

Do not reuse a pattern if it hides the system’s real topology or authority model.

## Raster prompt templates

Fill every brace with deck-specific, non-confidential information. Generate at the
asset region’s intended aspect ratio, not a convenient square.

### Architecture flow

```text
Professional technical architecture diagram for a DeployCo presentation, aspect
ratio {width}:{height}, white canvas, {ordered nodes and branches}, {label strategy
and labels or reserved label zones}. Show {ownership/state/failure relationship} as
the primary visual.
Use thin precise charcoal connectors and restrained cyan, mint, and lavender accents
sampled from the supplied DeployCo template. Modern sans-serif, consistent node
geometry, generous whitespace, 6% safe margin. No paragraphs, gradients, shadows,
3D, isometric style, decorative artwork, or cartoon styling.
```

### State transition / promotion

```text
Professional technical state-transition visual, aspect ratio {width}:{height},
white background. Show a transition from {before state}, through {gate evidence} and
{traffic-weight operation}, to {after state}; include {audit record and immediate
rollback relationship}. Use {label strategy and labels or reserved label zones}.
DeployCo charcoal with template-sampled cyan, mint, and lavender; thin directional
connectors; 6% safe margin. No deployment cloud, gradients, shadows, 3D, or
decorative icons.
```

### Assurance loop

```text
Technical assurance loop for a professional DeployCo slide, aspect ratio
{width}:{height}. Inputs: {scheduled proof sources}; normalize into {evidence}; triage
by {policy}; route to {owner}; return a visible feedback arrow to {next decision}. Use
{label strategy and labels or reserved label zones}. White canvas, modern sans-serif,
thin connectors, consistent hierarchy, template-sampled charcoal/cyan/mint/lavender,
6% safe margin. No paragraphs, gradients, shadows, 3D, or cartoon styling.
```

## Asset handling

1. Allocate the slide region and record its aspect ratio before generation.
2. Generate at that ratio and at least the pixel dimensions needed for presentation
   scale. Inspect labels at 100%, not only in a thumbnail.
3. Never stretch. Fit proportionally, crop only non-essential whitespace, or add white
   padding to preserve the image.
4. Keep all meaningful content inside the safe margin and outside title/footer zones.
5. Version non-destructively (`-v2`, `-v3`). Preserve the known-good predecessor until
   the new deck passes visual QA.
6. Centralize asset paths in one mapping or manifest. Use stable logical names and
   repository/deck-relative paths; do not scatter absolute workstation paths.
7. Validate that every mapped file exists and has the intended dimensions before deck
   generation. Update the mapping and asset version in the same change.
8. Keep labels and narrative text native whenever the composition allows. If the
   raster must contain text, limit it to stable short labels and validate every glyph.
9. Check generated images for invented labels, distorted icons, clipped connectors,
   inconsistent color, and accidental confidential content.

If the approved source asset is unavailable, do not regenerate an approximation and
call it equivalent. Report the missing asset and the slides blocked by it.
