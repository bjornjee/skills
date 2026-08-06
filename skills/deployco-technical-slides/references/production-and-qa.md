# Google Slides, PPTX, and visual QA

## Contents

- [Input and output contract](#input-and-output-contract)
- [Build in Google Slides](#build-in-google-slides)
- [Build or round-trip through PPTX](#build-or-round-trip-through-pptx)
- [Deterministic local render](#deterministic-local-render)
- [Visual QA gates](#visual-qa-gates)
- [Final Google Slides review](#final-google-slides-review)
- [Actionable failure report](#actionable-failure-report)

## Input and output contract

Resolve these before production:

- approved DeployCo template/master source;
- source deck or story evidence;
- target audience, duration, and output formats;
- approved brand and diagram assets;
- destination path or shared Google Slides deck;
- whether external mutation, upload, or replacement is authorized.

Create outputs alongside or downstream from the selected input, never by overwriting
the known-good deck. Keep temporary renders separate from deliverable files.

## Build in Google Slides

1. Start from a copy of the actual DeployCo template or approved deck. Do not start
   from a blank presentation and paint a similar background.
2. Inspect Theme builder/master and the available cover, content, section, and closing
   layouts. Confirm aspect ratio before placing content.
3. Add slides with the closest native layout. Use editable placeholders/text boxes and
   native shapes for narrative content.
4. When importing slides, retain or deliberately map to the intended DeployCo theme.
   After import, reapply the correct DeployCo layout and use Reset only when the
   mapping is known to preserve the intended content.
5. Review each reset/reapplied slide for moved objects, changed fonts, substituted
   colors, clipped text, and lost footers. Undo and rebuild on the correct layout when
   a reset damages the slide.
6. Keep diagram placement proportional. Crop or pad with white; never drag independent
   width/height handles until an image fits.

## Build or round-trip through PPTX

- Prefer modifying a copy of the template-bearing PPTX so its master and layouts remain
  available.
- If generating PPTX, use the template/master rather than defining a generic custom
  theme. Keep all narrative text, values, and annotations as text elements.
- Use native shapes/connectors for simple diagrams and cards. Embed only approved,
  proportionally fitted raster assets.
- After export from Google Slides, reopen the PPTX and check masters, layout names,
  fonts, image crop, line breaks, and page size. Export success is not fidelity proof.
- After import into Google Slides, review the live deck again; PowerPoint and Google
  Slides may map layouts, fonts, and image crop differently.

## Deterministic local render

When `soffice`, `pdfinfo`, and `pdftoppm` are available, run:

```bash
<skill-dir>/scripts/render_pptx.sh \
  path/to/deck.pptx path/to/empty-qa-directory
```

Resolve `<skill-dir>` from the loaded skill location, not from the current project or
the canonical skills-repository checkout.

The script creates an isolated LibreOffice profile, converts the selected deck to PDF,
verifies a nonzero page count, and renders numbered PNGs. It refuses a nonempty output
directory so previous proof is not silently overwritten.

If the tools are missing, use an equivalent local renderer and document the command.
Do not skip visual QA merely because the preferred renderer is unavailable.

## Visual QA gates

Inspect at minimum:

- cover and closing slides;
- one representative content slide;
- the densest text/code/contract slide;
- every diagram-heavy slide;
- any slide whose layout was reapplied/reset or whose asset changed.

Check each selected slide for:

- correct 16:9 or template-defined aspect ratio, with no stretch;
- title size, position, wrapping, and content-slide consistency;
- text, images, and connectors within bounds and safe margins;
- readable labels and line weights at slideshow scale;
- no overlap, clipping, fallback fonts, missing glyphs, or accidental tiny text;
- correct crop/padding and no raster distortion;
- sufficient contrast and color roles matching the active DeployCo theme;
- coherent flow, short exact diagram labels, and visible failure/rollback paths;
- preserved technical detail and no unsupported claims.

Treat any failed gate as a production defect. Correct it, rerender, and inspect the
same slide plus any slide sharing the changed layout or asset.

## Final Google Slides review

Open the final editable deck in Google Slides and verify:

1. the approved DeployCo theme/master is active;
2. cover, content, and closing layouts map as intended;
3. narrative text can be selected and edited;
4. diagrams are sharp, proportional, and inside bounds;
5. titles are consistent and all labels are readable in slideshow mode;
6. animations/transitions, if retained, do not hide technical content;
7. speaker notes and hidden slides contain no stale confidential material;
8. the shared URL, access settings, and mutation behavior match explicit authority.

## Actionable failure report

When completion is blocked, report:

- missing or invalid input;
- affected slide numbers or deliverable;
- checks completed successfully;
- exact artifact, permission, font, tool, or template needed;
- safest resumable next action.

A missing master blocks deck production, not analysis. When the source evidence is
sufficient, provide a provisional claim/evidence storyboard that can be mapped to the
approved master later. Label it unbranded and do not synthesize layouts, colors, or
backgrounds.

Do not compensate for a missing master with invented branding, for a missing diagram
with a distorted predecessor, or for failed rendering with source-only confidence.
