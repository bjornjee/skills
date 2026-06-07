# Project Conventions

Claude Code plugin repo: skills, agents, and rules. Pure configuration — no runtime code.

## Layout

```
skills/                  Slash command skills (SKILL.md per directory) — canonical
agents/                  Named subagent definitions (.md files)
.claude/rules/           Claude Code rules (glob-scoped .md files)
.claude-plugin/          Claude plugin metadata (plugin.json, marketplace.json)
plugins/skills/          Codex plugin package (.codex-plugin/plugin.json + skills/ symlink to ../../skills)
.agents/plugins/         Codex marketplace pointer (marketplace.json)
.codex/                  Codex project config and rules
scripts/                 Utility scripts
```

## Versioning

Two files must stay in sync: `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
Bump on every commit that changes skills, agents, or rules. Semver: patch=fix, minor=new, major=breaking.

## Principles

1. KISS. Simplest thing that works. Three clear lines beat one extracted helper.
2. DRY. Constants and types defined once. Copy-paste means extract.
3. No just-in-case code. No feature flags or backwards-compat shims without a migration plan.
4. One way to do things. Follow existing patterns. Do not introduce alternatives.
5. Battle-tested over hand-rolled. If an OSS project solves 80%+, use it.

## Workflow

1. Research before writing. Check the repo, docs, and package registries first.
2. Plan before coding. Break into phases, identify risks.
3. TDD. Write a failing test. Make it pass. Clean up. Run tests after every change.
   - When adding a new test file, verify it is included by the package's normal test command. If tests are explicitly listed in a manifest or runner config, update that manifest/config and run the package test command.
   - For state reconciliation fixes, identify the source of truth for each predicate. Do not use state-field equality as a proxy for filesystem, git, or process identity when a structured check exists.
   - For merge-style state writes, fields that must be cleared must be written explicitly with their cleared value. Do not omit a key when omission preserves stale state.
   - Boundary bug gate. For any bug that crosses UI, HTTP, tmux, terminal, browser, subprocess, external runtime, MCP tool, or stateful session boundaries, mocked/unit evidence is not enough. Reproduce the original user action through the real boundary and verify the reported symptom is gone at the failing surface before claiming the fix. Mocks and unit tests are regression guards after diagnosis, not live-behavior proof.
4. Review all changes before commit.
   - Run a security boundary review for every changed input, output, auth, storage, file, network, and browser boundary. Look for injection, SQL/command/template injection, XSS, CSRF, auth/authz bypass, secret exposure, unsafe deserialization, SSRF, path traversal, insecure defaults, and missing validation or escaping.
   - Check predicate/source-of-truth correctness, merge/update semantics, path-shape edge cases, test command inclusion, and cross-adapter drift when equivalent files changed.
5. Before PR/push, run the same checks in a neutral correctness and security audit scoped to the changed-file list plus package manifests, CI config, and test runner config.
   - The reviewer is read-only.
   - High/Critical findings block push. Medium findings are fixed when cheap or called out.
6. Conventional commits: `<type>: <description>` — feat/fix/refactor/docs/test/chore/perf/ci, no scopes.
7. No self-attribution in commits or PRs. No `Co-Authored-By` trailer naming the assistant, no `Generated with` footer in PR bodies.

Coverage goal: 80%+.

## Language Conventions

All language-specific rules are enforced via skills with implicit invocation. When working on a language, the corresponding skill activates automatically:

- **Go** → `$skills:golang-patterns`, `$skills:golang-testing`
- **Python** → `$skills:python-patterns`
- **FastAPI** → `$skills:fastapi-patterns` (in addition to `$skills:python-patterns`)
- **React Native** → `$skills:react-native-patterns`
- **AI/ML & Evals** → `$skills:ai-ml-patterns`
- **Git operations** → `$skills:git-workflow`
- **Terminal execution** → `$skills:terminal-ops`
