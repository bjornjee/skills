# bjornjee-skills

Personal skills, commands, and workflows for Claude Code.

## Installation

Add to `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "bjornjee-skills": {
      "source": {
        "source": "github",
        "repo": "bjornjee/skills"
      }
    }
  }
}
```

Then enable the plugin:

```json
{
  "enabledPlugins": {
    "bjornjee-skills@bjornjee-skills": true
  }
}
```

## Structure

```
.claude-plugin/    Plugin metadata
commands/          Slash commands (/feature, etc.)
skills/            Domain skills (SKILL.md directories)
agents/            Agent definitions
rules/             Rules and guidelines
```

## Commands

| Command | Description |
|---------|-------------|
| `/feature <description>` | Start a new feature in an isolated git worktree |
