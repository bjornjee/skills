# Coordination and acceptance

Use for architectural challenges, ownership assignments, integration, and review.
Use native tasks/subagents within the runtime's authority; do not introduce another
task system. The coordinator owns the integrated outcome, including unmet criteria.

## Challenge consequential architecture

Before a mistaken boundary spreads into dependent work, give an independent read-only
agent the relevant original requirements, authorized changes, repository evidence,
actual proposal, diagram, annotated source tree and boundary metadata, worked contract
example, and simplest viable alternative. Trace the example across these artifacts;
missing owners, conflicting dependencies or absent contracts leave the proposal unfinished.
Disable conversation-history
inheritance and omit prior debate. Preserve facts and requirements, not just the
coordinator's preferred interpretation.

Ask for missed reuse, unsupported assumptions, insufficient or excessive separation,
misplaced state, and dependencies that defeat the proposed division of work. Require
evidence, consequence, and a concrete correction or falsifiable investigation.
No findings is valid. The coordinator adjudicates; peer agreement neither resolves
an unanswered user choice nor validates an uncertain capability.

## Choose ownership

Set the next implementation milestone's shared decisions before splitting it.
The coordinator has the broadest context, not complete knowledge: use evidence to
settle technical uncertainty and the interview for decisions belonging to the user.

| Coordinator settles | Implementor decides within the boundary |
| --- | --- |
| Domain concepts, invariants and ownership | Internal algorithms and helpers |
| Shared operations, input/output meaning and failure semantics | Private types and internal file organization |
| State/revision ownership, transactions and retries | Mechanisms preserving those guarantees |
| Shared frontend behavior, consumers and state authority | Component internals and local presentation |
| Public module paths and allowed dependency direction | Private modules that do not alter another assignment |
| Acceptance evidence and integration ownership | How to produce that evidence efficiently |

Folder layouts are indicative across projects; agreed ownership and shared contracts
are binding within a work batch. Make identity, units, uncertainty and effect semantics
explicit where consumers depend on them. Do not require approval for internal choices
that preserve the contract. A worker that finds the contract inadequate sends evidence
and a proposed correction; the coordinator updates affected assignments before their
dependent work proceeds. Keep unaffected work moving. The coordinator owns composition
and integration, even when delegating the corresponding edits.

| Evidence | Arrangement |
| --- | --- |
| Clear requirements and independent acceptance | Parallel implementation owners |
| Tightly connected behavior or state transitions | One owner across the connected work |
| Uncertain approach with testable alternatives | Bounded investigations against common acceptance |
| An unproven shared assumption affects several features | Resolve it before expanding dependent implementation |

An assignment contains the relevant original requirements and approved changes,
owned paths, existing implementations to reuse, shared contracts, unresolved
dependencies, expected proof, and authority to decide locally. Supply applicable
instructions and concrete code context as required by the runtime. A separate
assignment document is unnecessary. Workers are not alone in the checkout; preserve
others' changes and route ownership conflicts to the coordinator.
Include the owned user journeys, approved screen previews for UI, applicable unit-test
command and feature smoke entrypoint. Apply the test lanes below to feature behavior;
docs/mechanical work follows core proportional proof without padding tests.

Default to one assignment and one completion report: changes, proof, and open issues.
Do not relay routine acknowledgments or peer debate. Escalate only a blocker,
required out-of-scope change, or evidence invalidating the assignment; include a
recommended resolution and continue unaffected work.

If clarification repeats, fix the assignment rather than repeating messages. If
ownership overlaps or a worker fails, inspect partial work and confirm the old
writer has stopped before reassigning. Reorganize when evidence changes dependencies;
do not preserve a team arrangement for its own sake.

## Integrate evidence

Trace worker artifacts into actual consumers. Exercise the integrated user journey,
not just each component in isolation. Verify that runtime selection uses the intended
implementation; a correct experiment or adapter that the application never uses
does not satisfy the requirement.

Select proof using applicable domain guidance and core verification profiles:

| Work | Evidence needed for acceptance |
| --- | --- |
| CRUD | Operations, persistence, validation, relevant access/error behavior |
| Shared UI | Actual consumers reuse it; distinct rendered states and accessibility work |
| Model-dependent capability | Apply `ai-ml-patterns` for domain evaluation; verify the application uses the evaluated implementation/configuration |
| Independent tuning or substitution | Domain evaluation outside presentation; replacement preserves real contract semantics |
| Performance | Measured bottleneck and representative before/after results with behavior preserved |
| Data changes | Integrity, consumer compatibility, applicable migration and recovery proof |
| Realtime/device work | Event semantics and the actual capture, interruption, consumer, and cleanup lifecycle |

Fixtures can prove orchestration without proving capability quality. Keep those
claims separate. Record a rejected candidate or missing input honestly; never
replace the quality target with an easier metric. An incomplete requirement remains
open unless the user explicitly authorizes its deferral.

## Test lanes and QA

These lanes organize test cost and ownership; they do not replace core Surgical,
Targeted or Full verification profiles, domain evaluations, or project gates.

