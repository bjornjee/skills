# bjornjee-skills

Personal skills, agents, and rules for Claude Code and Codex.

The packaged skills plugin is pure configuration — **rules, skills, and agents only**. The global Codex setup is self-contained in this repository; `scripts/` contains the sync tooling and repository-maintenance tests.

## Related plugins

Dashboard lifecycle hooks and generic dashboard workflows remain available from the separate [bjornjee/agent-dashboard](https://github.com/bjornjee/agent-dashboard) plugin, but they are not required or installed by this repository. This repository ships its own proportional-proof `tdd-guide` and destructive-command safety hook.

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
| `/agentic-engineering` | Eval-first execution, decomposition, model routing, and inter-agent trust boundaries |
| `/ai-ml-patterns` | Eval-first AI/ML engineering — RAG, finetune-vs-RAG-vs-prompt, injection defense (lockstep copy of the `ai-ml.md` rule) |
| `/api-design` | Resource modeling, pagination, error envelopes, versioning, idempotency |
| `/claude-api` | Claude API judgment — model selection, tool-loop failure modes, caching, cost |
| `/codegraph-audit` | Call-graph-aware pre-PR review via the local codegraph CLI (on demand) |
| `/codex-delegate` | Plan → Delegate → Review → Rectify handoff to Codex CLI |
| `/context-management` | When to compact + auditing what consumes the context window |
| `/create-linear-issue` | Create and verify one Linear implementation issue from a repository-bound task contract |
| `/data-modeling` | Constraint-first schemas, query-shape indexing, expand/contract migrations, tenancy |
| `/design-presentations` | Design editable decks with user-directed modes, styles, templates, and visual QA |
| `/distributed-systems` | Idempotent consumers, retry discipline, outbox, poison messages, backpressure |
| `/fastapi-patterns` | FastAPI service-layer conventions (lockstep copy of the `fastapi.md` rule) |
| `/git-workflow` | Branching strategy decisions, bisect protocol, multi-worktree discipline, CODEOWNERS |
| `/github-ops` | GitHub operations via `gh` — triage, CI debugging, releases, reusable workflows |
| `/golang-patterns` | Go concurrency, context discipline, module boundaries, reliability |
| `/golang-testing` | Go integration/race/parallel testing beyond the basics |
| `/hookify-rules` | Create hookify rules and configure hook syntax (ECC plugin format) |
| `/incident-response` | Mitigate-first incident handling, severity ladder, blameless postmortems |
| `/mcp-server-patterns` | MCP servers — tool-description engineering, error contracts, sandboxing |
| `/observability` | Structured-log contracts, RED metrics, trace propagation, SLO-first alerting |
| `/ponytail` | Forces the laziest solution that actually works (YAGNI, stdlib-first) |
| `/python-patterns` | Python style, typing, concurrency, and tooling conventions (lockstep copy of the `python.md` rule) |
| `/react-native-patterns` | React Native engineering + worktree isolation (lockstep copy of the `react-native.md` rule) |
| `/regex-vs-llm-structured-text` | Decision framework for choosing between regex and LLM for parsing |
| `/search-first` | Research-before-coding workflow with supply-chain checks |
| `/security-design` | Design-time security — threat modeling, secrets, authn/z placement |
| `/terminal-ops` | Evidence-first repo execution with destructive-command guardrails |
| `/typescript-patterns` | TypeScript/Node conventions (lockstep copy of the `typescript.md` rule) |
| `/uiux-design-loop` | Two-loop UI/UX discipline with a cold-context grader (requires `impeccable`) |

## Agents

| Agent | Description |
|-------|-------------|
| `go-reviewer-strict` | Strict Go code reviewer enforcing evidence-based principles from CLAUDE.md/AGENTS.md |
| `performance-optimizer` | Profile-first optimization for Go/Python/Node with CI regression budgets |
| `python-reviewer-strict` | Strict Python code reviewer enforcing evidence-based principles |
| `refactor-cleaner` | Dead-code cleanup with semantic-equivalence proof (stack-aware: Go/Python/JS) |
| `tdd-guide` | Proportional-proof guide (Surgical/Targeted/Full profiles, RED → GREEN → REFACTOR) |
| `typescript-reviewer-strict` | Strict TypeScript/Node reviewer mirroring the Go/Python contract |
| `uiux-grader` | Cold-context UI/UX grader — internal to `/uiux-design-loop`, never invoked standalone |

## Rules

| File | Scope | Description |
|------|-------|-------------|
| `core.md` | All | Doctrine: workflow gates, decision discipline, architecture judgment, dispatch |
| `python.md` | `**/*.py` | PEP 8, Pydantic v2, concurrency model, tooling |
| `golang.md` | `**/*.go` | Idiomatic Go, shutdown sequencing, slog |
| `fastapi.md` | `**/*.py` | Service layer, DI, background work, pagination, authz placement |
| `typescript.md` | `**/*.ts{,x}` | Strict compiler, parse-don't-cast, promise hygiene, ESM |
| `react-native.md` | `**/*.ts{,x}` | RN engineering, Expo, worktree isolation |
| `ai-ml.md` | `**/evals/**`, `**/prompts/**` | Evals, RAG, injection defense, routing |
| `shell.md` | `**/*.sh` | Bash safety non-negotiables |

Run `make sync-rules` (wraps `scripts/install-rules-symlinks.sh`) to symlink these into `~/.claude/rules/` so Claude Code loads them at user scope. Because they are symlinks, later edits in the repo propagate automatically.

The `python.md`, `fastapi.md`, `react-native.md`, `ai-ml.md`, and `typescript.md` rule bodies are mirrored 1:1 by the matching `*-patterns` skills (so Codex gets the same content); `scripts/language-skills.test.js` enforces the lockstep.

## Codex Setup

This repo includes configuration for [OpenAI Codex CLI](https://github.com/openai/codex) so you can install the same workflow skills in Codex or delegate isolated coding tasks from Claude Code.

### Install globally in native or Cloud Codex

Clone this repository and install the coding skills, global rules, compatible
subagents, and repository-owned safety hook directly into Codex:

```bash
git clone https://github.com/bjornjee/skills.git "$HOME/skills"
cd "$HOME/skills"
make sync-codex
make sync-codex ARGS=--check
```

Use the same path for maintenance:

```bash
cd "$HOME/skills"
git pull --ff-only
make sync-codex
make sync-codex ARGS=--check
```

The sync uses Codex's native global locations under `~/.agents/skills` and
`~/.codex`. It preserves unrelated peer skills, agents, and hooks while keeping
repository-owned payloads deterministic; a path-validated ownership manifest at
`~/.codex/bjornjee-skills-manifest.json` distinguishes retired managed entries
from unrelated user entries. The installed `warn-destructive` hook blocks common
destructive shell commands and fails closed on invalid hook input. Review and
trust the installed user hook with `/hooks` when Codex asks.

The global worktree rule derives the destination from the source checkout's
parent, matching agent-dashboard: `<workspace>/<repo>` maps to
`<workspace>/worktrees/<repo>/<branch-leaf>`. For example,
`~/Code/bjornjee/skills` uses `~/Code/bjornjee/worktrees/skills/...`, while a
repo under `~/Code/tomoro` keeps its worktrees under
`~/Code/tomoro/worktrees/...`. If Codex is already running in a linked
worktree, it reuses that worktree instead of nesting another one.

Codex app-managed worktrees use the Worktree root configured under
**Settings > Worktrees**. Use a manually created worktree as a local project
when the exact source-relative layout is required; both forms remain ordinary
Git worktrees and support normal commits, pushes, and PRs.

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

To install the always-on Codex doctrine globally, run `make sync-codex` from the skills repo. The same command installs the global skills, guardrail registrations, and compatible agents.

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
