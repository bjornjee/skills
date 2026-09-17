---
name: build-with-team
description: Build or change applications through architecture decisions, representative capability proof, adaptive native delegation, and independent acceptance review.
---

# Build With Team

The current task owns the integrated outcome. Use one coordinator and at most one
delegation level; the coordinator may implement everything when work is coupled.
For requests about this framework, work on the framework, not an invented application.

Use the checkpoints below to decide what may proceed. They are not five documents
or approval meetings. Reuse established evidence in existing repositories; revisit
only decisions affected by the change. Return to an earlier checkpoint when new
evidence invalidates it.

## 1. Establish the outcome

Trace the user journey, relevant code, and prior decisions. Identify what existing
capabilities actually provide, what can be reused, and what remains missing.
Preserve required behavior, quality targets, constraints, and explicitly permitted
simulation separately from implementation assumptions and approved deferrals.
An agent-authored brief cannot weaken a user requirement. Permission to fabricate
one input or subsystem does not authorize simulating another required capability.

Define observable acceptance and its evidence source before implementation. Expected
results must come from independent evidence or agreed requirements, not the candidate
implementation. Missing acceptance data or domain judgments remain open questions.

Determine the active requirement before deciding whether a question blocks work.
An earlier assistant's question or recommendation does not create user uncertainty:

| Evidence | Next action |
| --- | --- |
| The user explicitly requires a capability; an agent proposed weakening it without an answer | Continue under the original requirement. Drop the optional reduction from the critical path; do not ask the user to reconfirm the requirement. |
| Required technical inputs or feasibility evidence are missing | Investigate and identify the specific input or experiment needed. Keep the requirement active and continue independent work. |
| The user has not decided a necessary scope, authority, or material tradeoff | Ask that question and pause only work that actually depends on its answer. |

Derive discoverable facts yourself. For a necessary user choice, ask one question
with suggested choices, a recommendation, and its tradeoff. A suggested default or
elapsed time is not agreement. Do not repeat a pending question without new information.
Name useful authorized work that can continue, or explain the actual dependency if
none can. Missing technical inputs never authorize replacing the required outcome.

## 2. Establish the architecture

For a new application or consequential redesign, read the
[architecture guidance](references/architecture.md). Present the responsibilities,
reuse decisions, important contracts, alternatives, and uncertain assumptions, with
the first slice that can test them. Include a responsibility/data-flow diagram;
prefer ImageGen unless the user requests another format, and verify its labels and
relationships against the written decisions. If unavailable, explain and provide
a readable text diagram. Ordinary local changes need no new architecture ceremony.

Resolve user-owned tradeoffs before dependent implementation; reuse agreement already
given. Decide reversible implementation details autonomously. Obtain an independent
read-only challenge before consequential boundaries spread across consumers, following
the [coordination guidance](references/coordination.md). Resolve findings with evidence.
Reviewer approval does not resolve missing user intent or prove feasibility.

Introduce a boundary when it gives a domain concept one owner, protects an invariant,
isolates a required source of change, or controls a resource lifecycle. Use the
smallest suitable function, component, module, package, or interface. Required
independent tuning can justify a boundary before a second implementation exists.
Separate filenames and declared interfaces do not prove separation of responsibility.

Read the applicable implementation references, which contain selected structures
and dependency examples rather than mandatory folder layouts:

- UI ownership and shared consumers: [frontend](references/frontend-architecture.md).
- Screen composition and device lifetimes: [React Native](references/react-native-architecture.md).
- Domain contracts, composition, and persistence: [Python](references/python-architecture.md).
- Package ownership and dependency injection: [Go](references/golang-architecture.md).
- Domain types, visibility, and resource ownership: [Rust](references/rust-architecture.md).

## 3. Prove the critical assumption

If acceptance is established and no consequential uncertainty remains, proceed with
the applicable core verification profile; do not invent an experiment or dataset.
Identify the uncertainty whose failure would invalidate the product or cause the
most dependent rework. Establish a bounded representative slice before expanding
implementation around it. Specify representative inputs, independently justified
expected outcomes, acceptance criteria, and a budget or stopping condition.
Apply the relevant domain guidance; distinguish capability evidence from workflow
fixtures. Synthetic examples and passing unit tests do not establish domain accuracy.

Demonstrate requested architectural properties through a relevant change or consumer:
evaluate a tunable capability outside the server, substitute its implementation,
or exercise shared behavior in its intended consumers. Test the real contract's
meaning, including unsupported inputs and failures, not just a matching signature.
Do not create speculative variants to prove flexibility the user did not request.

If evidence is missing or the candidate fails, investigate, revise the design, or
report the specific missing input. Preserve unsupported/unassessed outcomes separately
from successful negative results. Never lower the quality target or silently replace
the capability with a demo. Independent work may proceed against an explicitly
provisional contract; a completed experiment is not product acceptance.

## 4. Implement and integrate

Read the [coordination guidance](references/coordination.md) before delegation.
Choose ownership from dependencies, uncertainty, and independently verifiable outcomes.
Explain why the split can succeed. Keep tightly coupled changes together; separate
files or technical layers alone do not justify separate workers.

Give each worker the relevant original requirements and authorized changes, owned
paths, reusable capabilities, shared contracts, acceptance evidence, dependencies,
and local decision authority. Default to one assignment and one completion report.
Interrupt only for blockers, ownership conflicts, or evidence invalidating the
assignment; send evidence and a recommended resolution, then continue unaffected work.
The coordinator resolves cross-worker decisions without peer consensus rounds.

When work spans handoffs, maintain one concise existing project brief where possible:
required outcomes; decisions and assumptions; open questions and affected work;
acceptance evidence. Distinguish user decisions from agent assumptions and measured
results. Reconcile the brief with current instructions, code, native task state,
and evidence on resumption; it is not authoritative merely because it is written.

Repeated clarification or overlapping changes require repairing the assignment or
consolidating ownership. Confirm the prior writer has stopped before reassigning
its scope. When scope changes, redirect affected work and verify its next action.
Verify that delivered artifacts are incorporated and consumers use the intended
contracts; handoff acknowledgments do not establish integration.

## 5. Accept the outcome

At an integrated behavior-changing milestone, obtain three independent read-only
reviews: correctness, quality, and simplicity. Follow the
[review procedure](references/coordination.md#review-and-accept); docs-only and mechanical
changes use proportional review. Supply original requirements and explicitly authorized
changes alongside the brief, the same implementation snapshot, and proof artifacts.
Reviewers may challenge the coordinator's interpretation of scope. Agreement does
not substitute for acceptance evidence. Resolve findings and verify affected fixes
under the applicable core gates.

Map each required outcome to demonstrated integrated behavior, an explicitly approved
deferral, or a remaining gap. Passing tests, completed reviews, a finished component,
and a runnable prototype are not interchangeable with product completion. Reverify
consumers affected by shared changes and state what remains unvalidated.

If native delegation or an independent check is unavailable, perform feasible work
and report the unmet check; do not claim it passed. Improve this workflow using
observed outcomes; maintainer trials live outside the installed skill bundle.
