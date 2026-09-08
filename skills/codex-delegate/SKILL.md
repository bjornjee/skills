---
name: codex-delegate
description: Delegate coding tasks to a configured, supported Codex model with a structured plan handoff. Use after planning is complete and the Codex CLI plugin is installed — pass the plan directly to Codex for implementation.
---

# Codex Delegation

Delegate implementation to Codex CLI after planning with Claude. The plan is the context handoff.

Claude plans and retains review responsibility; the configured, supported Codex model implements the approved plan.

## When to Activate

- Plan is approved and ready for implementation **in a worktree** (never from the main checkout)
- Approaching or hit Claude Code usage limits
- Parallel workstreams — delegate implementation to Codex while continuing other work

**Prerequisites:**

- The Codex CLI plugin must be installed — every `/codex:*` command below ships with it. Verify with `/codex:setup` (or `/codex:status`); without the plugin this skill cannot run.
- The session must be in a git worktree (`git rev-parse --show-toplevel` differs from the main repo root). The feature skill creates worktrees — delegation happens inside them. Do not delegate from the main checkout.

## Core Workflow: Plan → Delegate → Review → Rectify

Claude is the orchestrator throughout. It holds the plan, dispatches to Codex, reviews the output, and makes corrections. No context is lost — Claude's session persists across all phases.

```
Claude plans → Codex implements → Claude reviews (strict) → Claude rectifies
     |                |                    |                       |
  [plan in session] [diff comes back] [plan + diff + rules]  [full context]
```

### 1. Plan with Claude (already done)

Use Claude's plan mode to design the implementation. The plan should include:
- What to build and why
- Files to create or modify
- Architecture decisions and patterns to follow
- Verification criteria (test commands, acceptance checks)

### 2. Convert Plan to Codex Prompt

Transform the approved plan into a structured operator prompt:

```xml
<task>
[Paste or summarize the approved plan. Include specific files, functions,
and architectural decisions. Reference existing patterns in the codebase.]
</task>

<constraints>
[Scope limits from the plan. Files to leave untouched. Patterns to follow.
"Do not modify files outside [scope]." "Follow the pattern in [file]."]
</constraints>

<verification>
[Exact commands to prove success. Copy from the plan's verification section.]
make test
go test -race ./...
npm run lint && npm test
</verification>

<context>
[Only if needed: rejected approaches, domain knowledge, prior decisions
that aren't obvious from the codebase.]
</context>
```

### 3. Delegate

Resolve the active `codex@openai-codex` installation for the current workspace from the runtime's plugin catalog and installed-plugin metadata (`$HOME/.claude/plugins/installed_plugins.json`). Metadata can contain multiple scope-specific entries: use the installation selected by the runtime, not the first array entry. Set `CODEX_PLUGIN_ROOT` to that entry's absolute `installPath` and verify `"$CODEX_PLUGIN_ROOT/scripts/codex-companion.mjs"` exists. If a single active installation cannot be identified, have Claude implement the approved plan directly. Do not use this skill's `CLAUDE_PLUGIN_ROOT`, derive a cache path, or guess a plugin version.

This transport is verified against `codex@openai-codex` 1.0.3. Before use, verify that the selected helper supports `task --json --write --cwd --background --prompt-file`, `status --json --cwd --wait --timeout-ms`, and `result --json --cwd`. If it does not, have Claude implement the approved plan directly; do not install, upgrade, or substitute a recency-based wrapper.

Put the structured prompt in a concrete `PROMPT_FILE`, then dispatch:

```
node "$CODEX_PLUGIN_ROOT/scripts/codex-companion.mjs" task \
  --write --background --cwd "$(pwd)" --json --prompt-file "$PROMPT_FILE"
```

- `--write` is **required** — it sets Codex's sandbox to `workspace-write`. Without it, Codex runs read-only and cannot modify files.
- `--cwd "$(pwd)"` is **required when running in a worktree** — it sets the helper's and Codex's working directory (and therefore its writable root) to the worktree path. Without it, Codex resolves its writable root from the Claude Code session's original `process.cwd()`, which is the main repo — blocking writes to the worktree.
- Save `JOB_ID` from the JSON response's `jobId`. It is the stable handle for this dispatch.

