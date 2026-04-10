---
name: codex-delegate
description: Delegate coding tasks to Codex CLI (GPT-5.4) with a structured plan handoff. Use after planning is complete — pass the plan directly to Codex for implementation.
---

# Codex Delegation

Delegate implementation to Codex CLI after planning with Claude. The plan is the context handoff.

GPT-5.4 matches or exceeds Claude Opus 4.6 on agentic coding benchmarks (SWE-bench Pro: 59% vs 52%, Terminal-Bench: 75% vs 65%). Claude plans, Codex implements.

## When to Activate

- Plan is approved and ready for implementation
- Approaching or hit Claude Code usage limits
- Parallel workstreams — delegate implementation to Codex while continuing other work

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

```
/codex:rescue --background "<structured prompt>"
```

Use `--wait` instead of `--background` if the task is quick (<2 min).

### 4. Strict Review (Claude)

When Codex finishes, Claude reviews the output using strict reviewers. This is the quality gate.

```
/codex:result              # get output + session ID
```

Then run the appropriate strict reviewers on the changed files:

- **Go files changed** → spawn `go-reviewer-strict` with the diff and file paths
- **Python files changed** → spawn `python-reviewer-strict` with the diff and file paths
- **Any files changed** → spawn `code-reviewer` for general correctness

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
  codex exec resume --last "Review found these issues: [paste findings]. Fix them."
  ```
  Session resumption preserves Codex's full context from the original implementation.

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

## Isolation Options

| Method | When | Setup |
|---|---|---|
| Same checkout | Not coding in parallel | Default |
| Git worktree | Parallel — keep coding while Codex works | `git worktree add ../codex-work -b codex/task main` then `codex exec --cd ../codex-work "..."` |
| Git branch | Sequential — Codex finishes before you resume | `git checkout -b codex/task` |

## Effort and Model Selection

| Task Type | Flag | When |
|---|---|---|
| Quick fix, small change | `--effort low` | < 5 min tasks |
| Standard implementation | (default medium) | Most tasks |
| Complex multi-file feature | `--effort high` | Architectural work |
| Critical/security-sensitive | `--effort xhigh --profile strict` | Maximum compliance |
| Fast iteration/scaffolding | `--model gpt-5.3-codex-spark` | Boilerplate |

## Available Commands

| Command | Purpose |
|---|---|
| `/codex:rescue <task>` | Delegate implementation to Codex |
| `/codex:review` | Code review from Codex |
| `/codex:adversarial-review <focus>` | Challenge review (race conditions, edge cases) |
| `/codex:status` | Check running jobs |
| `/codex:result` | Get output + session ID for resumption |
| `/codex:cancel` | Stop a running job |
