# Native Blender operations

Read only the recipe needed. Commands and preview settings are adaptable examples,
not a pipeline or quality target; they were exercised with Blender 5.2.1. Check the
installed version's `--help` and API. No separate `bpy` package or add-on is needed.

## Render an existing scene

Blender processes arguments in order: load the file, select the scene if necessary,
apply overrides, then render. Put `-f` (still) or `-a` (animation) last. Use quoted
absolute paths. For retained stills or animation, create a new, run-unique output
directory and stop if it already exists; Blender can overwrite existing images.
Only previews use an explicitly replaceable path. Inspect compositor File Output
nodes too: `-o` does not redirect their separate output paths. Redirect those into
the new directory before rendering if they would overwrite retained output.

```sh
blender --background --disable-autoexec "/absolute/scene.blend" \
  -o "/absolute/output/still-####" -F PNG -x 1 -f 1
```

This produces `still-0001.png`; frame numbers are added even without `####`.
Native rendering does not save changes to the input `.blend`. Keep auto-execution
disabled for untrusted files. If a trusted scene needs scripted drivers, inspect
that dependency and establish authorization before enabling it; disabling scripts
can change the image. Explicit `--python` scripts still execute and must be trusted.

For a quick **Cycles** preview of an already configured scene:

```sh
blender --background --disable-autoexec "/absolute/scene.blend" \
  --python-exit-code 1 \
  --python-expr 'import bpy; s = bpy.context.scene; s.render.resolution_percentage = 40; s.cycles.samples = 16' \
  -o "/absolute/output/preview-####" -F PNG -x 1 -f 1
```

The sample override is specific to Cycles; use the installed engine's settings for
EEVEE. Preserve the engine unless changing it helps the task. Check reduced output
dimensions against the source resolution before starting. For final quality, rerun
from the saved scene without preview overrides, setting requested final options
after loading it. Verify device availability before selecting a GPU.

## Small edits and snapshots

Use the authorized connection's existing operations, or run a task's trusted edit
script with `--python-exit-code 1 --python "/absolute/edit_scene.py"` after the input
file. Prefer Blender's data API for object/material edits; operators can depend on
selection, mode, and UI context. An isolated background fixture may use
`--factory-startup`; never reset a live user session to initialize a test.

For a procedural assembly, expose a small component `apply()` using existing
geometry/material helpers; leave loading, saving, and rendering in the caller.
State the expected input checkpoint and owned objects; do not assume reapplication
is safe. Keep edits in versioned scripts; a console can bridge an authorized live review.

Within Blender, inspect the actual target before editing:

```python
import bpy

scene = bpy.context.scene
print(bpy.data.filepath, scene.name, bpy.data.is_dirty)
print(scene.camera.name if scene.camera else "NO CAMERA", scene.render.engine)
```

For a milestone, choose the next unused number in the project's snapshot folder.
Run this in a single writer context; refuse a collision. Blender's save-copy
operation preserves the current working-file identity and remaps relative paths:

```python
from pathlib import Path

import bpy

snapshot = Path("/absolute/project/snapshots/scene-003.blend")
if snapshot.exists():
    raise FileExistsError(snapshot)
snapshot.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(snapshot), copy=True, relative_remap=True)
```

Reopen the snapshot in a separate background process and verify required assets
resolve. Linked libraries, simulation caches, fonts, and textures may need separate
delivery; pack supported resources only when portability is needed. Retain the
originals. Save Blender edits through Blender instead of copying over an open file.

## Pixel-to-surface diagnosis

When surface ownership is unclear, inspect the original render at native dimensions.
Verify the sampled pixel contains the defect, using a crop or color bounds if useful;
never guess coordinates from a resized tool image.

Match the rendered state, camera/projection, dimensions, and crop, with explicit pixel
origin/axes. Derive frame bounds instead of assuming `Camera.view_frame` corner order.
Before trusting hits, round-trip points along sampled rays to native pixels with
subpixel agreement. Use `world_to_camera_view` for perspective/orthographic cameras;
other camera models need a matching projection. Correct a failed mapping and discard
its diagnoses before adding probes.

Inspect the identified object, adjoining geometry, and existing fit helpers before
changing materials. Through glass, the first hit may not explain the artifact; check
nearby layers and intersections. Sampled clearance is not exhaustive surface proof.
Verify the correction in the same defect-revealing views.

## Requested animation

Confirm scene/camera animation, frame range, FPS, and output size. Render a few
representative frames first (for example `-f 1,12,24`, chosen for the actual motion).
Then render the requested range to an image sequence in a fresh directory:

```sh
blender --background --disable-autoexec "/absolute/scene.blend" \
  -o "/absolute/output/frames/frame-####" -F PNG -x 1 -s 1 -e 24 -j 1 -a
```

An image sequence retains completed frames if rendering stops. Verify completeness
and dimensions, then encode the requested video using an already available encoder
or Blender's sequencer. Keep the sequence until the video is verified, including
FPS/duration and visual playback. A contact sheet checks framing, not temporal quality.

## Evidence and failures

Check the original process handle, logs, and nonempty outputs created/updated after
this run's start time. Confirm actual size, format, and frame count, then inspect pixels.
Apply the skill's failure gate: check scene/camera, missing resources, engine/device,
and destination before retrying. `--python-exit-code 1` exposes command-line Python
failures; it does not prove visual correctness.

Official references, read only for the operation needed:
- [Command-line rendering](https://docs.blender.org/manual/en/latest/advanced/command_line/render.html)
- [Command-line arguments](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)
- [Save operations](https://docs.blender.org/api/current/bpy.ops.wm.html#bpy.ops.wm.save_as_mainfile)
- [World-to-camera projection](https://docs.blender.org/api/main/bpy_extras.object_utils.html#bpy_extras.object_utils.world_to_camera_view)
