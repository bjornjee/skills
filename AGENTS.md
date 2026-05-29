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
5. No self-attribution in commits or PRs. No `Co-Authored-By` trailer naming the assistant, no `Generated with` footer in PR bodies.

Coverage goal: 80%+.

## Decision discipline

Before implementing CI, automation, agent workflows, security-sensitive code, or user-visible generated output, define the decision frame explicitly:

- **Execution authority.** What code runs, where it runs, with which credentials/permissions, and which source revision it is allowed to execute from.
- **Ownership boundaries.** Which layer owns orchestration, deterministic logic, AI synthesis, persistence, publishing, cleanup, and error handling.
- **Bootstrap vs steady state.** What happens before the new code/config exists on the default branch, after it lands, and when required artifacts or dependencies are missing.
- **User-facing output contract.** Who reads the output, what action they should take, what should be hidden, and whether output is create-only, append-only, upserted, or deleted.
- **Failure mode.** Whether failure should block, fail soft, emit an artifact, skip, retry, or require manual action.

Do not let the easiest implementation surface become the architecture. Choose responsibility boundaries first, then place code in YAML, scripts, prompts, app modules, or docs according to ownership.

If implementation requires more than two corrective iterations in the same area, stop patching and reframe the missing invariant before continuing.

## Language Conventions

All language-specific rules are enforced via skills with implicit invocation. When working on a language, the corresponding skill activates automatically:

- **Go** → `$skills:golang-patterns`, `$skills:golang-testing`
- **Python** → `$skills:python-patterns`
- **FastAPI** → `$skills:fastapi-patterns` (in addition to `$skills:python-patterns`)
- **React Native** → `$skills:react-native-patterns`
- **AI/ML & Evals** → `$skills:ai-ml-patterns`
- **Git operations** → `$skills:git-workflow`
- **Terminal execution** → `$skills:terminal-ops`
