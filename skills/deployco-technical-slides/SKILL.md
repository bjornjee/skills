---
name: deployco-technical-slides
description: "Create and polish professional, editable DeployCo technical presentation decks in PowerPoint or Google Slides. Use for requests such as ‘Create a DeployCo technical presentation,’ ‘Port this architecture story into the DeployCo slide template,’ ‘Polish these slides to match DeployCo branding,’ ‘Replace weak flow diagrams with professional technical architecture visuals,’ or ‘Make this PPTX/Google Slides deck editable and visually QA it.’"
---

# DeployCo Technical Slides

Create short, evidence-led technical decks for mixed infrastructure and backend
audiences. Preserve the real DeployCo slide master, editable narrative, and proven
assets while making decisions, tradeoffs, implementation complexity, impact, and
team-value multiplication visible.

## Load the guidance

- Always read [brand-and-layout.md](references/brand-and-layout.md) before touching
  a deck. Treat it as the preservation contract.
- Read [story-and-evidence.md](references/story-and-evidence.md) before creating or
  materially restructuring the narrative.
- Read [technical-visuals.md](references/technical-visuals.md) before creating,
  replacing, cropping, or regenerating diagrams or raster assets.
- Always read [production-and-qa.md](references/production-and-qa.md) for the
  Google Slides/PPTX workflow and final visual gates.

## Bound the work

- Operate only on the selected deck, its cited evidence, and explicitly supplied
  brand assets. Scale work with the selected slide and asset count, not accumulated
  folders, repositories, or slide history.
- Treat local deck generation and rendering as batch work. Do not upload, publish,
  replace a shared deck, or alter sharing settings without explicit authority.
- Require the actual DeployCo Slide Template Master or a deck proven to contain it.
  Stop with an actionable missing-input report when the master, theme, required
  logos, or brand assets are unavailable.
  When useful, still provide a clearly provisional, brand-neutral story/evidence
  plan; do not lay out, style, or publish a deck until the approved master arrives.
- Work on a copy. Never overwrite a proven deck or diagram blindly.

## Workflow

1. **Resolve inputs.** Identify the source story/evidence, real DeployCo template,
   output format, target talk length, audience, and existing assets. Record which
   file or shared deck is the master source of truth.
2. **Inspect before changing.** Inventory slide masters, layouts, theme fonts and
   colors, aspect ratio, title sizes, editable versus raster elements, and any
   clipping or distortion. Do not infer branding from screenshots.
3. **Architect the story.** Build a claim-and-evidence spine before laying out
   slides. Make ownership boundaries, failure modes, tradeoffs, operational proof,
   reversible decisions, and measurable impact explicit.
4. **Map claims to native layouts.** Reuse the template’s light backgrounds and
   layouts. Keep content-slide titles consistent; use deliberate cover and closing
   exceptions only. Split or layer dense material instead of deleting technical
   detail merely to simplify a slide.
5. **Build for editability.** Keep titles, subtitles, labels, explanatory text, and
   simple shapes/connectors native. Prefer editable vector construction when it can
   express the architecture cleanly. Use raster generation only when it adds real
   technical visualization value.
6. **Handle diagrams safely.** Apply the visual system and asset rules in
   `technical-visuals.md`. Generate at the intended aspect ratio, never stretch,
   preserve safe margins, and version improved assets non-destructively.
7. **Round-trip deliberately.** Import/export with the intended DeployCo master,
   then reapply or reset layouts only where the correct template mapping is known.
   Verify that every narrative element remains editable.
8. **Render and inspect.** Use
   `scripts/render_pptx.sh <deck.pptx> <empty-output-dir>` when LibreOffice,
   `pdfinfo`, and `pdftoppm` are available. Inspect representative, dense, and every
   diagram-heavy slide at presentation scale. The source or diff is not visual proof.
9. **Review in Google Slides.** Confirm theme/master, layout mapping, bounds,
   aspect ratios, readability, and slideshow behavior in the final shared surface.
10. **Report.** Return the editable deck, rendered QA artifacts or inspection
    evidence, preserved/replaced asset list, remaining limitations, and any missing
    input that prevented a required gate.

## Completion contract

Finish only when:

- the actual DeployCo master remains the source of truth;
- narrative text is editable and diagrams are not distorted;
- titles, bounds, aspect ratios, hierarchy, and readability pass visual inspection;
- technical claims remain supported by evidence and expose the important tradeoffs;
- no secrets, credentials, confidential code, or presentation-specific internal
  identifiers were copied into reusable resources; and
- the final Google Slides review is complete, or the report clearly states why that
  surface could not be accessed and what the user must verify.
