# PowerPoint, Google Slides, and visual QA

## Contents

- [Input and output contract](#input-and-output-contract)
- [Build in Google Slides](#build-in-google-slides)
- [Build or round-trip through PPTX](#build-or-round-trip-through-pptx)
- [Deterministic local render](#deterministic-local-render)
- [Visual QA gates](#visual-qa-gates)
- [Final editor review](#final-editor-review)
- [Actionable failure report](#actionable-failure-report)

## Input and output contract

Resolve the latest presentation brief, authoritative content and style sources,
approved assets, destination, and mutation authority before production. Create
outputs alongside or downstream from the selected input; never overwrite the
known-good deck. Keep temporary renders separate from deliverables.

## Build in Google Slides

1. Start from a copy of the selected template when the brief is template-led. For
   reference-led or art-directed work, establish the approved design system before
   producing the full deck.
2. Confirm Theme builder/master, layouts, page size, fonts, color roles, and correct
   representative slides.
3. Use editable placeholders/text boxes, shapes, charts, and tables for narrative and
   likely review changes.
4. When importing slides, deliberately choose whether to retain source formatting or
   map to the destination theme. Do not accept the import default without inspection.
5. Reapply a layout or use Reset only when the mapping is known. Inspect moved
   objects, changed fonts/colors, clipped text, and lost footers immediately.
6. Fit diagrams and images proportionally. Crop or pad; never distort independent
   dimensions to fill a region.

## Build or round-trip through PPTX

- Prefer modifying a copy of a template-bearing PPTX when the brief requires its
  master and layouts.
- Keep narrative text, values, and annotations as native text elements unless the
  brief explicitly chooses otherwise.
- Use native shapes/connectors/charts where they meet the design. Embed approved,
  proportionally fitted assets for the rest.
- After export, reopen the PPTX and inspect masters, layout names, fonts, image crop,
  line breaks, animations, and page size. Export success is not fidelity proof.
- After importing a PPTX into Google Slides, repeat the live review; the editors may
  map themes, fonts, crop, charts, and animation differently.

## Deterministic local render

When `soffice`, `pdfinfo`, and `pdftoppm` are available, resolve `<skill-dir>` from the
loaded skill location and run:

```bash
<skill-dir>/scripts/render_pptx.sh \
  path/to/deck.pptx path/to/empty-qa-directory
```

The helper creates an isolated LibreOffice profile, converts the selected deck to
PDF, verifies a nonzero page count, and renders numbered PNGs. It refuses a nonempty
output directory so prior proof is not overwritten.

If the tools are missing, use an equivalent renderer and document the command. Do not
skip visual QA because the preferred renderer is unavailable.

## Visual QA gates

Inspect at minimum:

- cover and closing slides;
- one representative slide from each layout family;
- the densest text/data/code slide;
- every visual-heavy slide;
- every changed slide;
- slides consuming a changed master, layout, theme role, or shared asset.

Check for:

- the brief's aspect ratio and no distortion;
- coherent title/body hierarchy and deliberate exceptions;
- elements within bounds and safe margins;
- readable text, labels, charts, and line weights at slideshow scale;
- no overlap, clipping, fallback fonts, missing glyphs, or accidental tiny text;
- correct crop/padding and sufficient raster resolution;
- contrast, color roles, imagery, and composition matching the selected direction;
- technical or factual visuals that accurately express their claimed relationship;
- preserved required detail and no unsupported claims.

Treat a failed gate as a production defect. Correct it, rerender, and inspect the same
slide plus all slides sharing the affected source.

## Final editor review

In the user's final editor, verify:

1. active theme/master and layout mapping match the brief;
2. intended content can be selected and edited;
3. images and diagrams are sharp, proportional, and correctly layered;
4. typography, hierarchy, and labels remain readable in slideshow mode;
5. animations, transitions, video, and speaker notes behave as intended;
6. hidden slides and notes contain no stale confidential material;
7. shared URL, permissions, and mutation behavior match explicit authority.

If PowerPoint is the final editor, review there. If Google Slides is the final editor,
review there. When both are deliverables, verify both independently rather than
assuming round-trip fidelity.

## Actionable failure report

Report:

- missing, invalid, or contradictory input;
- affected slides or deliverables;
- checks already completed;
- exact template, asset, font, permission, tool, evidence, or user decision needed;
- safest resumable next action.

A missing required template blocks template-faithful production, not story analysis.
Provide a provisional unstyled storyboard only when evidence supports it, label it
clearly, and do not invent brand rules. A missing optional reference should not block
work when the brief delegates the remaining direction.
