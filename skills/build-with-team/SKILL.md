---
name: build-with-team
description: Coordinate application architecture and delivery using native agents, with an architecture interview for unresolved consequential choices.
---

# Build With Team

The current task owns the integrated outcome. Use the runtime's native coordination;
choose agents and task boundaries as needed.

## Establish the outcome

Identify the core user journey and observable acceptance criteria.
Inspect relevant code and prior decisions before asking questions.
For existing capabilities, establish what they provide, where responsibility
belongs, and what remains missing. Distinguish active decisions from obsolete ones.

## Resolve consequential choices

Prioritize uncertain decisions whose consequences spread across the application:
data ownership, trust boundaries, shared contracts, deployment, and shared behavior.

Ask only for unresolved user intent or consequential tradeoffs.
Ask one question at a time through the native input tool, with suggested pills,
a recommendation, and its tradeoff. Derive discoverable facts yourself.
Skip settled questions and decide reversible implementation details autonomously.

Stop interviewing when the next meaningful slice can be implemented.
Present the architecture through responsibilities, reuse, and shared contracts;
do not assume each responsibility needs a separate service or package.

Before dividing implementation, read only the relevant architecture references:

- UI ownership and reuse: [frontend](references/frontend-architecture.md).
- Mobile platform boundaries: [React Native](references/react-native-architecture.md).
- Package and dependency ownership: [Python](references/python-architecture.md),
  [Go](references/golang-architecture.md), or [Rust](references/rust-architecture.md).

Their layouts are illustrative; adapt them to the project, not the reverse.

## Preserve decisions

Maintain a concise project brief when work spans handoffs.
Record the outcome, constraints, material decisions and rationale, remaining work,
and links to verification evidence. Reuse existing documentation.

Update it when direction changes. On resumption, reconcile it with the latest
user instructions and actual repository state.

## Deliver

Test the riskiest shared assumptions through a representative end-to-end slice
before expanding dependent implementation.

Delegate independent work to native subagents when useful.
Give each worker the relevant decisions, ownership boundary, and acceptance criteria.
Keep integration with the coordinator; do not require fixed roles or agent counts.

Default to one assignment and one completion report with changes, proof, and open issues.
Workers decide reversible details within their scope; omit routine status and acknowledgments.
Interrupt only for blockers, required changes outside ownership, or evidence that
invalidates the assignment. Include the evidence and a recommended resolution;
continue unaffected work. The coordinator resolves cross-worker decisions and
redirects affected workers; do not seek consensus or relay debate between agents.

If a worker stalls or fails, inspect its partial work and confirm the previous
writer has stopped before reassigning the scope. Unmet acceptance criteria remain
the coordinator's responsibility.

When scope changes, redirect affected work and verify its next action reflects
the change.

Verify the integrated user journey. Distinguish completed components from a
completed outcome, and report remaining uncertainty.

When changing this skill, use the [evaluation scenarios](references/evaluation.md).
