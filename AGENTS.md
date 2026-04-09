# Project Conventions

Claude Code plugin repo: skills, agents, and rules. Pure configuration — no runtime code.

## Layout

```
skills/           Slash command skills (SKILL.md per directory)
agents/           Named subagent definitions (.md files)
.claude/rules/    Claude Code rules (glob-scoped .md files)
.claude-plugin/   Plugin metadata (plugin.json, marketplace.json)
.agents/skills/   Codex-compatible skills (mirrored from skills/)
.codex/           Codex project config and rules
scripts/          Utility scripts
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
4. Conventional commits: `<type>: <description>` — feat/fix/refactor/docs/test/chore/perf/ci, no scopes.

Coverage goal: 80%+.

## Language Conventions

All language-specific rules are enforced via skills with implicit invocation. When working on a language, the corresponding skill activates automatically:

- **Go** → `$golang-patterns`, `$golang-testing`
- **Python** → `$python-patterns`
- **FastAPI** → `$fastapi-patterns` (in addition to `$python-patterns`)
- **React Native** → `$react-native-patterns`
- **AI/ML & Evals** → `$ai-ml-patterns`
- **Git operations** → `$git-workflow`
- **Terminal execution** → `$terminal-ops`
