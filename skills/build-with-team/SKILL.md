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
Map every in-scope feature to a user journey with setup, actions, observable result
and relevant failure/recovery checks. Keep this coverage map in the existing brief;
it drives implementor proof and independent regression QA at handoff.

Determine the active requirement before deciding whether a question blocks work.
An earlier assistant's question or recommendation does not create user uncertainty:

| Evidence | Next action |
| --- | --- |
| The user explicitly requires a capability; an agent proposed weakening it without an answer | Continue under the original requirement. Drop the optional reduction from the critical path; do not ask the user to reconfirm the requirement. |
| Required technical inputs or feasibility evidence are missing | Investigate and identify the specific input or experiment needed. Keep the requirement active and continue independent work. |
| The user has not decided a necessary scope, authority, or material tradeoff | Ask that question and pause only work that actually depends on its answer. |

Derive discoverable facts yourself. Interview the user when a consequential decision
still depends on their intent, domain judgment, acceptable error costs, or authority.
Ask one question at a time with suggested-choice pills, a recommendation grounded in
the evidence, and each option's consequence. Ask through the runtime's supported
question UI; a question in a brief or ordinary message is not a substitute. Prefer
a response-waiting interaction when available and permitted for that question.
If only asynchronous questions are available, keep the question pending while doing
independent work. If yielding before an answer, lead with “Awaiting your response”,
identify the pending decision and what its answer unlocks; keep artifact links secondary.
Do not present this handoff as completion or claim a native waiting status from prose.
Use plain-text choices only when no supported question UI is available.
Technical uncertainty calls for investigation, not
asking the user to guess. A suggested default or elapsed time is not agreement.
Do not repeat a pending question without new information.
Name useful authorized work that can continue, or explain the actual dependency if
none can. Missing technical inputs never authorize replacing the required outcome.

## 2. Establish the architecture

For a new application or consequential redesign, read the
[architecture guidance](references/architecture.md). The coordinator owns the overall
responsibility map and resolves decisions shared by implementors. Specify the next
milestone's shared boundaries concretely; leave private implementation details to
their owners and future features at the level needed to avoid foreseeable conflicts.
Present a concise proposal with:

- Consequential owners, paths and call direction. Trace a required change: which
  owner changes and which consumers should remain unchanged? For UI work, name the
  flows, shared interactions and their consumers, with state and consumer policy owners.
- A separate Markdown source tree: each listed folder/file's responsibility,
  including frontend state and shared behavior. Explain consequential contracts and
  allowed dependencies alongside it; show reuse, additions and changes in existing repos.
- A worked normal and failure case through the critical boundary: actual example
  inputs/outputs and relevant decisions, state changes and effects, not just field names.
- The first deliverable and its verification. For consequential uncertainty, state
  the experiment budget/stopping condition and what dependent work its result permits.

Generate an architecture diagram image using ImageGen and show it to the user.
Show the whole application's core components, abstractions and interactions, including
consequential responsibility boundaries. Use conceptual names, not folder/file paths;
keep the source tree in Markdown. Label directed interactions with operations or data
contracts and distinguish runtime boundaries, external systems and durable stores.
Verify the image against the written ownership and worked flow; correct missing owners or
contradictory relationships before presenting it. Link the image from the project
brief when one exists. Ordinary local changes need no new architecture ceremony.

