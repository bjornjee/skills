# bjornjee-skills

Personal skills, commands, and workflows for Claude Code.

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
