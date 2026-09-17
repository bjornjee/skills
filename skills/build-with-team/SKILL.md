---
name: build-with-team
description: Coordinate application changes through evidence-backed architecture decisions, adaptive native delegation, and independent review in new or existing repositories.
---

# Build With Team

The current task owns the integrated outcome and may implement work itself.
Use native coordination with one coordinator and one delegation level.
If native delegation is unavailable, perform feasible local work and explicitly
report unmet independent architecture challenges and reviews; do not claim they passed.

## Establish the outcome

Identify the core user journey and observable acceptance criteria.
Inspect relevant code and prior decisions before asking questions.
For existing capabilities, establish what they provide, where responsibility
belongs, and what remains missing. Distinguish active decisions from obsolete ones.
In existing repositories, preserve coherent architecture; revisit decisions affected
by the requested change.

## Resolve consequential choices

Prioritize uncertain decisions whose consequences spread across the application:
data ownership, trust boundaries, shared contracts, deployment, and shared behavior.

Ask only for unresolved user intent or consequential tradeoffs.
Ask one question at a time through the native input tool, with suggested pills,
a recommendation, and its tradeoff. Derive discoverable facts yourself.
Skip settled questions and decide reversible implementation details autonomously.

Stop interviewing when the next meaningful slice can be implemented.
For decisions spanning features or workers, establish existing ownership, constraints,
the proposed boundary, the simplest viable alternative, and evidence that could
invalidate the choice. Responsibilities need not become separate services or packages.

For architectural diagrams, prefer ImageGen when available unless the user requests
another format. Verify generated labels and relationships against the written decisions
before presenting the diagram.

Read only the relevant architecture references:

- UI ownership and reuse: [frontend](references/frontend-architecture.md).
- Mobile platform boundaries: [React Native](references/react-native-architecture.md).
- Package and dependency ownership: [Python](references/python-architecture.md),
  [Go](references/golang-architecture.md), or [Rust](references/rust-architecture.md).

Their layouts are illustrative; adapt them to the project, not the reverse.

Before consequential boundaries spread into dependent implementation, obtain an
independent architectural challenge using the [coordination guidance](references/coordination.md).
Resolve findings with evidence. Test uncertain shared assumptions through a bounded
experiment or representative end-to-end slice before expanding dependent work.

## Choose ownership and proof

Before delegating, use the [coordination guidance](references/coordination.md).
Choose ownership and parallelism from dependencies, uncertainty, and independently
verifiable outcomes; briefly explain why the split can succeed. Keep tightly coupled
changes with one owner. Delegate independent capabilities or investigations as useful;
do not assign workers mechanically by technical layer.

Give workers the outcome, owned scope and concrete file paths, relevant decisions
and reusable capabilities, shared contracts, dependencies, acceptance evidence,
and authority to decide locally.
Select applicable domain guidance and translate it into concrete acceptance criteria.
Bound experiments and optimizations by a baseline, target, and budget or stopping
condition. A completed investigation does not establish production readiness.

## Preserve decisions

When work spans handoffs, preserve the outcome, constraints, material decisions and
rationale, unresolved assumptions, and verification links in a concise project brief.
Reuse existing project documents when available.
Update them when direction changes. Reconcile them on resumption with current user
instructions, repository state, native task state, and proof; a brief is not a task board.

## Deliver and adapt

Default to one assignment and one completion report with changes, proof, and open issues.
Workers decide reversible details within their scope; omit routine status and acknowledgments.
Interrupt only for blockers, required changes outside ownership, or evidence that
invalidates the assignment. Include the evidence and a recommended resolution;
continue unaffected work. The coordinator resolves cross-worker decisions and
redirects affected workers; do not seek consensus or relay debate between agents.

Repeated clarification, overlapping edits, or conflicting assumptions require repairing
the assignment or consolidating ownership. Reorganize when evidence invalidates the
split; expand parallel work when shared contracts are sufficiently proven.

If a worker stalls or fails, inspect its partial work and confirm the previous
writer has stopped before reassigning the scope. Unmet acceptance criteria remain
the coordinator's responsibility.

When scope changes, redirect affected work and verify its next action reflects
the change.

## Review and accept

At an integrated behavior-changing milestone, obtain three independent read-only
subagent reviews: correctness, quality, and simplicity. Follow the review procedure
in [coordination guidance](references/coordination.md); docs-only and mechanical changes
use proportional review. Resolve findings and verify fixes against applicable core gates.

Verify that worker artifacts were incorporated, consumers use the intended contracts,
and the integrated user journey meets acceptance criteria. Reverify consumers affected
by shared changes. Distinguish completed components, investigations, and accepted
outcomes; report remaining uncertainty.

When changing this skill, use the [evaluation scenarios](references/evaluation.md).
