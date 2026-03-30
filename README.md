# bjornjee-skills

Personal skills, commands, hooks, and workflows for Claude Code.

This is the **single source of truth** for all Claude Code configuration. Everything in `~/.claude/rules/` and `~/.claude/settings.json` should derive from here.

## Agent Dashboard

The agent dashboard TUI has moved to its own repo: [bjornjee/agent-dashboard](https://github.com/bjornjee/agent-dashboard). Install it as a tmux plugin for the full multi-agent experience.

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
.claude/rules/         Rules and guidelines (loaded automatically by plugin)
.claude-plugin/        Plugin metadata
  commands/            Slash commands (/feature, etc.)
hooks/                 Hook definitions (hooks.json)
scripts/hooks/         Hook scripts (Node.js)
skills/                Domain skills
```

## Rules

| File | Scope | Description |
|------|-------|-------------|
| `principles.md` | All | KISS, DRY, research-first, plan-first, test-first |
| `workflow.md` | All | Development lifecycle and git conventions |
| `python.md` | `**/*.py` | PEP 8, Pydantic, pytest, tooling |
| `fastapi.md` | `**/*.py` | Service layer, DI, async SQLAlchemy, soft delete |
| `monorepo.md` | All | Root-level scripts, shared packages, uv, Docker |
| `model-selection.md` | All | Haiku/Sonnet/Opus selection strategy |
| `agent-orchestration.md` | All | Auto agent usage, parallel execution |
| `react-native.md` | `**/*.ts{,x}` | Expo, worktree isolation, Metro ports |
| `ai-ml.md` | `**/evals/**` | Eval pipelines, prompt testing, experiments |

## Hooks

| Event | Hook | Description |
|-------|------|-------------|
| `Stop` | `desktop-notify.js` | macOS notification via terminal-notifier; click to jump to tmux pane |

### Dependencies

- `terminal-notifier`: `brew install terminal-notifier`

## Commands

| Command | Description |
|---------|-------------|
| `/feature <description>` | Start a new feature in an isolated git worktree |

## Migration from ECC

If you previously used `everything-claude-code` for rules and hooks, follow these steps to switch to bjornjee-skills as the source of truth.

### Step 1: Remove overlapping global rules

These files in `~/.claude/rules/` are now owned by bjornjee-skills. Remove them:

```bash
rm ~/.claude/rules/agents.md           # replaced by: agent-orchestration.md
rm ~/.claude/rules/coding-style.md     # replaced by: python.md
rm ~/.claude/rules/development-workflow.md  # replaced by: workflow.md + principles.md
rm ~/.claude/rules/git-workflow.md     # replaced by: workflow.md
rm ~/.claude/rules/hooks.md            # replaced by: python.md (logging rule)
rm ~/.claude/rules/patterns.md         # replaced by: python.md + fastapi.md
rm ~/.claude/rules/performance.md      # replaced by: model-selection.md
rm ~/.claude/rules/security.md         # replaced by: python.md (secrets rule)
rm ~/.claude/rules/testing.md          # replaced by: python.md + principles.md (test-first)
```

### Step 2: Disable ECC's desktop-notify hook

Set the environment variable to prevent ECC's hook from double-firing:

```bash
export ECC_DISABLED_HOOKS="stop:desktop-notify"
```

Add this to your `~/.zshrc` to persist.

### Step 3: Verify

Restart Claude Code and confirm:
- Rules load from bjornjee-skills plugin (check with `/config`)
- Notifications use terminal-notifier (not osascript)
- Clicking a notification switches to the correct tmux pane
- No duplicate rules from `~/.claude/rules/`

### Step 4 (optional): Remove ECC entirely

Once you've confirmed everything works, you can disable ECC in `~/.claude/settings.json`:

```json
"enabledPlugins": {
  "everything-claude-code@everything-claude-code": false
}
```

Keep it enabled if you still use ECC's skills catalog (e.g., `/docs`, `/plan`, `/tdd`).
