# bjornjee-skills

Personal skills, agents, and rules for Claude Code.

This plugin is a pure configuration plugin — **rules, skills, and agents only**. It ships no hooks and no runtime code; `scripts/` holds only repo-maintenance helpers (rules symlink installer, Codex link verifier, tests).

## Related plugins

Dashboard/runtime hooks and the generic workflow skills (`/feature`, `/fix`, `/pr`, `/chore`, `/investigate`, `/refactor`) and the generic review agents (`code-reviewer`, `planner`, `security-reviewer`, `tdd-guide`, `build-error-resolver`) are provided by the separate [bjornjee/agent-dashboard](https://github.com/bjornjee/agent-dashboard) plugin. Install both side-by-side for the full experience.

## Installation

1. Add the marketplace:

```
/plugin marketplace add bjornjee/skills
```

2. Install the plugin:

```
/plugin install bjornjee-skills@bjornjee-skills
```

## Structure

```
skills/                Canonical workflow and specialty skills (slash commands)
agents/                Specialized subagents
.claude/rules/         Rules and guidelines (symlinked into ~/.claude/rules/)
.claude-plugin/        Claude plugin manifest + marketplace
plugins/skills/        Codex plugin package; plugins/skills/skills is a symlink → ../../skills
.agents/plugins/       Codex marketplace pointer (marketplace.json)
scripts/               Helper scripts (rules symlink installer, codex plugin link verifier)
```

Both plugins read from the same `skills/` directory: the Claude plugin loads it directly, and the Codex plugin sees it through `plugins/skills/skills` → `../../skills`. There is no second copy to keep in sync.

## Skills

| Skill | Description |
|-------|-------------|
| `/agent-harness-construction` | Design and optimize AI agent action spaces, tool definitions, and observation formatting |
| `/agent-introspection-debugging` | Structured self-debugging workflow for AI agent failures |
| `/agentic-engineering` | Eval-first execution, decomposition, and cost-aware model routing |
| `/ai-ml-patterns` | Eval-first AI/ML workflow (lockstep copy of the `ai-ml.md` rule) |
| `/claude-api` | Anthropic Claude API patterns for Python and TypeScript |
| `/codegraph-audit` | Call-graph-aware pre-PR review via the local codegraph CLI |
| `/codex-delegate` | Plan → Delegate → Review → Rectify handoff to Codex CLI |
| `/context-budget` | Audit Claude Code context window consumption across agents, skills, MCP servers, and rules |
| `/fastapi-patterns` | FastAPI service-layer conventions (lockstep copy of the `fastapi.md` rule) |
| `/git-workflow` | Git branching, commits, merge vs rebase, conflict resolution |
| `/github-ops` | GitHub repository operations and automation via `gh` CLI |
| `/golang-patterns` | Idiomatic Go patterns and conventions |
| `/golang-testing` | Go testing patterns (table-driven, subtests, benchmarks, fuzzing) |
| `/hookify-rules` | Create hookify rules and configure hook syntax (ECC plugin format) |
| `/mcp-server-patterns` | Build MCP servers with Node/TypeScript SDK |
| `/ponytail` | Forces the laziest solution that actually works (YAGNI, stdlib-first) |
| `/python-patterns` | Python style, typing, and tooling conventions (lockstep copy of the `python.md` rule) |
| `/react-native-patterns` | React Native platform + worktree isolation conventions (lockstep copy of the `react-native.md` rule) |
| `/regex-vs-llm-structured-text` | Decision framework for choosing between regex and LLM for parsing |
| `/safety-guard` | Prevent destructive operations when working on production systems |
| `/search-first` | Research-before-coding workflow |
| `/strategic-compact` | Suggests manual context compaction at logical intervals |
| `/terminal-ops` | Evidence-first repo execution workflow |
| `/uiux-design-loop` | Two-loop UI/UX discipline with a cold-context grader (requires `impeccable`) |

## Agents

| Agent | Description |
|-------|-------------|
| `go-reviewer-strict` | Strict Go code reviewer enforcing evidence-based principles from CLAUDE.md/AGENTS.md |
| `performance-optimizer` | Performance analysis and optimization specialist (stack-aware: Go/Python/JS) |
| `python-reviewer-strict` | Strict Python code reviewer enforcing evidence-based principles |
| `refactor-cleaner` | Dead code cleanup and consolidation specialist (stack-aware: Go/Python/JS) |
| `tdd-guide` | Proportional-proof guide (Surgical/Targeted/Full profiles, RED → GREEN → REFACTOR) |
| `uiux-grader` | Cold-context UI/UX grader — internal to `/uiux-design-loop`, never invoked standalone |

## Rules

| File | Scope | Description |
|------|-------|-------------|
| `core.md` | All | KISS, DRY, workflow phases, agent dispatch, model selection |
| `python.md` | `**/*.py` | PEP 8, Pydantic, pytest, tooling |
| `golang.md` | `**/*.go` | Idiomatic Go conventions |
| `fastapi.md` | `**/*.py` | Service layer, DI, async SQLAlchemy, soft delete |
| `react-native.md` | `**/*.ts{,x}` | Expo, worktree isolation, Metro ports |
| `ai-ml.md` | `**/evals/**` | Eval pipelines, prompt testing, experiments |

Run `make sync-rules` (wraps `scripts/install-rules-symlinks.sh`) to symlink these into `~/.claude/rules/` so Claude Code loads them at user scope. Because they are symlinks, later edits in the repo propagate automatically.

The `python.md`, `fastapi.md`, `react-native.md`, and `ai-ml.md` rule bodies are mirrored 1:1 by the matching `*-patterns` skills (so Codex gets the same content); `scripts/language-skills.test.js` enforces the lockstep.

## Codex Setup

This repo includes configuration for [OpenAI Codex CLI](https://github.com/openai/codex) so you can install the same workflow skills in Codex or delegate isolated coding tasks from Claude Code.

### Install the Codex skill plugin

Add this repo as a Codex marketplace and install the `skills` plugin. The marketplace pointer at `.agents/plugins/marketplace.json` directs Codex at the packaged plugin in `plugins/skills/`.

```bash
codex plugin marketplace add github.com/bjornjee/skills
codex plugin add skills@bjornjee-skills
```

Restart Codex after adding the marketplace if the plugin list is already open.

The Codex package follows the official plugin layout:

```
plugins/skills/
  .codex-plugin/plugin.json
  skills/                       # symlink → ../../skills (canonical)
```

`skills/` and `plugins/skills/skills/` are the same directory on disk. The packaged plugin needs no separate sync step; `scripts/sync-codex-plugin.sh` only verifies (or repairs) the symlink.

```bash
make sync-codex-plugin   # verifies / repairs the symlink
make test                # asserts the symlink shape and skill content
```

### Project-local Codex config

The marketplace install ships skills only. If you also want this repo's project-level Codex config (`AGENTS.md`, `.codex/`) inside another checkout, copy them in:

```bash
SKILLS_REPO="$HOME/Code/bjornjee/skills"  # adjust to your clone path
cp "$SKILLS_REPO/AGENTS.md" ./AGENTS.md
cp -r "$SKILLS_REPO/.codex" ./.codex
```

To install the always-on Codex doctrine globally instead, run `make sync-codex-rules` from the skills repo (copies `.codex/AGENTS.md` to `~/.codex/AGENTS.md`).

Then verify:

```bash
codex exec "summarize the current instructions"
```

### Delegation from Claude Code

Use the `/codex-delegate` skill inside Claude Code for the full Plan → Delegate → Review → Rectify workflow.

---

## Migration from ECC

If you previously used `everything-claude-code` for rules, follow these steps to switch to bjornjee-skills as the source of truth.

### Step 1: Remove overlapping global rules

These files in `~/.claude/rules/` are now owned by bjornjee-skills. Remove them:

```bash
rm ~/.claude/rules/agents.md           # replaced by: core.md (agent dispatch)
rm ~/.claude/rules/coding-style.md     # replaced by: python.md
rm ~/.claude/rules/development-workflow.md  # replaced by: core.md
rm ~/.claude/rules/git-workflow.md     # replaced by: core.md
rm ~/.claude/rules/hooks.md            # replaced by: python.md (logging rule)
rm ~/.claude/rules/patterns.md         # replaced by: python.md + fastapi.md
rm ~/.claude/rules/performance.md      # replaced by: core.md (model selection)
rm ~/.claude/rules/security.md         # replaced by: python.md (secrets rule)
rm ~/.claude/rules/testing.md          # replaced by: python.md + core.md
```

### Step 2: Verify

Restart Claude Code and confirm:
- Rules load from bjornjee-skills plugin (check with `/config`)
- No duplicate rules from `~/.claude/rules/`

### Step 3 (optional): Remove ECC entirely

Once you've confirmed everything works, you can disable ECC in `~/.claude/settings.json`:

```json
"enabledPlugins": {
  "everything-claude-code@everything-claude-code": false
}
```

Keep it enabled if you still use ECC's skills catalog.
