# Rust: domain types, visibility, and ownership

No Rust application was present in the inspected scaffold, KPJ, or car-inspection
sources. This is proposed guidance, not an extracted or validated project template.
Use an existing coherent Rust layout rather than manufacturing a matching hierarchy.

A shared library entrypoint or workspace is appropriate only when consumers, build
requirements, or distribution need it. Private modules can separate responsibilities
within one binary. Do not add empty packages or a trait for every type.

## Boundaries that matter

- Domain types and operations own valid states and transitions. Reusable behavior
  should not depend on argument parsing, HTTP status handling, or runtime startup.
- Expose useful operations through deliberate module APIs; keep implementation
  details private or restricted. Making every field public to simplify callers can
  bypass the invariant the abstraction should protect.
- Use a trait when a real substitution or external boundary requires it, including
  explicitly requested independent tuning. Supply implementations at composition.
  Concrete types/functions remain suitable for local behavior with one owner.
- Name owners of tasks, streams, connections, and other resources. Borrow where the
  lifetime permits; add shared ownership/synchronization only when the execution
  model requires it. Cancellation and shutdown are behavioral contracts too.
- Preserve unsupported, failed, and negative outcomes distinctly when consumers need
  different actions. Type-checking cannot establish the quality of a model result.

## Counterexample and proof

Suppose an HTTP application and a batch evaluator need the same assessment operation.
If the evaluator must construct the web server, or independently reimplements its
rules, the reusable boundary is missing. Let the capability accept domain inputs
and expose meaningful results; keep HTTP and batch error presentation at the callers.
A second caller may justify a library API, not necessarily a multi-crate workspace.

Exercise the operation outside transport and through affected entrypoints. If provider
substitution is required, verify meaningful outcomes through that boundary rather
than only compilation against a trait. Test actual resource cleanup and external
behavior where affected; borrowing checks alone do not prove them. Retain the
project's existing build/test setup instead of adding tooling for this illustration.

Replace or supplement this proposed example with a pinned, inspected Rust application
when one is available; do not label it as evidence from the user's existing projects.
