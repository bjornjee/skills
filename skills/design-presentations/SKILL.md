---
name: design-presentations
description: "Design, create, restructure, polish, and visually QA editable presentation decks in PowerPoint or Google Slides through a reusable production harness. Use when Codex must create or revise a deck, follow or change a user-selected presentation mode, style, art direction, or slide template, port a story into an existing master, replace weak visuals, preserve editability, or render and inspect slides. Supports user-defined modes plus bundled technical-sharing and DeployCo-template profiles."
---

# Design Presentations

Treat the user's presentation brief as creative authority and this skill as the
production harness. Do not impose a house style. Preserve the user's selected mode,
template, visual direction, and narrative intent while enforcing evidence,
editability, asset safety, and visual proof.

## Load only the needed guidance

- Always read [presentation-brief.md](references/presentation-brief.md) to create or
  update the mutable design contract.
- Always read [evidence-and-source-routing.md](references/evidence-and-source-routing.md)
  before searching for templates, content, or shipped assets.
- Read [style-and-template.md](references/style-and-template.md) before choosing or
  changing the visual direction, template, or layout system.
- Read [technical-sharing.md](references/technical-sharing.md) only when the selected
  mode is a technical talk, architecture story, engineering review, or adjacent flow.
- Read [release-confidence-example.md](references/release-confidence-example.md) only
  for release-confidence, CI/CD assurance, or closely related technical stories.
- Read [deployco-template.md](references/deployco-template.md) only when the user
  selects DeployCo branding or a DeployCo template.
- Read [visuals-and-assets.md](references/visuals-and-assets.md) before creating,
  replacing, cropping, or regenerating diagrams or raster assets.
- Read [production-and-qa.md](references/production-and-qa.md) before producing,
  importing, exporting, or visually approving a PPTX or Google Slides deck.

## Stable harness invariants

- Begin with purpose, audience, source provenance, and a mode-appropriate narrative or
  interaction structure before layout.
- Let the user own mode and style. A mode may be named, mixed, or fully custom; do
  not coerce it into a bundled profile.
- Treat a user-selected template or master as authoritative. Never invent missing
  brand rules or silently substitute another brand.
- Work on a copy. Version meaningful asset replacements non-destructively.
- Keep narrative text editable by default. Flatten content only when the user asks
  or the chosen delivery constraint requires it, and report the tradeoff.
- Fit images proportionally. Never stretch, crop away meaningful content, or hide
  required detail merely to make a slide look simpler.
- Bound work to the selected deck, cited sources, and explicit assets. Do not scan
  unrelated decks, repositories, user folders, or accumulated asset history.
- Treat generation and rendering as local batch work. Do not upload, publish,
  replace a shared deck, change sharing settings, or message reviewers without
  explicit authority.
- Treat rendered output and final editor inspection as visual proof. Source code,
  object coordinates, or a diff are not visual proof.
- Keep private URLs, credentials, confidential code, customer identifiers, and
  absolute workstation paths out of reusable skill resources and generated reports.

## Workflow

1. **Create or update the brief.** Resolve the presentation mode, audience, desired
   outcome, duration, story source, style direction, template authority, output
   format, editability, asset constraints, and publishing authority. When the user
   changes direction, preserve unchanged fields and identify which slides, shared
   layouts, or assets are invalidated.
2. **Inspect authoritative inputs.** Inventory the selected master/layouts, theme,
   aspect ratio, correct reference slides, editable versus raster elements, content
   sources, and current defects. Do not infer editability or brand authority from a
   screenshot.
3. **Architect the experience.** Derive the arc, sequence, slide roles, interaction,
   and evidence needs from the selected mode and audience. Preserve source provenance
   and distinguish factual claims from interpretation or invention.
4. **Set the design system.** Follow the user's template or visual direction. Define
   hierarchy, type scale, color roles, density, image treatment, diagram language,
   and deliberate exceptions before styling individual slides.
5. **Map the experience to layouts.** Choose the native or custom layout that best
   serves each slide's role, content, and intended interaction. Split, sequence, or
   layer dense material instead of deleting required detail for cosmetic simplicity.
6. **Build for the chosen editability.** Prefer native text, shapes, charts, and
   connectors for content likely to change. Use vector or raster assets only when
   they add meaningful value under the selected style.
7. **Handle assets safely.** Generate at the intended region's aspect ratio, preserve
   safe margins, centralize logical asset mappings, and retain known-good versions.
8. **Round-trip deliberately.** Preserve or deliberately map the selected master when
   moving between PPTX and Google Slides. Reapply or reset layouts only when the
   mapping is known, then inspect every affected slide.
9. **Render and inspect.** Resolve this loaded skill's directory and run
   `<skill-dir>/scripts/render_pptx.sh <deck.pptx> <empty-output-dir>` when the
   required tools are available. Inspect representative, dense, changed, and
   visual-heavy slides at presentation scale.
10. **Review in the final editor.** Verify the active theme/master, layout mapping,
    editability, bounds, readability, slideshow behavior, hidden content, and access
    settings in Google Slides or PowerPoint as applicable.
11. **Report.** Return the editable deck, the resolved brief, visual-QA evidence,
    preserved/replaced asset list, limitations, and any exact user action needed.

## Completion contract

Finish only when the deck follows the latest user-approved brief, required sources
support factual claims, the intended narrative or interaction is coherent, template
and asset provenance are known, intended editable content remains editable, visual QA
passes, and any unavailable final surface or required input is reported with a safe
resumable next action.
