# Parallel component projects

Use when independent component work benefits from multiple agents. Keep tightly
coupled parts together: a lamp head's shade, rim, and bulb form one component.
Workers own component files; one integrator owns the assembly. Reuse the skill's
edit/preview loop and milestone checks without adding per-edit approval stages.

## Project setup and ownership

Adapt the existing project layout; a new project can start with:

```text
project/
  PROJECT.md                  # Interfaces, owners, session limit
  references/
  shared/                     # Agreed materials and reference geometry
  components/
    head/
      component.md            # Attachments, dimensions, editable parameters
      working.blend
      build.py                # Optional reusable procedural construction
      versions/head-v003.blend
    stand/
    base/
  assembly/
    working.blend
    changes.md
    versions/
  previews/                   # Replaceable, separated by component/session
```

- Before splitting work, agree on units, axes, root/pivot, named attachment points,
  size envelopes, clearances, references, and which owner may change each interface.
  Give workers the same rough assembly or reference geometry. Keep shared inputs
  read-only during a parallel batch; coordinate interface changes before dependent edits.
- Assign each worker exact component paths and an exported collection name. Keep
  each assembly's parts in a consistent local coordinate frame. Modify existing
  components incrementally; rebuild only the component whose structure changed.
- Follow the project's worktree rules for substantial source edits. Give each worker
  separate component files, output paths, and a Blender process. Route persistent
  connections to distinct endpoints and confirm the actual file/scene before edits.
  If the connector cannot isolate multiple instances, use bounded background jobs
  or fewer sessions; do not invent a new service just to fill the pool.
- The integrator alone changes assembly placement, linked component versions,
  cameras, and final lighting. Workers return integration problems to the relevant
  owner instead of reshaping another worker's component. Never let agents edit the
  same `.blend` or mutate one Blender session concurrently.

## Session pool and user overrides

The default maximum is **5 project Blender sessions in total**. This is a ceiling,
not a target: start sessions only for ready work. A session is one live Blender
process, whether interactive or background. Count the assembly session, worker
sessions, idle reusable sessions, and separate render processes. Count an existing
user session only when explicitly adopted for this project; leave unrelated sessions
alone. All agents and their subagents share this pool.

Record the selected limit in the existing project notes, for example in `PROJECT.md`:

```yaml
blender_session_limit: 5
```

This is an agent-managed project convention, not a built-in Blender/Codex setting
or an installed scheduler. The coordinating agent owns allocation and records the
selected limit, session owners, process/endpoint identities, current files, and
busy/idle state in existing task notes. No daemon or extra state system is required.

- Use the latest explicit user setting, otherwise the saved project setting,
  otherwise the default. Accept any positive integer; there is no skill-imposed
  upper cap. “Use 8 Blender sessions” updates the project setting and applies to
  pending work immediately, without requiring a new task or another confirmation.
- Reserve capacity before launching a process, including pending launches in the
  count, and recheck the reservation against the current limit immediately before
  launch. Workers request capacity from the coordinator; they do not each create
  their own pool. Reuse an idle owned session when appropriate, checking its actual
  file and unsaved state first. When full, queue work until a session is released.
- When assembly and component work overlap, allow one slot for the integrator;
  the default leaves up to four worker sessions. A separate background final render
  also needs a slot. At a limit of one, save and finish component work before reusing
  the slot for integration; do not require two concurrent sessions to make progress.
- On an increase, retain existing sessions and admit ready work within the new
  limit. On a decrease, cancel unstarted reservations that no longer fit and requeue
  their work. If current occupancy exceeds the new limit, stop new launches and
  drain down: finish current operations, save owned work, and retire surplus idle sessions.
  Do not discard unsaved work or terminate busy processes to force an immediate fit.
- Release a slot only after confirming its Blender process has exited; a timeout,
  lost connection, or finished agent does not prove that. Before replacing a failed
  session, resolve whether the old process is still alive so replacements cannot
  silently exceed the pool. Preserve its last good snapshot and failure evidence.
- Blender-session capacity and agent capacity are different. Honor runtime agent
  limits, available connectors, and host constraints; report requested versus
  effective concurrency when they differ. Raising this setting cannot raise the
  runtime's agent limit or authorize access to another user's session or host.
- Bound expensive rendering separately using measured memory and responsiveness.
  A larger session pool need not mean simultaneous full-quality GPU renders. Render
  jobs still count toward the session pool; reuse capacity or wait instead of
  launching extra processes outside it.

## Component handoff and integration

1. A worker saves a completed, numbered component snapshot and supplies its path,
   exported collection name, required assets, preview, interface changes, and remaining
   mismatches. It keeps iterating in its working file without overwriting that snapshot.
2. Bring accepted snapshots and dependencies into the integrator's checkout under
   stable project-relative paths. Link the named collection from the exact version
   and transform its local collection instance. Do not link to a mutable worker file
   or an absolute path inside another agent's temporary worktree. Pin or copy dependent
   materials, textures, and libraries too, so an accepted version remains reproducible.
3. Keep component geometry in its owning file. Linking retains a library reference;
   appending makes a local copy that no longer follows the source. Use library
   overrides only for needed assembly-level variations, not as a merge mechanism.
   Update selected component links without reloading over unsaved assembly work.
4. Inspect the changed component in context: attachments, adjoining surfaces,
   clearances, silhouette, and shading. Other workers may continue independent work
   while the integrator performs this serial check. Return mismatches with the actual
   image and affected interface to the owner.
5. Record the exact component versions and render evidence in the compact assembly
   change record, then save an assembly milestone. Roll back by restoring the prior
   component references or assembly snapshot, retaining their dependencies.

Keep scripts, parameters, and interface notes in Git. Preserve editable `.blend`
milestones; use Git LFS if file size and sharing justify it. One writer owns each
binary scene: Git does not combine independent geometry edits into a coherent model.
Compare components and their joins visually; a successful file handoff is not proof
of reference likeness.

Native behavior references:
- [Blender Link and Append](https://docs.blender.org/manual/en/5.2/files/linked_libraries/link_append.html)
- [Blender Python threading limitations](https://docs.blender.org/api/main/info_gotchas_threading.html)
