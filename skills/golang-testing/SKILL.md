---
name: golang-testing
description: Use when writing or reviewing Go tests — table-driven suites, golden files, fuzzing, benchmarks, race-exposing tests, testcontainers integration, or t.Parallel hazards. Falsifiable rules, not a tour of the testing package.
---
# Go Testing

The layer above `.claude/rules/golang.md` (which owns table-driven + subtests, no real-world I/O, `-race` in CI) and core doctrine (which owns the RED→GREEN→REFACTOR cadence — not repeated here). This file owns what those don't: which tool to reach for, and the traps that make Go tests flaky or falsely green.

## Table-driven: the non-obvious bits
The rule already mandates table + `t.Run`. Two things it doesn't:
- On an error case, set a `wantErr` sentinel and `return` early. Asserting on the result struct after an unexpected error produces a second, misleading failure that buries the real one.
- Name cases so a failure prints the scenario, not an index — `t.Run(tt.name, …)` gives you `TestX/empty_input` in output and as a `-run` filter.

## t.Parallel() hazards
`t.Parallel()` is where "passes locally, flakes in CI" is born.
- **Teardown timing (the live Go 1.22+ trap):** a parent test's body returns *before* its parallel children run, so a `defer cleanup()` or parent-level `t.Cleanup` fires while children still need the fixture. Register cleanup *inside each parallel subtest*, or own shared setup in `TestMain`. (The old `tt := tt` capture is a no-op now — loop vars are per-iteration.)
- **Env is process-global:** `t.Setenv` panics if the test also calls `t.Parallel`, precisely because one test's mutation would leak into concurrent siblings. A parallel test cannot use `t.Setenv` — inject config instead.
- **Shared state / fixtures:** two parallel tests mutating the same map, temp table, or singleton race even when `-race` happens to pass on one run. Give each its own namespace: `t.TempDir()`, a UUID-suffixed table, a fresh struct.

## TestMain for expensive shared setup
One container or migration for the whole package, not per-test.
```go
func TestMain(m *testing.M) {
    ctx := context.Background()
    pg, err := postgres.Run(ctx, "postgres:16") // testcontainers-go
    if err != nil {
        log.Fatalf("start postgres: %v", err)
    }
    testDSN = pg.MustConnectionString(ctx)
    code := m.Run()
    _ = pg.Terminate(ctx) // explicit: TestMain owns lifetime, not t.Cleanup
    os.Exit(code)
}
```
`m.Run()`'s exit code must reach `os.Exit`, and teardown goes *between* them — a `defer` after `os.Exit` never runs, so terminate explicitly.

## Unit vs integration vs neither — the decision
- **Neither:** pure function, no collaborators ⇒ table-driven unit test, done. Don't mock what you can call directly.
- **Unit with a fake:** collaborator is behind an interface (per the I/O rule) ⇒ hand-written fake with func fields. Reach for a mocking framework only when the interface is wide and call-order matters.
- **Integration:** the thing under test *is* the DB query, queue wiring, or SQL migration. Faking the DB tests your fake, not your SQL. Use a real Postgres/Redis via `testcontainers-go`, gated behind a build tag.

```go
//go:build integration

package store_test
```
Split the lanes: `go test ./...` (fast, every push) vs `go test -tags=integration ./...` (own CI lane, needs Docker). Never gate the fast lane on Docker being present.

The fake covers the 80% case with no framework:
```go
type fakeUsers struct{ get func(string) (*User, error) }

func (f fakeUsers) Get(id string) (*User, error) { return f.get(id) }
```

## Race-exposing tests
`-race` only reports races it actually *observes* at runtime — a test that never interleaves the goroutines proves nothing. Force the interleaving with a start gate:
```go
func TestCounter_Concurrent(t *testing.T) {
    var c Counter
    start := make(chan struct{}) // gate: line everyone up before releasing
    var wg sync.WaitGroup
    for range 100 {
        wg.Add(1)
        go func() {
            defer wg.Done()
            <-start   // block until the gate opens
            c.Inc()   // all 100 hit this near-simultaneously
        }()
    }
    close(start)      // release the herd
    wg.Wait()
    if c.Value() != 100 {
        t.Errorf("got %d, want 100", c.Value())
    }
}
```
Reading race output: two stacks — one `Read at` / one `Previous write at` (or write/write) — each naming the goroutine that did it *and the line where that goroutine was created*. Trace the "created at" lines to identify the two owners touching the address; the fix is almost always a lock or a single-owner redesign, per the rule's "exactly one is authoritative."

## Golden files
For large or structured output (rendered templates, formatted docs, serialized trees) where an inline `want` string is unreadable.
```go
var update = flag.Bool("update", false, "update .golden files")

golden := filepath.Join("testdata", tt.name+".golden")
if *update {
    if err := os.WriteFile(golden, got, 0o644); err != nil {
        t.Fatal(err)
    }
}
want, err := os.ReadFile(golden)
if err != nil {
    t.Fatal(err)
}
if !bytes.Equal(got, want) {
    t.Errorf("golden mismatch (run -update to accept):\n got: %s\nwant: %s", got, want)
}
```
Review the diff before committing an `-update` — a golden blindly regenerated locks in the very bug it was meant to catch.

## Fuzzing
For parsers, decoders, and any `[]byte`/`string` boundary. Assert *properties*, not specific outputs — the fuzzer feeds inputs you didn't imagine.
```go
func FuzzRoundTrip(f *testing.F) {
    f.Add([]byte(`{"a":1}`)) // seed; discovered crashers auto-save to testdata/fuzz/
    f.Fuzz(func(t *testing.T, b []byte) {
        v, err := Decode(b)
        if err != nil {
            return // rejecting malformed input is fine
        }
        out, err := Encode(v)
        if err != nil {
            t.Fatalf("re-encode after successful decode: %v", err)
        }
        if v2, _ := Decode(out); !reflect.DeepEqual(v, v2) {
            t.Errorf("round-trip changed the value")
        }
    })
}
```
Good properties: round-trip identity, never-panics, output-always-reparses, invariant-preserved. A crasher the fuzzer finds is saved under `testdata/fuzz/` — commit it, and it becomes a permanent regression case in the normal `go test` run.

## Benchmarks
```go
func BenchmarkEncode(b *testing.B) {
    v := build()      // setup before b.Loop() is auto-excluded from timing
    b.ReportAllocs()  // allocs/op is usually the real signal, not ns/op
    for b.Loop() {    // Go 1.24+: replaces the b.N loop + ResetTimer,
        _ = Encode(v) // and keeps v alive so the call isn't optimized away
    }
}
```
`ReportAllocs` is the easy-to-forget one that changes what you learn. Compare runs with `benchstat` over ≥6 counts — a single run's ns/op is noise. Optimize only what a benchmark or profile named, per the patterns "when NOT to reach for concurrency" rule.

## httptest
Handler tests need no socket: `httptest.NewRecorder` + `httptest.NewRequest`. For an outbound *client*, `httptest.NewServer` gives a real URL backed by a stub handler.
```go
req := httptest.NewRequest(http.MethodGet, "/users/123", nil)
rec := httptest.NewRecorder()
handler.ServeHTTP(rec, req)
if rec.Code != http.StatusOK {
    t.Fatalf("got %d, want 200", rec.Code)
}
```
