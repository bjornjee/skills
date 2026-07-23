# ADR 001: Global Linear issue creation skill

## Context
Linear task authoring is consumed by Symphony workflows across repositories, so a repository-local skill would drift and require duplicate installation.

## Decision
Keep `create-linear-issue` in this repository's canonical `skills/` tree and expose it through the existing shared plugin and native Codex sync. Require an explicit project-to-repository workflow mapping, repository-owned verification commands, one create attempt, and exact readback before optional dispatch.

## Consequences
All repositories receive one task contract and mutation workflow. Each Symphony workflow still owns cloning and repository-specific validation. The skill never changes working directories, creates Linear destination objects, or invokes host-global validation scripts.

## Rollback
Remove the skill and its catalog entry, then bump and resync the plugin; existing Linear issues remain valid task contracts.
