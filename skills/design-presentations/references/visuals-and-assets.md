# Visuals and asset handling

## Choose the medium from the brief

Prefer native editable text, shapes, charts, tables, and connectors when they can meet
the selected design. Use vector assets for scalable custom graphics. Use raster image
generation when it materially improves a photograph, illustration, texture, complex
visual metaphor, or coherent technical visual under the chosen art direction.

Do not use image generation to avoid inspecting a template, to fill empty space, or
to flatten content that reviewers are likely to edit.

For every meaningful visual, state:

- the slide conclusion it supports;
- the relationship, emotion, proof, or comparison it must make clear;
- its intended region and aspect ratio;
- its label/editability strategy;
- its source, license/provenance, and regeneration path.

## Label strategy

Choose before generating a raster asset:

- **Editable overlay (preferred):** reserve deliberate whitespace in the raster and
  add labels as native theme text in the deck.
- **Self-contained raster:** embed only stable short labels when the asset must travel
  independently; validate every label and regenerate on any text defect.

Keep paragraphs and review-sensitive values outside raster assets.

## Prompt scaffold

Fill every brace with presentation-specific, non-confidential information. Use the
style system selected in the brief; do not silently inject DeployCo or another house
style.

```text
{visual type} for a professional presentation, aspect ratio {width}:{height},
composition: {subjects, ordered elements, spatial relationships, and focal point}.
The visual must communicate {slide conclusion or relationship}. Apply {user-selected
style, palette roles, typography treatment, line/shape language, and image register}.
Use {label strategy and labels or reserved label zones}. Preserve {safe-margin
percentage} safe margins and presentation-scale readability. Exclude {brief-specific
exclusions}. No confidential identifiers or invented factual claims.
```

For technical diagrams, specify exact topology, arrow direction, ownership/state
boundaries, failure or rollback path, and intended label list. For editorial or
illustrative art, specify subject, composition, lighting, texture, mood, and how the
asset interacts with slide text.

## Asset handling

1. Allocate the slide region and record its aspect ratio before generation.
2. Generate/export at that ratio and at least the pixel dimensions needed at
   presentation scale.
3. Never stretch. Fit proportionally, crop only non-essential content, or add padding
   that matches the selected design.
4. Keep meaningful content inside safe margins and outside title/footer zones.
5. Version meaningful replacements non-destructively (`-v2`, `-v3`) until the new
   deck passes visual QA.
6. Centralize paths in one mapping or manifest. Use stable logical names and
   repository/deck-relative paths, not absolute workstation paths.
7. Validate that mapped files exist and have intended dimensions before generation.
   Update source, mapping, and selected version together.
8. Preserve source/vector files or deterministic prompts/settings needed to revise
   flattened assets.
9. Check raster/vector outputs for malformed text, distorted icons, clipping,
   inconsistent style, false detail, license issues, and confidential content.

If an approved source asset is unavailable, do not regenerate an approximation and
call it equivalent. Report the missing asset and the slides it blocks. If the user
explicitly requests a reinterpretation, version and label it as a new asset.

## Visual QA for changed assets

Inspect the asset alone at 100%, then inside the rendered slide at slideshow scale.
Verify crop, padding, resolution, contrast, label correctness, focal point, and fit
with adjacent native elements. Reinspect every slide that shares the asset or mapping.