For a new UI or consequential redesign, show screen-preview images at this same
proposal gate, before dependent UI implementation. Read the
[frontend guidance](references/frontend-architecture.md#design-preview-and-agreement)
for reference selection and preview coverage. Default to `@deploy-co/design-system`
and the DeployCo Brand System PDF; an explicit user-selected client visual reference takes
precedence. Preserve an existing approved visual direction for ordinary changes.
Obtain agreement on the proposed flow and visual direction alongside architecture;
an architecture-only approval does not approve unseen screen designs.
For a new screen in an existing app, reuse the approved architecture and source map
unless its boundaries change; do not turn every UI addition into a global redesign.

For a new application or consequential redesign, obtain agreement on the concrete
proposal before dependent implementation, or identify prior agreement or explicit
delegation that covers its decisions. A request to build does not settle material
tradeoffs introduced by the proposal. Resolve those through the interview; record
the answer and affected work in the existing brief. Continue authorized independent
work, and decide routine reversible implementation details autonomously. Obtain an independent
read-only challenge before consequential boundaries spread across consumers, following
the [coordination guidance](references/coordination.md). Resolve findings with evidence.
Reviewer approval does not resolve missing user intent or prove feasibility.

Introduce a boundary when it gives a domain concept one owner, protects an invariant,
isolates a required source of change, or controls a resource lifecycle. Use the
smallest suitable function, component, module, package, or interface. Required
independent tuning can justify a boundary before a second implementation exists.
Separate filenames and declared interfaces do not prove separation of responsibility.

Apply the relevant implementation references to those decisions; their structures
and dependency examples are indicative, not mandatory folder layouts:

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
report the specific missing input. Apply core outcome integrity and the relevant
domain contract guidance. Never lower the quality target or silently replace
the capability with a demo. Independent work may proceed against an explicitly
provisional contract; a completed experiment is not product acceptance.

## 4. Implement and integrate

Read the [coordination guidance](references/coordination.md) before delegation.
Choose ownership from dependencies, uncertainty, and independently verifiable outcomes.
Explain why the split can succeed. Keep tightly coupled changes together; separate
files or technical layers alone do not justify separate workers.
Before parallel implementation, check: can each worker finish and verify its scope
without inventing a decision another worker depends on? Resolve missing shared
decisions, prove uncertain contracts with a representative slice, or keep that work
together. Independent work unaffected by the uncertainty may proceed.

Give each worker the relevant original requirements and authorized changes, owned
paths, reusable capabilities, shared contracts, acceptance evidence, dependencies,
and local decision authority. Default to one assignment and one completion report.
Interrupt only for blockers, ownership conflicts, or evidence invalidating the
assignment; send evidence and a recommended resolution, then continue unaffected work.
The coordinator resolves cross-worker decisions without peer consensus rounds.

Each feature implementor owns cheap unit tests for its deterministic behavior and
expensive end-to-end smoke proof through the running application. Do not add padding
unit tests for visual-only or mechanical work; explain when no meaningful unit check
applies and retain the feature's smoke obligation. A component test or API call alone
does not prove a browser journey. When integration dependencies prevent that proof,
report the feature as pending integration and retain responsibility for its smoke
check once available; do not transfer untested work to QA as complete.
If the implementor cannot execute the smoke check, the coordinator explicitly accepts
or reassigns that obligation and records the new owner in the journey map. QA remains
independent of product authors.

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

Use the [two test lanes and QA procedure](references/coordination.md#test-lanes-and-qa).
Independent QA exercises the integrated user-flow smoke suite, including
every in-scope feature and cross-feature regressions, on the handoff build. The
coordinator owns coverage and resolution. The quality reviewer may also own QA;
remain independent of product authors without adding a mandatory fourth agent or
management layer. Code review and visual grading do not replace execution of the flows.

At an integrated behavior-changing milestone, obtain three independent read-only
reviews: correctness, quality, and simplicity. Follow the
[review procedure](references/coordination.md#review-and-accept); docs-only and mechanical
changes use proportional review. Supply original requirements and explicitly authorized
changes alongside the brief, the same implementation snapshot, and proof artifacts.
Reviewers may challenge the coordinator's interpretation of scope. Agreement does
not substitute for acceptance evidence. Resolve findings and verify affected fixes
under the applicable core gates.

Apply core evidence-based handoff using the journey map and the
[team handoff procedure](references/coordination.md#team-handoff).

If native delegation or an independent check is unavailable, perform feasible work
and report the unmet check; do not claim it passed. Improve this workflow using
observed outcomes; maintainer trials live outside the installed skill bundle.
