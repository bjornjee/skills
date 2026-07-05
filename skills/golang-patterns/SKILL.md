---
name: golang-patterns
description: Use when writing or reviewing Go concurrency, context handling, module boundaries, or reliability code — errgroup, worker pools, goroutine-leak avoidance, retry and circuit-breaking. Falsifiable rules, not idiom lists.
---
# Go Patterns

The layer above `.claude/rules/golang.md`. The rule owns the basics — interfaces at the consumer, error wrapping, one lifetime owner per goroutine, the shutdown sequence. This file owns the decisions it doesn't make: how to *run* concurrency, where module seams go, how to survive flaky dependencies. Every rule is checkable in review.

## Concurrency

### errgroup over hand-rolled fan-in
- Multiple goroutines that can each fail ⇒ `errgroup.WithContext`. First error cancels the shared context; `g.Wait()` returns it. Re-implementing this with an error channel + `WaitGroup` is a re-implementation of stdlib-adjacent code — BLOCK in review.
- Bound it with `g.SetLimit(n)`. Unbounded fan-out over unbounded input (rows, files, URLs) exhausts FDs and memory — that is a bug, not a tuning knob.
- Write to disjoint slots (`results[i]`), never `append`, from inside `g.Go`. Shared `append` races.

```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(8)
results := make([]Result, len(urls))
for i, url := range urls {
    g.Go(func() error {
        r, err := fetch(ctx, url) // ctx cancels the instant any sibling errors
        if err != nil {
            return fmt.Errorf("fetch %s: %w", url, err)
        }
        results[i] = r
        return nil
    })
}
if err := g.Wait(); err != nil {
    return nil, err
}
```
(Go 1.22+: loop vars are per-iteration — no `i, url := i, url` shim.)

### Goroutine leaks: the send that never returns
- A goroutine sending on a channel leaks the instant its receiver disappears (caller returned, ctx cancelled). Every send in a spawned goroutine is either buffered-for-what-you-send or wrapped in `select { case ch <- v: case <-ctx.Done(): }`.
- Buffer size = number of values you may send when nobody is guaranteed to be listening. A one-shot result channel is `make(chan T, 1)`.

```go
ch := make(chan Result, 1) // buffered: goroutine sends and exits even if caller gave up
go func() {
    r, err := work()
    if err != nil {
        return
    }
    select {
    case ch <- r:
    case <-ctx.Done():
    }
}()
```

### Bounded worker pool — teardown order is load-bearing
Order: close `jobs` (producers done) → workers drain via `range` → `wg.Wait()` → close `results`. Closing `results` before `wg.Wait()` panics a still-running worker on send; skipping the `jobs` close deadlocks the drain.

```go
func run(ctx context.Context, jobs <-chan Job, n int) <-chan Result {
    results := make(chan Result)
    var wg sync.WaitGroup
    wg.Add(n)
    for range n {
        go func() {
            defer wg.Done()
            for j := range jobs { // drains until jobs is closed
                select {
                case results <- process(j):
                case <-ctx.Done():
                    return
                }
            }
        }()
    }
    go func() { wg.Wait(); close(results) }() // close AFTER every worker has exited
    return results
}
```
When NOT to pool: CPU-bound work over a small, finite slice is simpler and equivalent as `errgroup` + `SetLimit(runtime.GOMAXPROCS(0))`. A channel-fed pool earns its complexity only for a long-lived stream you can't hold in memory.

## Context discipline
- Deadline vs timeout: `WithDeadline` when the budget is absolute (a request must finish by a wall-clock T shared across hops); `WithTimeout` when it's relative to now. Wrapping a downstream call in a fresh `WithTimeout` inside an already-deadlined request silently extends the budget past the caller's deadline — propagate the deadline, don't reset it.
- Check `ctx.Err() != nil` before starting any expensive or irreversible unit (a batch, a remote call) — the caller may have cancelled while you sat in a queue. Cheap check, skips a doomed call.
- Never store `context.Context` in a struct field. First argument, always. Exception: request-scoped types whose lifetime *is* the request (`*http.Request`, a per-RPC handler object) may hold it — say so in a comment so the reviewer doesn't flag it.
- Context values only for request-scoped, cross-cutting data that rides the whole call tree: trace/correlation IDs, auth principal. Never for optional parameters (those are function args). The key must be an unexported package-local type (`type ctxKey int`) so no other package can collide with or read it.

## Module boundaries
- `internal/` by default. It's compiler-enforced privacy; anything not deliberately public lives there.
- `pkg/` is a directory name, not a blessing. Moving code under `pkg/` does not make it a supported API — it only removes the `internal/` guard rail. Export only what you will maintain.
- One module per repo until release cadence *actually* diverges. A second `go.mod` is justified only when a component must be versioned and released independently — otherwise it's `go.work` friction and dependency skew for no gain.
- Breaking change ⇒ new major ⇒ `/v2` module-path suffix, and *every* importer rewrites their import path. That import-path tax is real: prefer additive change (new optional field, new function) and reserve majors for genuine incompatibility.

## Reliability
- Retry only idempotent operations, with exponential backoff **and jitter** — uncoordinated retries thundering-herd a recovering dependency. Put retry behind an interface so tests inject a fake clock; a retry loop with a real `time.Sleep` is untestable and violates the I/O-behind-interfaces rule.
- More than one flaky dependency ⇒ adopt a library (`failsafe-go`) for retry + circuit-breaker + timeout composition. Hand-rolled breakers get the half-open state wrong. Battle-tested over hand-rolled.
- A breaker's job is to fail fast while a dependency is down so you stop queuing doomed work — pair it with the `ctx.Err()` pre-check above so cancelled callers never enter the breaker at all.

## When NOT to reach for concurrency
Sequential is the default. Add goroutines only when there is real I/O overlap or independent CPU work to win, and only after a profile says the serial path costs you. Concurrency added "to be fast" on a sub-millisecond path buys race conditions and a harder-to-read function for no measured gain.
