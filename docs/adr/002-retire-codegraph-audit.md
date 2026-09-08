# ADR 002: Retire codegraph-audit
Status: accepted by the repository owner for PR #89.
Context: the owner prefers agents to inspect repository code directly.
Decision: remove the codegraph-audit skill, its companion README, and catalog entry.
Review: core doctrine and strict reviewers retain scope, evidence, and blocking requirements.
Consumers: the packaged slash command is removed; use the normal coding-agent review workflow.
Scope: repository configuration only; no CLI uninstall or installed-global cleanup is performed.
Migration: apply the package removal during an explicitly authorized global rollout.
Versioning: retain the owner's single-release version policy for the remaining PR stack.
Rollback: revert the removal commit to restore the packaged skill and references.