### 4. Strict Review (Claude)

When Codex finishes, Claude reviews the output using strict reviewers. This is the quality gate.

```
node "$CODEX_PLUGIN_ROOT/scripts/codex-companion.mjs" status \
  --cwd "$(pwd)" --wait --timeout-ms 30000 --json "$JOB_ID"
```

Check the status response's `job.id` matches `JOB_ID`. If `waitTimedOut` is true and the job is still queued or running, wait again on the same ID within the task's execution budget; do not fetch a result yet. A completed status permits the result lookup below. Unknown IDs, failed/cancelled jobs, malformed responses, or exhausted budget require reporting the actual state; never switch to another job.

```
node "$CODEX_PLUGIN_ROOT/scripts/codex-companion.mjs" result \
  --cwd "$(pwd)" --json "$JOB_ID"
```

In the result response, require `job.id === JOB_ID`, `storedJob.id === JOB_ID`, `job.status === "completed"`, and a nonempty `storedJob.threadId`; then capture it as `THREAD_ID`. Its `storedJob.result.rawOutput` is the implementation output. For an unknown, active, failed, cancelled, or malformed result, stop and report that result rather than reviewing or selecting another job. Do not call `result` without `JOB_ID`, or use a latest/recent task lookup: those do not establish task identity.

Then run the appropriate strict reviewers on the changed files:

- **Go files changed** → spawn `go-reviewer-strict` with the diff and file paths
- **Python files changed** → spawn `python-reviewer-strict` with the diff and file paths
- **TypeScript/Node files changed** → spawn `typescript-reviewer-strict` with the full review scope
- **Other files changed** → review their declared contracts directly; do not require an unavailable generic reviewer

Review against the **original plan** — does the implementation match what was approved?

Reviewers check:
- Correctness: does it do what the plan says?
- Convention adherence: does it follow project patterns?
- Security: injection, auth, input validation issues?
- Test coverage: are tests present and meaningful?
- Scope: did Codex stay within the constraints?

### 5. Rectify (Claude)

Claude fixes any issues found by the reviewers. This is where Claude's advantages matter:
- Full session context (plan + review findings + conversation history)
- Access to MCP tools and plugins
- Can make surgical fixes informed by the review

For minor issues (formatting, naming, missing error wraps):
- Claude fixes directly — faster than re-delegating to Codex

For significant issues (wrong approach, missing feature, architectural mismatch):
- Either fix in Claude, or re-delegate to Codex with specific feedback:
  ```
  codex exec resume "$SESSION_ID" "Review found these issues: [paste findings]. Fix them."
  ```
  Set `SESSION_ID` to the `THREAD_ID` captured from the matching `JOB_ID` result and resume that exact ID. Never use `--last`, `--resume-last`, or a recency lookup as task identity. Session resumption preserves the original implementation context.

### 6. Integrate

After review passes:
- Run tests one final time
- Commit with conventional commit message
- Cherry-pick or merge from worktree if isolated

## Plan-to-Prompt Examples

### Feature Implementation

Plan says: "Add a `/health` endpoint to the API service. Use the existing handler pattern in `internal/handler/user.go`. Register in `cmd/server/main.go`. Add table-driven tests."

```xml
<task>
Add a /health endpoint to the API service.
- Create internal/handler/health.go with a HealthHandler following the pattern in internal/handler/user.go
- Register the route in cmd/server/main.go alongside existing handlers
- Add table-driven tests in internal/handler/health_test.go
</task>
<constraints>
Follow existing handler pattern exactly. Do not modify other handlers.
Do not add dependencies.
</constraints>
<verification>
go test -race ./internal/handler/...
go build ./cmd/server
</verification>
```

### Bug Fix

Plan says: "The ParseConfig function panics on empty input. Add a nil check before unmarshaling. The root cause is line 42 in `internal/config/parser.go`."

