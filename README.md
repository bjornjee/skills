# bjornjee-skills

Personal skills, agents, and rules for Claude Code.

This plugin is a pure configuration plugin — **rules, skills, and agents only**. It ships no hooks, no scripts, and no runtime code.

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
.claude/rules/         Rules and guidelines (symlinked into ~/.claude/rules/)
.claude-plugin/        Plugin metadata (plugin.json, marketplace.json)
skills/                Workflow and specialty skills (slash commands)
agents/                Specialized subagents
scripts/               Helper scripts (rules symlink installer)
```

## Skills

| Skill | Description |
|-------|-------------|
| `/agent-harness-construction` | Design and optimize AI agent action spaces, tool definitions, and observation formatting |
| `/agent-introspection-debugging` | Structured self-debugging workflow for AI agent failures |
| `/agentic-engineering` | Eval-first execution, decomposition, and cost-aware model routing |
| `/claude-api` | Anthropic Claude API patterns for Python and TypeScript |
| `/context-budget` | Audit Claude Code context window consumption across agents, skills, MCP servers, and rules |
| `/git-workflow` | Git branching, commits, merge vs rebase, conflict resolution |
| `/github-ops` | GitHub repository operations and automation via `gh` CLI |
| `/golang-patterns` | Idiomatic Go patterns and conventions |
| `/golang-testing` | Go testing patterns (table-driven, subtests, benchmarks, fuzzing) |
| `/hookify-rules` | Create hookify rules and configure hook syntax |
| `/mcp-server-patterns` | Build MCP servers with Node/TypeScript SDK |
| `/regex-vs-llm-structured-text` | Decision framework for choosing between regex and LLM for parsing |
| `/safety-guard` | Prevent destructive operations when working on production systems |
| `/search-first` | Research-before-coding workflow |
| `/strategic-compact` | Suggests manual context compaction at logical intervals |
| `/terminal-ops` | Evidence-first repo execution workflow |

## Agents

| Agent | Description |
|-------|-------------|
| `go-reviewer-strict` | Strict Go code reviewer enforcing evidence-based principles from CLAUDE.md/AGENTS.md |
| `performance-optimizer` | Performance analysis and optimization specialist |
| `python-reviewer-strict` | Strict Python code reviewer enforcing evidence-based principles |
| `refactor-cleaner` | Dead code cleanup and consolidation specialist |

## Rules

| File | Scope | Description |
|------|-------|-------------|
| `core.md` | All | KISS, DRY, workflow phases, agent dispatch, model selection |
| `python.md` | `**/*.py` | PEP 8, Pydantic, pytest, tooling |
| `golang.md` | `**/*.go` | Idiomatic Go conventions |
| `fastapi.md` | `**/*.py` | Service layer, DI, async SQLAlchemy, soft delete |
| `react-native.md` | `**/*.ts{,x}` | Expo, worktree isolation, Metro ports |
| `ai-ml.md` | `**/evals/**` | Eval pipelines, prompt testing, experiments |

Run `scripts/install-rules-symlinks.sh` to symlink these into `~/.claude/rules/` so Claude Code loads them at user scope.

## Codex Setup

This repo includes configuration for [OpenAI Codex CLI](https://github.com/openai/codex) so you can delegate isolated coding tasks from Claude Code. The files live in `.agents/`, `.codex/`, and `AGENTS.md` but need to be copied into your target project.

### Install the Codex skill plugin

To install the Codex-ready skills globally in Codex, add this repo as a Codex marketplace and install the `skills` plugin:

```bash
codex plugin marketplace add github.com/bjornjee/skills
codex plugin install skills@bjornjee-skills
```

This installs the repo's existing `skills/` directory via the Codex manifest. It does not replace project-local `AGENTS.md` or `.codex/` config when you want repo-specific instructions inside another checkout.

### Step 1: Copy project config and AGENTS.md

```bash
# From the root of your target project:
SKILLS_REPO="$HOME/Code/bjornjee/skills"  # adjust to your clone path

cp "$SKILLS_REPO/AGENTS.md" ./AGENTS.md
cp -r "$SKILLS_REPO/.codex" ./.codex
chmod +x .codex/hooks/validate-command.sh
```

### Step 2: Copy Codex skills

```bash
cp -r "$SKILLS_REPO/.agents" ./.agents
```

### Step 3: Re-sync skills after updates

When skills change in this repo, re-run the sync script to update `.agents/skills/`:

```bash
"$SKILLS_REPO/scripts/sync-skills-to-codex.sh"
```

Then copy the updated `.agents/` directory to your target project again.

### Step 4: Verify

```bash
codex exec "summarize the current instructions"
```

Codex should reference AGENTS.md conventions and discover the ported skills.

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
