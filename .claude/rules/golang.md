---
paths:
  - "**/*.go"
---
# Go

Loads when editing Go. Generic + my preferences flattened. Project-specific
rules (e.g. agent-dashboard's `Runner` interface, mockery patterns) belong in
each project's CLAUDE.md. Strict review enforcement lives in the
`go-reviewer-strict` agent.

## Style & types
- `gofmt` / `goimports` own formatting. Don't argue with the tool.
- Exported identifiers are commitments. Question every new one — prefer unexported or `internal/`.
- Interfaces declared at the consumer site, not the producer. Small interfaces (1–3 methods) over fat ones.
- No `init()` for non-trivial setup. Wire dependencies explicitly in `main`.

## Side effects & boundaries
- External I/O behind interfaces. Subprocess execution, file I/O, network, time, randomness — all reachable through an interface that tests can swap.
- `context.Context` as the first parameter for any function that does I/O or can be cancelled.
- No global mutable state. Package-level vars only for true constants.

## Errors
- Errors carry context: `fmt.Errorf("operation X: %w", err)`. Never return raw errors from internal calls.
- No silenced errors. No `_ = err`, no `if err != nil { return nil }`, no `if err != nil { log.Print(err) }` when the caller needed to know.
- Use `errors.Is` / `errors.As` for sentinel and typed-error checks.

## Concurrency
- Every `go func()` has a clear lifetime owner: a `context.Context`, a `sync.WaitGroup`, or a bounded channel that someone drains.
- Fan-out without fan-in is a bug. Background goroutines outliving their spawning function need an explicit "this is a daemon" comment.
- When two async sources can write the same state, exactly one is authoritative. State machines need explicit transition guards, not last-writer-wins.

## No fallbacks
- One implementation per feature. `if v1Format { ... } else { ... }` branches must be tied to a documented migration plan.

## Tests
- Table-driven tests with subtests (`t.Run`).
- Tests never touch the real world: no real network, no real subprocesses, no real filesystem outside `t.TempDir()`, no real wall clock, no real database.
- `-race` mandatory in CI.
