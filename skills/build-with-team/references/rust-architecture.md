# Rust architecture

This is a proposed baseline, not a pattern audited from the user's projects.
Let ownership, visibility, and actual consumers determine module boundaries.

## Illustrative organization

```text
Cargo.toml
src/
  main.rs                Binary startup and composition
  lib.rs                 Library API when shared callers need it
  <capability>.rs        Behavior and owned types
tests/                   Integration tests through the public API
```

Adapt to the target: a library need not have a binary, and a small binary need not
have a library. These paths follow [Cargo conventions](https://doc.rust-lang.org/cargo/guide/project-layout.html);
capability modules and a workspace split remain design choices.

## Decisions that affect reuse

- Keep reusable behavior independent of argument parsing, HTTP transport, and runtime
  startup. Expose the operations consumers need through deliberate module APIs.
- Keep internals private; use restricted visibility for internal collaboration.
  Making everything public to simplify imports creates unnecessary API commitments.
  See [Rust module visibility](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html).
- Choose traits for an actual boundary or polymorphic behavior. Concrete types and
  functions are sufficient otherwise; avoid trait hierarchies for hypothetical reuse.
- Name the owner of long-lived resources and tasks. Borrow when lifetimes permit;
  introduce shared ownership or synchronization only when the execution model needs it.
- Split into workspace packages when consumers, build requirements, or distribution
  justify it. Modules can separate responsibilities within one package.

## Example: sharing a calculation, not the runtime

Suppose a command and a desktop app calculate the same estimate. A shared operation
accepts domain input and returns an estimate or domain error. Argument parsing stays
in the command; UI state stays in the desktop app. Both callers exercise the same
calculation through its public API, while file and display errors are handled at
their own boundaries.

If only one binary needs the calculation, a private module can suffice. A second
caller may justify a library API; it does not automatically justify a workspace or
trait hierarchy. This is a proposed example, not audited code.

## Evidence

Trace callers to the same capability implementation and exercise its public API.
Compilation establishes type and borrowing constraints, not correct cancellation,
resource cleanup, or external behavior; verify those at the affected boundary.
Use the project's existing build and test configuration rather than adding tooling
to reproduce this example.
