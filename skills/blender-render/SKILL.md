---
name: blender-render
description: Render and refine Blender scenes with camera framing, lighting, materials, fast previews, final stills or animation, and visual verification. Use for existing 3D models or user-requested scenes; refine geometry against references when requested.
---

# Blender Render

Keep the editable scene and make the next useful image quickly. Use a small loop:
inspect → adjust → preview → look. Save and review meaningful milestones separately.

## Choose the working surface

- Identify the source scene, requested deliverable, references, and output directory.
  Inspect the existing camera, render engine, materials, dependencies, and scene scale
  before changing them. Preserve intentional art direction and unrelated user work.
- Discover Blender and its version (`command -v blender`, then `blender --version`).
  Check available tools for an existing Blender connection. If Blender is missing,
  report the dependency; do not silently install it or substitute a 2D generator.
- **Background:** use the saved `.blend` and native CLI for standalone renders or
  isolated edits. It cannot see unsaved changes in an open Blender session.
- **Open session:** use only when explicitly authorized. Prefer an available
  persistent connection; first confirm its file, scene, and unsaved state with a
  read-only query. Keep it alive across edits. Use documented operations, preserve
  unrelated selection/mode/settings, and do not reload the file over unsaved work.
  If no connection exists, use an available authorized UI path or a saved copy;
  explain any unsaved-state limitation. Do not build a server or add-on by default.
- Use [native operations](references/native-operations.md) for CLI ordering,
  preview overrides, safe snapshots, and animation. Reuse existing scene scripts;
  native Blender operations usually suffice without a render wrapper.
- For concurrent component work, read [parallel components](references/parallel-components.md)
  before dispatching workers. Use one project-wide pool of at most **5 Blender
  sessions by default**, including the integrator and background jobs. The user's
  latest concurrency setting overrides this default and may change during work;
  apply the reference's allocation and resizing rules within available runtime limits.

## Establish the image

1. For an existing model, preserve geometry unless refinement is requested. For a
   new scene, build the simplest editable forms that meet the brief. Keep staging
   objects identifiable and avoid destructive application of modifiers.
2. Frame the intended subject, not every object in the file. Account for evaluated
   geometry, instances, transforms, aspect ratio, camera clipping, and breathing
   room. Keep purposeful framing; add diagnostic views only when they answer a
   specific question. Match reference perspective before judging proportions.
3. Reuse working lights and materials. When staging is needed, start with a broad
   key, enough fill to read form, and separation from the background. Match lighting
   scale to the scene and check ground contact, reflections, roughness, and exposure.
   Do not replace textured materials just to obtain a clean preview.
4. Check render visibility, active camera/view layer, missing textures or linked
   assets, and compositor outputs. Use the intended render engine for appearance
   decisions. Workbench can diagnose shape but cannot prove material/lighting quality.

## Short edit / preview loop

- State the next visible change or question, change the relevant objects/settings,
  and render the smallest useful preview. A reduced resolution and sample count
  are starting points, not a fixed quality or time requirement.
- Reuse the working scene, camera rig, and render setup. Keep one replaceable
  preview path separate from retained outputs; do not create build/install/verify/
  freeze stages for every small edit. Temporary render overrides stay out of the
  source file unless deliberately adopted.
- Open the actual preview before launching a final-quality render or full animation
  range. Inspect the changed area and adjoining surfaces for gaps, intersections,
  shading discontinuities, clipping, and lost detail, then check the overall
  composition. Choose view count to expose the changed geometry; a hidden surface
  needs another angle, not another checklist.
- When references are part of the task, compare silhouette, proportions, landmarks,
  surface transitions, and material cues at comparable angles. Resolve the largest
  visible mismatch first. Valid topology or a successful render does not prove likeness.
- Bound each run to the selected scene, objects, views, and frames. Rendering blocks
  its Blender process; avoid overlapping edits/renders in the same live session.
  If iteration is slow, measure scene load, edit, render, and tool overhead separately
  before changing the workflow. Reuse deterministic helpers only when repetition
  justifies them; keep them small, shared, and verified in real Blender.

## Milestones and delivery

- Before a risky geometry edit and at meaningful milestones, save a new numbered
  `.blend` snapshot without overwriting an existing checkpoint. Keep the working
  file editable. Preserve or remap external asset paths and verify dependencies
  after reopening; copying the `.blend` alone may not make a portable deliverable.
- Append a compact change record: snapshot path, changed objects/settings, compared
  references, rendered evidence, technical checks, visual result, and remaining
  mismatches. Reuse the project's record; one short entry per milestone is enough.
- At a milestone, expand inspection to affected interfaces and the views needed to
  support the claim. When independent evaluation would help, give a fresh reviewer
  the brief, references, and actual output images without implementation history or
  your conclusion. An audit agent is optional, not a per-edit gate.
- For a final still, restore the intended dimensions, engine, samples, color
  management, and file format, then inspect the actual final image. For animation,
  verify representative frames and motion before the full requested range; inspect
  the resulting sequence/video for missing frames, flicker, intersections, and timing.
- Report editable source and output paths, what was visually verified, and remaining
  limitations. Separate **technical validity** from **reference likeness**. Do not
  claim success from exit status, mesh statistics, or a preview of a different state.
  On failure, retain the last good scene and logs, diagnose the failing operation,
  and retry only after a relevant change; do not replace prior deliverables with
  incomplete output.
