---
name: blender-render
description: Render and refine Blender scenes with camera framing, lighting, materials, fast previews, final stills or animation, and visual verification. Use for existing 3D models or user-requested scenes; refine geometry against references when requested.
---

# Blender Render

Keep the scene editable and make the next useful image quickly.

## Core principles

- **Stay within the brief.** Preserve unrelated work and intentional art direction.
  Refine existing geometry only when requested; build new scenes with editable forms.
  Reversible implementation choices within the authorized subject need no new approval.
- **Continue from working state.** Reuse the stable assembly, geometry/material helpers,
  cameras, and renderer. Prefer small component edits over rebuilding the subject.
  Preserve working lighting and textured materials.
  Keep reproducible edits in source scripts, not console history or new wrapper stacks.
- **Diagnose before adjusting.** Identify the visible surface and check intersections
  and existing fit helpers before tuning shaders. Validate a diagnostic before trusting it.
- **Keep work bounded.** Select the objects, views, and frames needed to answer the
  current question. Measure load, edit, render, and tool overhead before optimizing.
- **Claims follow images.** A successful render or valid mesh proves neither visual
  quality nor reference likeness. Report only what the actual output supports.

## Edit / preview loop

**Inspect → adjust → preview → look.**

1. Name the next visible change. Check the active camera/view layer, visibility,
   assets, and output paths; frame the subject using evaluated geometry and transforms.
2. Change the relevant component. Keep a few fixed, defect-revealing views for direct
   comparison. Match reference perspective before judging proportions.
3. Render the smallest legible preview to a replaceable path, separate from retained
   output. Keep temporary overrides out of the source unless deliberately adopted.
   Use the intended engine for appearance decisions; Workbench is only shape evidence.
4. Open the pixels. Check the changed area, adjoining surfaces, and composition for
   intersections, gaps, clipping, shading, and lost detail. Fix the largest visible
   mismatch; add another view only when needed to expose it.

No build/reopen/freeze pipeline or duplicate audit record for each parameter edit.
Read [native operations](references/native-operations.md) for CLI recipes, reusable
edits, pixel-to-surface diagnosis, snapshots, or animation as needed.

## Gates

- **Before editing:** identify Blender/version, source scene, deliverable, references,
  and dependencies. Background jobs see saved state only. Adopt an open session only
  with explicit authorization; query its actual file/scene/unsaved state first,
  preserve unrelated UI state, and never reload over unsaved work. Prefer an existing
  connection; if unavailable, use an authorized UI path or saved copy and explain its
  limits. Report missing Blender; do not silently install it or build a server/add-on.
- **Before a risky geometry edit; at milestones:** save a new numbered `.blend` without
  overwriting checkpoints. Reopen milestone snapshots to verify asset paths. Retain
  the exact script revision used for evidence, including bytes matching recorded hashes;
  later changes use a new revision or separate renderer.
- **At component/integration decisions:** inspect affected joins and record the snapshot,
  changes, evidence, checks, and remaining mismatches in one compact existing record.
  When useful, have a fresh reviewer inspect the brief, references, and images without
  your conclusion or implementation history. Independent review is optional, not a
  per-edit gate. A component milestone can be accepted while overall likeness is incomplete.
- **Before final rendering and delivery:** inspect a preview first; for animation,
  inspect representative frames/motion before the full range. Restore intended output
  settings and inspect the actual final still or sequence/video. Report editable source,
  output paths, verified results, and limitations, separating technical validity from likeness.
- **On failure:** retain the last good scene and logs. Confirm process liveness before
  retrying, releasing capacity, or replacing a session; a timeout, missing receipt, or
  finished agent does not prove exit. Retry after a relevant correction and never
  replace retained deliverables with incomplete or stale output.

## Concurrency

Parallelize independent components and diagnosis; serialize shared-state edits and
assembly integration. One writer owns each `.blend` and Blender session.

Use one project-wide pool: **5 Blender sessions by default**, overridden by the saved
project setting or latest explicit user setting, in that order. This is a ceiling,
not a target. Agent capacity and GPU throughput are separate constraints; choose
render concurrency from observed host capacity, not the pool size.

Read [parallel components](references/parallel-components.md) before dispatching:
it defines ownership, allocation, resizing, and integration. Reuse ready workers and
sessions; propagate the user's latest scope, concurrency, and pause/resume instructions.