```xml
<task>
Fix panic in internal/config/parser.go:42 — ParseConfig panics on empty input.
Add a nil/empty check before json.Unmarshal. Return a descriptive error.
Add a test case for empty input to the existing table-driven test in parser_test.go.
</task>
<constraints>
Minimal fix. Do not refactor surrounding code.
</constraints>
<verification>
go test -race ./internal/config/...
</verification>
```

### Refactor

Plan says: "Extract the database connection logic from `cmd/server/main.go` into `internal/db/connect.go`. Use functional options for configuration. Update main.go to call the new function."

```xml
<task>
Extract database connection logic from cmd/server/main.go (lines 45-89) into
internal/db/connect.go. Use the functional options pattern (see internal/server/server.go
for an example). Export a single NewConnection(opts ...Option) (*sql.DB, error) function.
Update cmd/server/main.go to use it.
</task>
<constraints>
All existing tests must pass. No new dependencies. Keep the same connection behavior.
</constraints>
<verification>
go test -race ./...
go build ./cmd/server
</verification>
```

### Multi-File Feature

Plan says: "Implement user notification preferences. Add a preferences model, repository, service method, and API endpoint. Follow the existing user module as a template."

```xml
<task>
Implement notification preferences following the user module pattern:
1. internal/model/preferences.go — PreferencesModel with fields: UserID, EmailEnabled, PushEnabled
2. internal/repository/preferences.go — CRUD operations, same interface pattern as user_repository.go
3. internal/service/preferences.go — Business logic, validate before save
4. internal/handler/preferences.go — REST endpoints: GET/PUT /users/{id}/preferences
5. cmd/server/main.go — Register the new handler
6. Tests for each layer following existing test patterns
</task>
<constraints>
Follow the user module structure exactly. Same error handling, same DI pattern.
Do not modify existing user module files.
</constraints>
<verification>
go test -race ./...
go build ./cmd/server
</verification>
<context>
Architecture uses service-layer pattern: handler -> service -> repository.
All dependencies injected via constructor. Interfaces defined at consumer site.
</context>
```

### Migration

Plan says: "Migrate all error handling in `internal/service/` from string errors to wrapped errors with `fmt.Errorf` and `%w`."

```xml
<task>
Migrate error handling in all files under internal/service/:
- Replace errors.New("...") returns with fmt.Errorf("operation: %w", err) wrapping
- Replace bare error returns with context-wrapped versions
- Ensure every error path includes the function name and relevant context
- Follow the pattern already used in internal/service/auth.go
</task>
<constraints>
Error messages only. Do not change function signatures, logic, or control flow.
All existing tests must pass unchanged.
</constraints>
<verification>
go test -race ./internal/service/...
go vet ./internal/service/...
</verification>
```

## Companion Helper Effort and Model Options

These are options consumed by the declared companion helper, not native Codex CLI configuration. The helper/version provenance remains the one declared above.

| Task Type | Flag | When |
|---|---|---|
| Quick fix, small change | `--effort low` | < 5 min tasks |
| Standard implementation | Omit overrides | Use the verified helper/runtime configuration |
| Complex multi-file feature | `--effort high` | Architectural work |
| Critical/security-sensitive | `--effort xhigh` | Use when task risk warrants a higher supported effort |
| Fast iteration/scaffolding | `--model <supported-model>` | Select a model supported by the selected transport |

Before selecting a model or effort, inspect the selected helper's accepted options and the current runtime's advertised capabilities. Native Codex CLI configuration uses its own syntax; verify it separately. Do not assume a `codex models` subcommand exists.

## Available Commands

| Command | Purpose |
|---|---|
| `/codex:rescue --write -C "$(pwd)" <task>` | Delegate implementation to Codex |
| `/codex:review` | Code review from Codex |
| `/codex:adversarial-review <focus>` | Challenge review (race conditions, edge cases) |
| `/codex:status` | Check running jobs |
| `/codex:result` | Get output + session ID for resumption |
| `/codex:cancel` | Stop a running job |
