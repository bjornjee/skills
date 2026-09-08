---
name: golang-patterns
description: Use when writing or reviewing Go concurrency, context handling, module boundaries, or reliability code — errgroup, worker pools, goroutine-leak avoidance, retry and circuit-breaking. Falsifiable rules, not idiom lists.
---
# Go Patterns

Read [Go basics](references/basics.md) for the shared language conventions. This skill adds bounded concurrency, context, and reliability decisions.

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
Normal completion: producers close `jobs` → workers drain → `wg.Wait()` → close `results`. Cancellation interrupts idle receives and output sends; `process(ctx, job)` must honor the context. The caller validates a positive worker count and owns producer shutdown. Closing `results` before `wg.Wait()` panics a still-running worker on send; skipping the `jobs` close deadlocks the drain.

```go
func run(ctx context.Context, jobs <-chan Job, n int) <-chan Result {
    if n < 1 {
        panic("worker count must be positive") // caller configuration invariant
    }
    results := make(chan Result)
    var wg sync.WaitGroup
    wg.Add(n)
    for range n {
        go func() {
            defer wg.Done()
            for {
                var j Job
                select {
                case <-ctx.Done():
                    return
                case job, open := <-jobs:
                    if !open { return }
                    j = job
                }
                if ctx.Err() != nil { return }
                result := process(ctx, j) // processing must honor cancellation too
                select {
                case results <- result:
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
- Deadline vs timeout: `WithDeadline` when the budget is absolute (a request must finish by a wall-clock T shared across hops); `WithTimeout` when it's relative to now. A timeout derived from the parent cannot extend the parent’s deadline. Deriving from `context.Background()` instead would lose that cancellation/budget; propagate the parent. See [context.WithDeadline](https://pkg.go.dev/context#WithDeadline).
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
