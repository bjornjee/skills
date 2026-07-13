# Project Conventions

Claude Code plugin repo: skills, agents, and rules. The plugins remain pure configuration; repository scripts install personal Codex globals.

## Layout

```
skills/                  Slash command skills (SKILL.md per directory) — canonical
agents/                  Named subagent definitions (.md files)
.claude/rules/           Claude Code rules (glob-scoped .md files)
.claude-plugin/          Claude plugin metadata (plugin.json, marketplace.json)
plugins/skills/          Codex plugin package (.codex-plugin/plugin.json + skills/ symlink to ../../skills)
.agents/plugins/         Codex marketplace pointer (marketplace.json)
.codex/                  Canonical Codex doctrine (AGENTS.md) — synced via make sync-codex
scripts/                 Utility scripts
```

## Versioning

Three files must stay in sync: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `plugins/skills/.codex-plugin/plugin.json`. Bump all three in the same commit on every change to skills, agents, or rules (`make test` enforces the lockstep). Semver: patch=fix, minor=new, major=breaking.

## Principles

1. KISS. Simplest thing that works. Three clear lines beat one extracted helper.
2. DRY. Constants and types defined once. Copy-paste means extract.
3. No just-in-case code. No feature flags or backwards-compat shims without a migration plan.
4. One way to do things. Follow existing patterns. Do not introduce alternatives.
5. Battle-tested over hand-rolled. If an OSS project solves 80%+, use it.
6. Bounded work. Every implementation states its unit of work, what it scales with, and where it runs. Work that scales with global accumulated state is suspect unless the plan bounds, batches, caches, indexes, or defers it.
7. Stay in declared scope. If the task says "X only," don't touch Y — surface adjacent improvements as separate proposals, never silently expand the diff.
8. The ladder. Stop at the first rung that holds: YAGNI → reuse what's already in this codebase → stdlib → native platform feature → installed dependency → one line → minimum code. Read the problem and trace the real flow before picking a rung. Never simplify away trust-boundary validation, data-loss handling, security, or accessibility. Mark deliberate shortcuts with a `ponytail:` comment that names the ceiling and upgrade path.
9. Architecture judgment. Classify decisions one-way vs two-way door — scrutiny proportional to irreversibility; one-way doors or cross-repo consumers get a 10-line ADR in `docs/adr/` linked from the PR. State three blast radii in plans (data, external API consumers, org). Migrations run expand → migrate → contract with the destructive step shipping alone. Prod-touching changes name their rollback path before merge.
10. Decision discipline. Before CI, automation, agent workflows, security-sensitive code, or user-visible generated output: define execution authority, ownership boundaries, bootstrap vs steady state, output contract, and failure mode. More than two corrective iterations in one area = stop patching, reframe the invariant.

## Workflow

0. Worktree first. Any code-modifying task beyond a single-line fix runs in a git worktree — no edits, writes, or `git add` on the source branch, even when the task starts as "just look at it".
1. Research before writing. Check the repo, docs, and package registries first.
2. Plan before coding. Break into phases, identify risks.
3. Proportional proof. Use TDD for behavior changes, bug fixes, and regressions; do not add padding tests for docs/config/mechanical edits. Choose Surgical, Targeted, or Full verification before editing, run the smallest command that bounds the risk during the loop, and reserve full suites for broad/shared changes or PR/push gates. The core rules own the profile taxonomy; agent-dashboard owns orchestration/state and should carry profile names plus proof commands without redefining them.
   - When adding a new test file, verify it is included by the package's normal test command. If tests are explicitly listed in a manifest or runner config, update that manifest/config and run the package test command.
   - For state reconciliation fixes, identify the source of truth for each predicate. Do not use state-field equality as a proxy for filesystem, git, or process identity when a structured check exists.
   - For merge-style state writes, fields that must be cleared must be written explicitly with their cleared value. Do not omit a key when omission preserves stale state.
   - Boundary bug gate. For any bug that crosses UI, HTTP, tmux, terminal, browser, subprocess, external runtime, MCP tool, or stateful session boundaries, mocked/unit evidence is not enough. Reproduce the original user action through the real boundary and verify the reported symptom is gone at the failing surface before claiming the fix. Mocks and unit tests are regression guards after diagnosis, not live-behavior proof.
4. Review all changes before commit.
   - Run a security boundary review for every changed input, output, auth, storage, file, network, and browser boundary. Look for injection, SQL/command/template injection, XSS, CSRF, auth/authz bypass, secret exposure, unsafe deserialization, SSRF, path traversal, insecure defaults, and missing validation or escaping.
   - Check predicate/source-of-truth correctness, merge/update semantics, path-shape edge cases, test command inclusion, and cross-adapter drift when equivalent files changed.
5. Before PR/push, the strict-reviewer spawn IS the audit — scope it explicitly to the changed-file list plus package manifests, CI config, and test-runner config; no separate neutral pass.
   - High/Critical findings block push. Medium findings must be fixed when cheap or called out in the PR body.
6. Conventional commits: `<type>: <description>` — feat/fix/refactor/docs/test/chore/perf/ci, no scopes. Before PR/push, run the repo's final gate when it exists (`make test`, `make test-fast`, CI check, or documented equivalent).
7. No self-attribution in commits or PRs. No `Co-Authored-By` trailer naming the assistant, no `Generated with` footer in PR bodies.

Coverage goal: 80%+.

## Language Conventions

Language-specific conventions ship two ways, same content:

- **Skills** (`skills/<name>-patterns/`) — invoked on demand, work in both Claude Code and Codex.
- **Claude Code rules** (`.claude/rules/*.md`) — auto-loaded via glob `paths` frontmatter when a matching file is edited (Claude Code only; installed by `make sync-rules`).

`scripts/language-skills.test.js` keeps the python/fastapi/react-native/ai-ml/typescript skill bodies byte-identical to their rules files; the Go skills are standalone references. When working on a language, reach for the matching skill:

- **Go** → `$skills:golang-patterns`, `$skills:golang-testing`
- **Python** → `$skills:python-patterns`
- **FastAPI** → `$skills:fastapi-patterns` (in addition to `$skills:python-patterns`)
- **TypeScript/Node** → `$skills:typescript-patterns`
- **React Native** → `$skills:react-native-patterns` (in addition to `$skills:typescript-patterns`)
- **AI/ML & Evals** → `$skills:ai-ml-patterns`
- **Git operations** → `$skills:git-workflow`
- **Terminal execution** → `$skills:terminal-ops`
