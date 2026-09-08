---
name: context-management
description: Use when deciding whether/when to compact the session, or when auditing what is consuming the context window (agents, skills, MCP servers, rules). Compaction timing + token-budget audit in one place.
---
# Context Management

Two halves of one problem: **when** to compact without losing task continuity, and **what** is consuming the active runtime's context.

## When to compact — phase boundaries, not thresholds

If context pressure warrants compaction, prefer a logical phase boundary. These are opportunities, not instructions to compact after every phase:

| Phase transition | Compact? | Why |
|-----------------|----------|-----|
| Research → Planning | Consider | Preserve relevant evidence and unresolved questions before summarizing |
| Planning → Implementation | Consider | Preserve the agreed plan, constraints, and proof commands first |
| Implementation → Testing | Maybe | Keep if tests reference recent code; compact if switching focus |
| Debugging → Next feature | Consider | Preserve the diagnosis and verification before discarding traces |
| Mid-implementation | No | Losing variable names, paths, and partial state is costly |
| After a failed approach | Consider | Preserve what failed and why so the next attempt does not repeat it |

What the runtime retains or summarizes varies. Files and git state persist, but reloading them and preserving conversational constraints are separate responsibilities. Before compacting, preserve the active request, accepted decisions, constraints, evidence, failed approaches, and next step in the runtime's supported handoff mechanism. Use `/compact <focus message>` when that command is available.

## Optional reminder hook

The skill works on demand. The plugin does not register this optional hook. For Claude Code on macOS/Linux with Bash and Python 3, first resolve the installed skill's absolute path and verify `suggest-compact.sh` and its adjacent `scripts/suggest_compact.py` exist. Under the user's existing installation authority, replace the example path below and merge this entry into the selected Claude settings without replacing unrelated hooks:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Edit|Write", "hooks": [{ "type": "command", "command": "bash '/absolute/path/to/context-management/suggest-compact.sh'", "timeout": 5 }] }
    ]
  }
}
```

The helper reads the documented stdin `session_id`, counts matching tool invocations, and emits agent-facing PreToolUse JSON context at `COMPACT_THRESHOLD` (a positive integer, default 50), then every 25 invocations after that threshold. It never invokes compaction itself. Verify a reminder through the actual runtime before claiming successful hook setup; captured stderr is not agent-facing evidence. See the [Claude hook input/output contract](https://code.claude.com/docs/en/hooks).

State is one small hashed-session counter under `${XDG_STATE_HOME:-$HOME/.local/state}/bjornjee-skills/compact`. The base must be absolute; path components must not be symlinks. State directories and files must be user-owned and private. Symlinked or hard-linked counters are refused. No old `/tmp/claude-tool-count-*` files are read, migrated, or deleted.

Each invocation reads at most 1 MiB of input and 32 bytes of counter state. Malformed input, unsafe state, missing Python, and lock contention skip the optional reminder without blocking a tool. Counts are approximate under contention or interrupted writes; corrupt numeric state resets the count. Counters persist across resumes and are not automatically scanned or pruned. Cleanup, if requested, is limited to identified session counters when those sessions have stopped.

## Auditing the window

Run when the session feels sluggish, after adding components, or before adding more.

**Inventory** what the active runtime actually loads. `words × 1.3` for prose and `chars / 4` for code are rough estimates, not measured token counts. The size cues below identify inspection candidates, not removal thresholds:
- **Agents** (`agents/*.md`) — inspect files >200 lines or descriptions >30 words; distinguish advertised metadata from bodies loaded only on delegation.
- **Skills** (`skills/*/SKILL.md`) — inspect bodies >400 lines; distinguish the active catalog from loaded bodies and avoid counting one installation twice.
- **Rules** (`.claude/rules/*.md`) — flag >100 lines; detect overlap between rule files and CLAUDE.md.
- **MCP servers** — measure exposed schema size and account for deferred tool loading. Inspect overlap with existing capabilities without assuming a CLI and connector have equivalent permissions or behavior.
- **CLAUDE.md chain** — flag combined >300 lines.

**Classify** each component: always needed (referenced by doctrine/commands/project type) → keep; sometimes needed (domain-specific) → on-demand; rarely needed (no reference, overlapping) → remove.

**Report** ranked by token savings: total overhead, per-surface breakdown, top-3 optimizations with estimated tokens reclaimed. Verbose mode adds per-file counts and side-by-side duplicated lines.

## Best practices

- Audit after every component addition — creep is invisible until it isn't.
- Bloated frontmatter descriptions are a permanent tax; body bloat is only paid on invocation. Fix descriptions first.
- Preserve task continuity; do not compact just to satisfy the table or remove context solely to hit a size cue.
