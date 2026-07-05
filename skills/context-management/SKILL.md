---
name: context-management
description: Use when deciding whether/when to compact the session, or when auditing what is consuming the context window (agents, skills, MCP servers, rules). Compaction timing + token-budget audit in one place.
---
# Context Management

Two halves of one problem: **when** to compact (timing beats auto-compaction) and **what** is eating the window (audit before adding more components).

## When to compact — phase boundaries, not thresholds

Auto-compaction fires at arbitrary points, often mid-task. Compact deliberately at logical boundaries:

| Phase transition | Compact? | Why |
|-----------------|----------|-----|
| Research → Planning | Yes | Research context is bulky; the plan is the distilled output |
| Planning → Implementation | Yes | Plan lives in the task list or a file; free context for code |
| Implementation → Testing | Maybe | Keep if tests reference recent code; compact if switching focus |
| Debugging → Next feature | Yes | Debug traces pollute unrelated work |
| Mid-implementation | No | Losing variable names, paths, and partial state is costly |
| After a failed approach | Yes | Clear the dead-end reasoning before the new attempt |

What survives compaction: CLAUDE.md/rules, the task list, memory files, git state, files on disk. What's lost: intermediate reasoning, previously-read file contents, tool-call history, verbally-stated nuances. **Write before compacting** — durable context goes to files or memory first. Use `/compact <focus message>` to steer the summary.

## Optional reminder hook

The skill works on demand with no hook — this plugin deliberately ships zero hooks. For automatic nudges, wire `suggest-compact.sh` (in this skill's directory) as a PreToolUse hook in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Edit", "hooks": [{ "type": "command", "command": "bash ~/.claude/skills/context-management/suggest-compact.sh" }] },
      { "matcher": "Write", "hooks": [{ "type": "command", "command": "bash ~/.claude/skills/context-management/suggest-compact.sh" }] }
    ]
  }
}
```

It counts tool calls per session and suggests compaction at a threshold (`COMPACT_THRESHOLD`, default 50), reminding every 25 after.

## Auditing the window

Run when the session feels sluggish, after adding components, or before adding more.

**Inventory** (token estimate: `words × 1.3` prose, `chars / 4` code-heavy):
- **Agents** (`agents/*.md`) — flag files >200 lines; flag descriptions >30 words (the description loads into *every* Task invocation even if the agent is never spawned).
- **Skills** (`skills/*/SKILL.md`) — flag >400 lines; skip identical copies behind Codex plugin symlinks (e.g. `plugins/skills/skills/`) to avoid double-counting.
- **Rules** (`.claude/rules/*.md`) — flag >100 lines; detect overlap between rule files and CLAUDE.md.
- **MCP servers** — ~500 tokens per tool schema; flag servers with >20 tools and servers wrapping CLIs you already have (`gh`, `git`, `npm`). **MCP is the biggest lever** — one 30-tool server outweighs all your skills combined.
- **CLAUDE.md chain** — flag combined >300 lines.

**Classify** each component: always needed (referenced by doctrine/commands/project type) → keep; sometimes needed (domain-specific) → on-demand; rarely needed (no reference, overlapping) → remove.

**Report** ranked by token savings: total overhead, per-surface breakdown, top-3 optimizations with estimated tokens reclaimed. Verbose mode adds per-file counts and side-by-side duplicated lines.

## Best practices

- Audit after every component addition — creep is invisible until it isn't.
- Bloated frontmatter descriptions are a permanent tax; body bloat is only paid on invocation. Fix descriptions first.
- Don't compact to "tidy up" mid-implementation — the table above is the contract.
