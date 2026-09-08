# bjornjee-skills

Personal skills, agents, and rules for Claude Code and Codex.

The packaged skills plugin is pure configuration — **rules, skills, and agents only**. The global Codex setup is self-contained in this repository; `scripts/` contains the sync tooling and repository-maintenance tests.

## Related plugins

Dashboard lifecycle hooks and generic dashboard workflows remain available from the separate [bjornjee/agent-dashboard](https://github.com/bjornjee/agent-dashboard) plugin, but they are not required or installed by this repository. This repository ships its own proportional-proof `tdd-guide` and destructive-command safety hook.

## Installation

1. Add the marketplace:

```
/plugin marketplace add bjornjee/skills
```

2. Install the plugin:

```
/plugin install skills@bjornjee-skills
```

## Structure

```
skills/                Canonical workflow and specialty skills (slash commands)
agents/                Specialized subagents
.claude/rules/         Rules and guidelines (symlinked into ~/.claude/rules/)
.claude-plugin/        Claude plugin manifest + marketplace
.codex-plugin/        Codex manifest; repository root is the package root
.agents/plugins/       Codex marketplace pointer (marketplace.json)
scripts/               Install, drift-check, and verification scripts
```

Both plugins package the actual root `skills/` directory. No escaping symlink or generated mirror is needed.

## Skills

| Skill | Description |
|-------|-------------|
| `/agent-harness-construction` | Design and optimize AI agent action spaces, tool definitions, and observation formatting |
| `/agent-introspection-debugging` | Structured self-debugging workflow for AI agent failures |
| `/agentic-engineering` | Eval-first execution, decomposition, model routing, and inter-agent trust boundaries |
| `/ai-ml-patterns` | Eval-first AI/ML engineering — RAG, finetune-vs-RAG-vs-prompt, injection defense (lockstep copy of the `ai-ml.md` rule) |
| `/api-design` | Resource modeling, pagination, error envelopes, versioning, idempotency |
| `/claude-api` | Claude API judgment — model selection, tool-loop failure modes, caching, cost |
| `/codex-delegate` | Plan → Delegate → Review → Rectify handoff to Codex CLI |
| `/context-management` | When to compact + auditing what consumes the context window |
| `/create-linear-issue` | Create and verify one Linear implementation issue from a repository-bound task contract |
| `/data-modeling` | Constraint-first schemas, query-shape indexing, expand/contract migrations, tenancy |
| `/design-presentations` | Design editable decks with user-directed modes, styles, templates, and visual QA |
| `/distributed-systems` | Idempotent consumers, retry discipline, outbox, poison messages, backpressure |
| `/fastapi-patterns` | FastAPI service-layer conventions (lockstep copy of the `fastapi.md` rule) |
| `/git-workflow` | Branching strategy decisions, bisect protocol, multi-worktree discipline, CODEOWNERS |
| `/github-ops` | GitHub operations via `gh` — triage, CI debugging, releases, reusable workflows |
| `/golang-patterns` | Go concurrency, context discipline, module boundaries, reliability |
| `/golang-testing` | Go integration/race/parallel testing beyond the basics |
| `/hookify-rules` | Create hookify rules and configure hook syntax (ECC plugin format) |
| `/incident-response` | Mitigate-first incident handling, severity ladder, blameless postmortems |
| `/mcp-server-patterns` | MCP servers — tool-description engineering, error contracts, sandboxing |
| `/observability` | Structured-log contracts, RED metrics, trace propagation, SLO-first alerting |
| `/ponytail` | Forces the laziest solution that actually works (YAGNI, stdlib-first) |
| `/python-patterns` | Python style, typing, concurrency, and tooling conventions (lockstep copy of the `python.md` rule) |
| `/react-native-patterns` | React Native engineering + worktree isolation (lockstep copy of the `react-native.md` rule) |
| `/regex-vs-llm-structured-text` | Decision framework for choosing between regex and LLM for parsing |
| `/search-first` | Research-before-coding workflow with supply-chain checks |
| `/security-design` | Design-time security — threat modeling, secrets, authn/z placement |
| `/terminal-ops` | Evidence-first repo execution with destructive-command guardrails |
| `/typescript-patterns` | TypeScript/Node conventions (lockstep copy of the `typescript.md` rule) |
| `/uiux-design-loop` | Two-loop UI/UX discipline with a cold-context grader (requires `impeccable`) |

## Agents

| Agent | Description |
|-------|-------------|
| `go-reviewer-strict` | Strict Go code reviewer enforcing evidence-based principles from CLAUDE.md/AGENTS.md |
| `performance-optimizer` | Profile-first optimization for Go/Python/Node with CI regression budgets |
| `python-reviewer-strict` | Strict Python code reviewer enforcing evidence-based principles |
| `refactor-cleaner` | Dead-code cleanup with semantic-equivalence proof (stack-aware: Go/Python/JS) |
| `tdd-guide` | Proportional-proof guide (Surgical/Targeted/Full profiles, RED → GREEN → REFACTOR) |
| `typescript-reviewer-strict` | Strict TypeScript/Node reviewer mirroring the Go/Python contract |
| `uiux-grader` | Cold-context UI/UX grader — internal to `/uiux-design-loop`, never invoked standalone |

## Rules

| File | Scope | Description |
|------|-------|-------------|
| `core.md` | All | Doctrine: workflow gates, decision discipline, architecture judgment, dispatch |
| `python.md` | `**/*.py` | PEP 8, Pydantic v2, concurrency model, tooling |
| `golang.md` | `**/*.go` | Idiomatic Go, shutdown sequencing, slog |
| `fastapi.md` | `**/*.py` | Service layer, DI, background work, pagination, authz placement |
| `typescript.md` | `**/*.ts{,x}` | Strict compiler, parse-don't-cast, promise hygiene, ESM |
| `react-native.md` | `**/*.ts{,x}` | RN engineering, Expo, worktree isolation |
| `ai-ml.md` | `**/evals/**`, `**/prompts/**` | Evals, RAG, injection defense, routing |
| `shell.md` | `**/*.sh` | Bash safety non-negotiables |

Use `make sync-rules ARGS=--check` for a read-only drift check. After review/merge, explicitly run `make sync-rules` from the chosen permanent checkout to install links; installation from linked worktrees is refused. Existing files are backed up. Links track later changes in that permanent checkout.

The `python.md`, `fastapi.md`, `react-native.md`, `ai-ml.md`, and `typescript.md` rule bodies are mirrored 1:1 by the matching `*-patterns` skills (so Codex gets the same content); `scripts/language-skills.test.js` enforces the lockstep.

## Codex Setup

Choose one permanent checkout as the source for global maintenance. Edit and review changes in worktrees, merge, then explicitly install from that permanent checkout. Repository review and `make test` do not install anything globally.

### Skills plugin

The marketplace entry in `.agents/plugins/marketplace.json` points to `./`. The package is the repository root:

```text
.codex-plugin/plugin.json
skills/<name>/SKILL.md
```

Use the runtime's plugin UI or supported marketplace/install commands to install `skills@bjornjee-skills` from this repository. The plugin exposes skills; it does not install root doctrine, agents, or user hooks. Avoid enabling duplicate skill installations unless the runtime's precedence is understood. `make test` verifies an isolated package with no source-checkout symlinks.

### Explicit global installation

From the chosen permanent checkout, inspect before applying:

```bash
make sync-codex ARGS=--check
# After reconciling the reported differences and authorizing global changes:
make sync-codex
make sync-codex ARGS=--check
```

The installer uses `~/.agents/skills` and `CODEX_HOME` (default `~/.codex` when unset or empty). A custom `CODEX_HOME` must be an absolute path so installed hooks work independently of their working directory; relative values are rejected before any writes. It records the source checkout, payload hash, and per-file content hashes/modes in `bjornjee-skills-manifest.json`. Extra files are preserved. Existing identical files can be adopted; conflicting unowned or locally edited files are refused before payload writes. No directory-name-only deletion is allowed. Only unchanged files recorded by the current ownership schema can be retired; empty directories may remain.

A complete source/destination preflight precedes writes. An exclusive journal serializes installers sharing CODEX_HOME; per-file replacements use atomic rename. Caught failures roll back changed files. A process kill or failed rollback leaves `.bjornjee-skills-sync/recovery.json` and blocks another run. The journal is private and contains original bytes/modes; do not publish it. Inspect and restore the recorded targets (absence means remove only that newly installed file), preserve concurrent edits, then remove the journal only after recovery. This is not a cross-filesystem atomic transaction or a lock against unrelated editors; do not edit managed destinations during installation or run installers sharing the same skill destination concurrently.

### Migrating older installations

Schema v1 recorded directory names without file hashes. Version 2 does not use those names as deletion/overwrite authority. First compare the installed content to the selected source, preserve destination-only changes, and back up conflicting files outside managed paths. Reconcile or move those specific files before retrying. Do not mass-delete globals or assume extra skills are obsolete. Retired untracked skills require a separately reviewed ownership inventory.

The native destructive-command hook is an advisory lexical guard. It recognizes common direct command forms, including executable paths and Git global options. It does not interpret aliases, substitutions, eval, scripts, or all shell syntax and does not implement directory freezing. Platform permissions and authorization remain authoritative. Sync replaces only the old owned warning registration; other owners' main-branch and commit gates remain registered. Review/trust the installed hook through the runtime's hook UI when required.

### Scope and rollback

Installing a plugin does not authorize replacing a project's AGENTS.md. Adapt project-local instructions to that repository instead of copying this repository's maintenance rules wholesale.

Before a global rollout, keep a verified backup of affected files and the ownership manifest. Roll back installed content from that backup; reverting a repository commit alone does not roll back globals. The root package-path and ownership changes are described in [ADR 001](docs/adr/001-global-skill-contracts.md).

### Verification and delegation

`make test` requires Node.js, Python 3, and Git. Tests use isolated homes and fixtures under the repository's ignored `tmp/` directory.

Use `codex-delegate` only with its declared tools available. Retain the dispatched job ID, retrieve that job's verified session ID, and resume that session; never use the most recent task as identity.

## Migration from other rule collections

Inventory overlaps and preserve local edits before choosing this repository as owner. Disable or archive only confirmed overlapping rules after separately authorizing the global change. A matching filename is not proof of ownership. Keep unrelated plugin capabilities enabled when they are still used.
