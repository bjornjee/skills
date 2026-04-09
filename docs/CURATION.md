# Skill & Agent Curation

**Date:** 2026-04-08
**Source:** `everything-claude-code@1.10.0` (commit `098b773`)
**Target:** `bjornjee-skills` — single source of truth for my Claude Code surface

## TL;DR

ECC ships ~340 surface elements (181 skills, ~80 commands, ~32 hooks, ~45 agents). Graded against my actual development lifecycle, **~5%** is high-leverage. This PR imports 16 skills and 2 agents. Hooks are deliberately **not** imported — they're the highest-cost surface and I already run a curated, dashboard-aware hook set.

## Real workflow context (the lens for grading)

Almost all my dev work is mediated by [`agent-dashboard`](https://github.com/bjornjee/agent-dashboard) — a Bubble Tea TUI + PWA that monitors and controls Claude Code agents across tmux sessions. This is both **my product** and **my dev environment**, which makes it the dominant constraint:

1. **Sessions are created from the dashboard**, not slash commands. The dashboard launches a tmux pane with one of seven workflow skills (`feature`, `fix`, `chore`, `refactor`, `investigate`, `pr`, `rca`) and z-frecency-ranked path completion. So skills shaped as *lifecycle entrypoints* matter; one-off slash commands matter much less.
2. **State flows through hooks.** The dashboard reads per-agent JSON in `~/.agent-dashboard/agents/`, written by adapter hooks (`agent-state-fast`, `agent-state-reporter`, mermaid extractor, etc.). Hooks are **load-bearing infrastructure**, not nice-to-haves. Adding noisy hooks doesn't just add latency — it risks corrupting dashboard state.
3. **The adapter is in Go.** `agent-dashboard` is Bubble Tea + Charmbracelet stack with strict project rules: external commands behind a `Runner` interface, mockery-generated mocks, no real subprocesses in tests, `-race` mandatory, `CGO_ENABLED=0`. Anything Go-related needs to *complement* not *override* these conventions.
4. **Hooks themselves are Node.js.** The adapter ships Node hook scripts. So Node/JS is a secondary stack (hooks + the PWA's web glue), not the primary one.
5. **TDD is enforced via hook**, not discipline. `test-gate` blocks `git commit` unless `make test` passes. So TDD-flavored tools are reference, not policing.
6. **PRs flow through `gh` CLI** from inside the dashboard (`g` opens existing PR, `G` creates one, `M` merges). GitHub-via-`gh` is a hot path.
7. **Mobile remote control via PWA** means I act asynchronously from my phone — terse, structured outputs and clear state markers matter.

This rewrites the rubric. In the first pass I graded Go skills as F because I was thinking "dotfiles/zsh user." That was wrong — Go is the *primary* language for the most important repo I touch.

## Selection rubric

| Grade | Meaning |
|-------|---------|
| **A** | High leverage for the agent-dashboard lifecycle → import |
| **B** | Useful reference, low import cost (progressive disclosure) → import if applicable |
| **C** | Noise → skip |
| **F** | Wrong stack/vertical → skip |

Filters:
1. **Does it map to a step in my agent-dashboard lifecycle** (session create → plan → implement → test → review → PR → merge)?
2. **Does it reinforce or extend the existing dashboard infrastructure** (hooks, state files, tmux integration)?
3. **Is it Go, Node, or stack-agnostic?** Anything pinned to a stack I don't use is auto-F.
4. **Does it conflict with explicit project rules** (e.g. agent-dashboard's `Runner` interface, mockery patterns)? Conflicts get downgraded — generic Go reviewers can't know about my specific patterns and will produce noise.
5. **Progressive disclosure cost**: skills/agents are loaded lazily, so a permissive bar is fine. Hooks fire on every matching tool call, so the bar is much higher.

## Imported skills (16)

Each is one directory under `skills/<name>/SKILL.md` (ECC's progressive-disclosure format).

### Tier 1 — agent-dashboard core stack

| Skill | Why kept |
|---|---|
| `golang-patterns` | Go is the primary language for `agent-dashboard`. Idiomatic patterns as background reference (does *not* override the project's `Runner` interface and mockery rules). |
| `golang-testing` | Table-driven tests, subtests, mocks, `-race`. Aligns directly with the project's hard rules: mockery, package-level runner var, no real subprocesses. |
| `mcp-server-patterns` | The dashboard's PWA and adapter share patterns with MCP servers; reusable reference. |
| `agent-harness-construction` | Direct reference for extending the Claude Code adapter that ships inside agent-dashboard. |
| `claude-api` | Hooks and the future Go SDK use the Claude API directly. First-party patterns are core. |
| `agentic-engineering` | Operating-model framing for agent-driven workflows — agent-dashboard *is* this in product form. |

### Tier 2 — workflow & lifecycle reinforcement

| Skill | Why kept |
|---|---|
| `terminal-ops` | Evidence-first repo execution. Fits the tmux-pane-per-agent model directly. |
| `git-workflow` | Branch protection, conventional commits, worktree flows — the dashboard's `feature`/`refactor` skills already do worktrees, this is the canonical reference. |
| `github-ops` | `gh` CLI is the dashboard's PR hot path (`g`, `G`, `M`). |
| `search-first` | Research-before-coding — already aligned with my style; keeps it explicit. |
| `safety-guard` | Defensive guardrails; complements the existing `warn-destructive` and `block-main-commit` hooks. |

### Tier 3 — perf, debugging, and meta-tooling

| Skill | Why kept |
|---|---|
| `context-budget` | Audits Claude Code context usage. Same perf-obsession that drove the recent zshrc/tmux tuning. |
| `strategic-compact` | On-demand context compaction — replaces the noisy `pre:edit-write:suggest-compact` hook with manual control. |
| `hookify-rules` | Toolkit for managing hooks. Directly relevant given how load-bearing the dashboard's hooks are. |
| `agent-introspection-debugging` | Structured self-debugging when agents fail. The dashboard *visualizes* agent state; this skill helps reason about it. |
| `regex-vs-llm-structured-text` | The adapter parses JSONL conversations and extracts mermaid blocks. This skill is exactly the decision framework for "structured parsing vs LLM extraction" choices that come up there. |

## Imported agents (2)

The repo already has `code-reviewer`, `security-reviewer`, `build-error-resolver`, `planner`, `tdd-guide`. Adding two more:

| Agent | Why kept |
|---|---|
| `refactor-cleaner` | Dead-code removal and consolidation. Stack-agnostic, reinforces the simplify-first instinct. |
| `performance-optimizer` | Bottleneck/profile/optimize. Generic and useful for the Bubble Tea render loop and PWA. |

### Agents deliberately NOT imported

- **All `<lang>-build-resolver` / `<lang>-reviewer`** for cpp/csharp/dart/flutter/java/kotlin/python/pytorch/rust/typescript → wrong stack.
- **`go-reviewer` / `go-build-resolver`** → **deliberately rejected even though Go is primary.** ECC's generic Go reviewer cannot know about agent-dashboard's specific rules (`Runner` interface, mockery, no real subprocesses, `-race` mandatory, no `os/exec` outside `runner.go`). A generic reviewer would produce *conflicting* advice and weaken the project's enforced patterns. The existing generic `code-reviewer` + the project's `CLAUDE.md` is the better combination.
- **`chief-of-staff`, `seo-specialist`, `healthcare-reviewer`, `e2e-runner`, `opensource-{forker,packager,sanitizer}`** → wrong vertical.
- **`gan-{generator,evaluator,planner}`, `loop-operator`, `harness-optimizer`, `code-architect`, `code-explorer`, `comment-analyzer`, `conversation-analyzer`, `silent-failure-hunter`, `type-design-analyzer`, `doc-updater`, `pr-test-analyzer`** → meta-tooling whose value is unproven; the existing `Plan` and `Explore` built-ins cover the highest-leverage use cases.

## Hooks: deliberately NOT imported

This is the most important section. **Hooks are load-bearing infrastructure for agent-dashboard, not optional decorators.**

The existing `bjornjee-skills/hooks/hooks.json` (which the agent-dashboard adapter ships) is intentionally minimal and dashboard-aware:

- `agent-state-reporter` — registers/updates agent state in `~/.agent-dashboard/agents/`
- `agent-state-fast` — fast incremental sync on every PreToolUse/PostToolUse/PermissionRequest
- `warn-destructive` — block `rm -rf`, `git reset --hard`, `DROP TABLE`, etc.
- `block-main-commit` — block `git commit` on main/master
- `commit-lint` — conventional commit validation
- `test-gate` — block `git commit` unless `make test` passes
- `mermaid-extract` — capture mermaid blocks for the dashboard's diagram viewer
- `desktop-notify` — sound on permission prompt, idle, rate limit, AskUserQuestion, ExitPlanMode

Importing ECC hooks alongside this set would, in order of severity:

1. **Corrupt dashboard state** — ECC hooks may write to or interfere with files the dashboard reads.
2. **Add per-tool-call latency** — `pre:observe:continuous-learning` and `post:observe:continuous-learning` fire on **every** tool call. This is the same perf failure mode I just fought in `.zshrc`.
3. **Duplicate existing functionality** — ECC has its own cost tracker, command-log audit, desktop notifier, test gate, console-log warner. Two of each fights.
4. **Produce false-positive noise** — `post:edit:design-quality-check` (frontend-template heuristics) on a Go TUI repo, `post:edit:console-warn` on Go files, `post:quality-gate` on every edit, `pre:write:doc-file-warning` on legitimate docs.

### Specific ECC hooks rejected

| ECC hook | Why rejected |
|---|---|
| `pre:observe:continuous-learning` / `post:observe:*` | Fires on every tool call. Latency tax for unproven extraction quality. |
| `pre:mcp-health-check` / `post:mcp-health-check` | Adds round-trip to every MCP call. |
| `pre:edit-write:suggest-compact` | Fires too often, breaks flow. The `strategic-compact` skill replaces this on demand. |
| `post:quality-gate` | Slow, opinionated, overrides human judgment after every edit. |
| `post:edit:design-quality-check` | Frontend-template false positives on a Go TUI repo. |
| `post:edit:console-warn` + `stop:check-console-log` | Duplicates of each other; only relevant in JS/TS; dashboard adapter is Go. |
| `pre:write:doc-file-warning` | Fights legitimate docs. |
| `pre:bash:git-push-reminder` | Plan-mode and the dashboard's PR flow already cover this. |
| `post:bash:command-log-audit` | I already have `~/.claude/bash-commands.log`. |
| `post:bash:command-log-cost` + `stop:cost-tracker` | Duplicates; the dashboard already tracks per-agent cost in SQLite. |
| `post:bash:pr-created` | Duplicates the adapter's `pr-state-detection` hook. |
| `post:bash:build-complete` | ECC's own README labels it an "example" demo hook. |
| `stop:evaluate-session` | Fires on every Stop; extraction quality unproven. |
| `pre:governance-capture` / `post:governance-capture` | Off by default but still loaded. |
| `pre:edit-write` accumulator + `stop:format-typecheck` | JS/TS-only; dashboard adapter is Go. |
| `stop:desktop-notify` | Duplicate of the adapter's `desktop-notify` (which is dashboard-aware). |

### ECC hook ideas worth re-implementing locally (NOT in this PR)

Three ECC hooks are worth porting as small, dashboard-aware scripts authored by me — *not* blindly imported:

1. **`block-no-verify`** — block `git --no-verify`. Reinforces the existing pre-commit hook chain (which `test-gate` and `commit-lint` depend on).
2. **`config-protection`** — block agents from editing `.eslintrc`, `.prettierrc`, `biome.json`, `.golangci.yml`, etc. to weaken rules instead of fixing code.
3. **An `auto-tmux-dev`-style hook** — but adapted to the dashboard's tmux session naming, not ECC's heuristics.

These are tracked as follow-ups, not part of this PR.

## Commands: deliberately NOT imported

ECC ships ~80 slash commands. The existing seven workflow skills (`feature`/`fix`/`chore`/`refactor`/`investigate`/`pr`/`rca`) + the dashboard's UI cover my actual lifecycle entrypoints. ECC commands fall into three buckets:

1. **Language-specific build/test/review** — F for everything except Go, and even then `go-build` / `go-test` / `go-review` would conflict with the project's specific rules. Skip.
2. **Meta-orchestration** (`/santa-loop`, `/devfleet`, `/multi-*`, `/orchestrate`, `/gan-*`) — adds cognitive overhead, no payoff.
3. **Genuinely useful** (`/plan`, `/code-review`, `/review-pr`, `/save-session`, `/resume-session`, `/sessions`, `/context-budget`, `/hookify*`, `/harness-audit`, `/skill-health`) — but these can be reimplemented locally if ECC is fully decommissioned.

Commands are not in scope for this PR.

## What this PR does

- Adds 16 skills under `skills/`
- Adds 2 agents under `agents/`
- Adds this report under `docs/`
- Touches **zero** hooks

## Follow-ups (not in this PR)

1. **Decide ECC fate.** Recommended: disable ECC entirely in `~/.claude/settings.json` once the useful commands are reimplemented locally. Until then, leave ECC enabled but be aware its 32 hooks are still firing.
2. **Sync `rca` skill.** The agent-dashboard adapter has an `rca` skill that bjornjee-skills doesn't. Should pull it across.
3. **Author 2–3 small hooks locally** (`block-no-verify`, `config-protection`, dashboard-aware tmux helper).
4. **Reimplement ~10 useful ECC commands as bjornjee-skills slash commands** (once ECC is decommissioned).
5. **Update top-level `README.md` skill/agent tables** to reflect this import.
