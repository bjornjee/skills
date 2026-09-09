# Native Blender operations

Use these when background rendering or scripting saves work. They are examples to
adapt to the selected scene, not a required pipeline. Check the installed Blender's
`--help` and API for version-specific settings; these commands were exercised with
Blender 5.2.1. No separate `bpy` package, service, or add-on is needed.

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

Record the render start time; check process completion, logs, and nonempty outputs
created or updated by this run, then open the rendered pixels. Do not accept a stale
preview left behind by a failed render. Confirm final size/format/frame count
independently of requested settings.
When rendering fails, keep logs and check the named scene/camera, missing resources,
engine/device support, and destination. `--python-exit-code 1` makes command-line
Python failures visible as process failures; it is not proof of visual correctness.

Official references, read only for the operation needed:
- [Command-line rendering](https://docs.blender.org/manual/en/latest/advanced/command_line/render.html)
- [Command-line arguments](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)
- [Save operations](https://docs.blender.org/api/current/bpy.ops.wm.html#bpy.ops.wm.save_as_mainfile)
