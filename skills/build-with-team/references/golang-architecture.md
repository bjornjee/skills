# Go architecture

Organize packages around cohesive capabilities. This is proposed guidance, not
an audited project template. Preserve existing boundaries that serve the application.

## Illustrative organization

```text
go.mod
cmd/server/main.go       Startup, dependency composition, shutdown
internal/
  <capability>/          Behavior and owned types; colocated *_test.go
  <integration>/         Shared external-system adapter, if needed
```

A small command can remain in one package. `cmd/` is a convention; `internal/`
has compiler-enforced import restrictions. Neither requires a catalogue of empty
services, models, repositories, and utility packages.
[Official Go layout guidance](https://go.dev/doc/modules/layout).

## Decisions that affect reuse

- Let the package that owns a capability expose its useful operations. HTTP handlers,
  jobs, and commands should call those operations rather than reproduce their rules.
- When a consumer needs an interface, define the smallest contract it uses near
  that consumer. Do not wrap every concrete dependency or generate mocks by default.
- Compose dependencies at startup. Avoid mutable package-level clients and test
  swap functions that make independent callers share hidden state.
- Keep package dependencies acyclic. Move code according to responsibility instead
  of introducing a catch-all shared package to break a cycle.
- Split modules for an actual versioning or distribution boundary, not to mirror
  agent assignments or architectural layers.

## Example: shared behavior without package sprawl

Suppose an HTTP handler and a scheduled job both reserve inventory. The inventory
package owns reservation rules and exposes the operation both call. Startup supplies
its dependencies; the handler translates request errors and the job owns retry policy.
Exercise both callers against the same stock constraints, including concurrent calls
if the application permits them.

Keep a concrete store dependency unless an actual consumer needs a narrower interface.
A small application can keep this behavior in one package; separate entrypoints do
not imply separate services or modules. This is a proposed example, not audited code.

## Evidence

Trace intended consumers to the owning package. Exercise operations through their
real entrypoints and verify cancellation and resource ownership where concurrency
is involved. Mocks can isolate a dependency but cannot establish that its actual
integration works. Use the project's existing Go verification conventions.