| Lane | Purpose and owner | When |
| --- | --- | --- |
| Cheap unit tests | Implementor checks domain rules, state transitions, validation and error handling deterministically; small component/integration tests may supplement them | During implementation and after affected fixes; run the cheap suite before handoff |
| Expensive user-flow smoke | Implementor proves the feature through its real entrypoint and dependencies; independent QA verifies all in-scope journeys together | After feature integration; QA on the stable handoff build, then affected reruns after fixes |

Reuse the project's test runner and automation rather than building a test platform.
Unit doubles are appropriate for deterministic logic; name what they omit. Smoke
tests drive user actions through the running browser/device/CLI as applicable, with
the real application backend and persistence. Exercise configured external services
when their behavior is required; stubbed responses cannot establish that integration
or model quality. Missing access or data makes the affected check blocked, not passed.

Keep one compact journey-to-evidence map in the existing brief: feature, setup/data,
actions, expected result, important error/recovery branch, owner and latest status.
Use the same map for assignments and handoff; link executable tests and evidence
rather than generating separate planning and QA documents for each feature.
Cover every in-scope feature at least once, joining features into journeys where
appropriate; do not test every combination end-to-end. Select additional branches
from consequence and shared dependencies: persistence/reload, invalid input, failed
save and retry, navigation, permissions, or interrupted work when relevant. Record
the smoke time/call budget and environment before running; budget exhaustion cannot
turn an untested flow into a pass. Reuse safe fixtures and reset isolated test data.
Do not send real orders or messages, charge money, or alter customer data as test setup.

The implementor supplies reproducible steps or automated tests and observed evidence,
including feature failure/recovery, in the completion report. Prefer a repeatable
smoke script using the existing runner; if only interactive tools are available,
retain exact steps and outcomes so QA can independently repeat them. Screenshots
prove appearance; assertions on saved state, output and visible outcomes prove flow.

The quality reviewer may perform QA as part of the same assignment; a separate QA
agent is useful only when the workload warrants it. Supply fresh context: original
requirements, approved flow/previews, journey map, integrated revision, startup/reset
instructions and test data. QA checks the map against requirements, adds missing
checks, executes the smoke suite, and tests shared consumers and feature sequences.
QA may create/reset isolated test data but does not patch application code or tests
under review, or accept implementor claims as execution evidence. Send reproducible failures
to the coordinator for the responsible implementor to fix. QA rechecks those flows
and affected shared consumers after fixes, without peer debate or repeating unrelated
expensive checks. Preserve required independence from code authors.

For new applications, the final suite covers the whole declared feature set. For
existing applications, reuse the established full smoke set and add changed-feature
and dependency-driven checks; disclose known uncovered features. Tie results to the
final integrated revision/configuration, including any fixes made after QA. Classify
each journey as passed, failed, blocked or explicitly deferred by the user. No silent
skips, stale affected evidence or unexplained flaky reruns. Handoff requires all
required journeys to pass and regressions to be resolved; otherwise report an
intermediate delivery with the exact gap. This establishes tested coverage, not a
guarantee that every possible input or interaction is defect-free.

## Review and accept

At a stable integrated behavior-changing milestone, the coordinator launches three
separate read-only reviewers. Give each the same revision or frozen diff, changed
scope, original requirements, authorized changes, relevant decisions, and proof.
Include unresolved assumptions and capability limits. Disable conversation-history
inheritance and withhold other reviewers' findings and the implementation narrative.
Do not use an agent-authored brief as the sole authority for scope.

| Reviewer | Focus |
| --- | --- |
| Correctness | Requirement fidelity, behavior, contracts, failure paths, security, and regression evidence |
| Quality + QA | Trace change isolation and meaningful tests; execute the integrated journeys, check regressions/accessibility, and compare actual screens with approved direction |
| Simplicity | Missed reuse, duplication, unnecessary machinery, and missing boundaries causing avoidable change impact |

Each may challenge weakened requirements, simulated capabilities presented as real,
or unsupported completion claims. Simplicity is not a count of files or interfaces:
removing a needed boundary and introducing a speculative framework can both fail it.
Use the applicable strict language reviewer for correctness rather than automatically
adding a fourth reviewer. Preserve additional core/project checks. With limited
slots, run reviews sequentially without sharing findings between reviewers.

Require evidence, consequence, and a concrete correction. Allow no findings; reviewer
agreement is not proof. The coordinator adjudicates, fixes, and verifies under core
gates. Material fixes need review of affected changes; do not repeat unrelated reviews
to seek consensus. Docs-only/mechanical changes receive proportional review.

## Team handoff

Apply core evidence-based handoff from the existing journey-to-evidence map, including
the latest affected-flow reruns and independent review findings. The coordinator
reconciles original outcomes and authorized changes with that map; missing or stale
evidence retains its gap status. Identify whether this is product acceptance, an
approved intermediate milestone, or incomplete work.

Carry pending user decisions across proposal revisions and milestone handoffs. When
progress depends on an essential user-owned answer, use the interview procedure in
SKILL.md §1 and identify the work it unlocks. Keep an existing unanswered question
visible without reissuing it. Continue unrelated authorized work; do not manufacture
a question when none is needed or ask the user to resolve technical uncertainty.
