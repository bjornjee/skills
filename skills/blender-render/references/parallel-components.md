# Parallel components

Use when independent component work benefits from multiple agents. Keep coupled
geometry together. Adapt the existing project layout; no new framework is needed.

## Ownership

- Give workers the same stable assembly/reference geometry and exact owned paths,
  objects or collections, output paths, and interfaces: units, axes, root/pivot,
  attachment points, size envelopes, and clearances. Keep shared inputs read-only
  during a batch; agree interface changes before dependent edits.
- Follow the project's worktree rules for source edits. Isolate component files and
  Blender processes/endpoints when needed; verify the actual file/scene before edits.
  If the connector cannot isolate instances, use bounded background jobs or fewer sessions.
- One integrator owns assembly placement, component versions, cameras, and final
  lighting. Workers return interface conflicts to that owner. The integrator can
  adjust reversible boundaries within the authorized brief; a worker's initial scope
  must not become a new user-approval gate. Never concurrently mutate one scene/session.

## Session pool

Use the limit and precedence in [Concurrency](../SKILL.md#concurrency). Accept any
positive user-selected integer; there is no skill-imposed upper cap. The coordinator
tracks the limit, owners, process/endpoint identities, files, and busy/idle state in
existing project notes. All agents and subagents share this pool; no daemon is needed.

- **Count processes, not agents.** Include assembly, worker, render, and idle reusable
  Blender processes plus pending launch reservations. Count an existing user session
  only when explicitly adopted; leave unrelated sessions alone.
- **Reserve before launch.** Recheck against the latest limit immediately before
  starting. Reuse an idle owned session after checking its file and unsaved state;
  queue when full. Leave capacity for integration when it overlaps worker activity.
  At a limit of one, save and finish one operation before reusing the slot for the next.
- **Resize without data loss.** An increase admits ready work immediately. A decrease
  cancels excess unstarted reservations and pauses launches until occupancy fits;
  finish busy operations, save work, and retire surplus idle sessions. Never discard
  unsaved work or kill busy processes merely to meet a lower limit.
- **Release only after exit.** Use the original process handle to confirm termination.
  Apply the skill's failure gate before replacing a lost or timed-out session.
- **Bound GPU work separately.** Respect runtime agent limits, connector isolation,
  memory, and responsiveness; report requested versus effective concurrency if they
  differ. Overlap independent CPU diagnosis with useful work and serialize heavy
  GPU renders when host measurements call for it. Every render process still needs
  a pool slot; changing the limit grants no access to another user's session or host.

## Handoff and integration

Preserve the project's composition method. A worker delivers an immutable component
version, required dependencies, preview, interface changes, and remaining mismatches:

- **Procedural assembly:** deliver a versioned `apply()` script with its expected input
  checkpoint and owned objects. The integrator applies accepted edits serially using
  existing helpers; see [small edits](native-operations.md#small-edits-and-snapshots).
  Do not split a working assembly into donor files solely for parallelism.
- **Linked components:** deliver a numbered `.blend` and exported collection name;
  continue editing a separate working file. Bring accepted versions and dependencies
  under stable project-relative paths, then link the exact collection version and
  transform its local instance. Never link a mutable worker file or temporary-worktree
  path. Appending makes a local copy; library overrides are for assembly variations,
  not merging. Update links without reloading over unsaved assembly work.

The integrator checks attachments, adjoining surfaces, clearances, silhouette, and
shading in context, returning mismatches with the actual image to the owner. Other
workers may continue independent work during this serial check. Record exact versions
and evidence in the compact change record and save an assembly milestone. Roll back
with prior component references or the assembly snapshot and their retained dependencies.
Keep scripts/interfaces in Git and `.blend` milestones editable; Git cannot merge
independent binary-scene edits into a coherent model.

Native behavior references:
- [Link and Append](https://docs.blender.org/manual/en/5.2/files/linked_libraries/link_append.html)
- [Python threading limitations](https://docs.blender.org/api/main/info_gotchas_threading.html)
