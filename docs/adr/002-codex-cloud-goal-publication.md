# ADR 002: Codex Cloud goal publication

## Context
Cloud implementation crosses repository, worker-container, orchestrator-state, and GitHub publication boundaries; its terminal contract is externally consumed.

## Decision
Expose distinct local and Cloud make targets backed by one profile-aware installer. Cloud uses a positive artifact allowlist and a separate ownership manifest. `codex-cloud-goal` validates task, state, and transitions; the worker prepares a verified diff and PR metadata, while the orchestrator invokes the configured Codex–GitHub publisher and records the PR URL.

## Consequences
Cloud cannot complete on a verified diff alone or fall back to worker-side `gh`, credentials, push, or merge. Setup remains bounded by finite manifests, and local installation retains its complete payload and safety hook.

## Rollback
Revert the change and reset the Cloud environment cache to remove the Cloud-only installation; local users continue through the compatibility alias or the explicit local targets. Repository peers outside the profile manifests remain untouched.
