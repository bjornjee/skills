# Go: capability packages and supplied dependencies

This reference extracts intent from the user's scaffold at `52137d6`; its directories
are largely placeholders, not an audited Go application. Preserve existing package
boundaries that serve the actual consumers.

## Scaffold structure and what it means

```text
cmd/server/              Entrypoint
internal/
  domain/                Domain concepts
  models/                Boundary data structures
  services/              Application orchestration
  clients/               External dependencies
  mocks/                 Scaffold's test doubles
  utils/                 Scaffold's helpers
```

The useful intent is a small entrypoint and separately owned domain, orchestration,
and external behavior. These exact global layer packages are not required. Cohesive
capability packages can own their types, operations, and adapters together; a small
command can remain in one package. Do not pre-create mocks/utilities or duplicate
one concept into domain and models solely to match the scaffold.

## Establish the actual boundary

Let a capability expose operations that preserve its invariants. HTTP handlers,
jobs, and commands call those operations instead of duplicating rules. Keep transport
translation separate from substantial domain policy. When a consumer needs a boundary,
define the smallest interface it uses near that consumer and pass the implementation
to its owner at startup. Concrete dependencies suffice when no substitution or
independent ownership is required.

The scaffold shows a package-level client and `SetTestClient` that replaces it for
tests. Do not copy that pattern: unrelated callers would share mutable selection.
Its actual external-client contract is:

```go
type HTTPClient interface {
    Do(req *http.Request) (*http.Response, error)
}
```

Retain the dependency contract where the actual consumer needs it, but pass the
client to that owner instead of changing package state. This wiring change is a
proposed correction, not an observed scaffold implementation. Prefer domain-level
operations when the consumer needs domain behavior rather than generic HTTP access.
Do not introduce interfaces around every helper or mandate mock generation. Test
doubles isolate behavior; real integration checks still matter.

Keep dependencies acyclic. Resolve a cycle by correcting ownership rather than moving
unrelated types into a shared package. Split modules for actual consumer/versioning
or distribution needs, never to mirror agent assignments. Concurrency requires explicit
context, cancellation, and resource ownership under the applicable Go guidance.

## Demonstrate the separation

For a requested independently tunable or replaceable dependency, supply another
relevant implementation to the operation and exercise success, failure, and cancellation
as applicable. Trace intended entrypoints to the same policy owner. Test relevant
domain invariants under permitted concurrency where applicable, rather than treating
mocks as proof of storage behavior. Do not create speculative providers for this example.

Do not inherit the scaffold's blanket mocking rule or platform-specific build recipes
as universal requirements. Use the project's existing Go proof commands.

## Source provenance

[Go scaffold](https://github.com/bjornjee/scaffold-templates/blob/52137d61f758739d50c9dade0d8ed0ce8dcbd236/golang-server/README.md).
The ownership rules and instance-injection correction are proposed adaptations;
no populated Go application was inspected for this reference.
