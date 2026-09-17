# ADR 004: Retire unused Claude skills
Status: accepted by the repository owner on 2026-09-17.
Context: the owner uses Codex, retains language skills and Linear, and approved pruning three skills.
Decision: remove hookify-rules, claude-api, and codex-delegate from the packaged skill catalog.
Consumers: these three slash commands are no longer available in new package installations.
Scope: remove their active routing, catalog entries, and Claude-only example tests; retain historical curation notes.
Authority: edit the linked worktree only; no credentials, services, installed globals, or other owners' files are changed.
Migration: review and merge, then explicitly sync from the chosen permanent checkout; the installer retires only unchanged owned files and refuses conflicts.
Versioning: bump all three plugin manifests to 3.0.0 for the removed public commands.
Rollback: revert the removal commit; separately restore or resync installed content if a global rollout occurred.
