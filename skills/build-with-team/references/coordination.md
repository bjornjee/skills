# Coordination and acceptance

Use for architectural challenges, ownership assignments, integration, and review.
Use native tasks/subagents within the runtime's authority; do not introduce another
task system. The coordinator owns the integrated outcome, including unmet criteria.

## Challenge consequential architecture

Before a mistaken boundary spreads into dependent work, give an independent read-only
agent the relevant original requirements, authorized changes, repository evidence,
proposed boundary, and simplest viable alternative. Disable conversation-history
inheritance and omit prior debate. Preserve facts and requirements, not just the
coordinator's preferred interpretation.

Ask for missed reuse, unsupported assumptions, insufficient or excessive separation,
misplaced state, and dependencies that defeat the proposed division of work. Require
evidence, consequence, and a concrete correction or falsifiable investigation.
No findings is valid. The coordinator adjudicates; peer agreement neither resolves
an unanswered user choice nor validates an uncertain capability.

## Choose ownership

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
| Model-dependent capability | Representative data, independent expectations, exact metrics/splits, unsupported cases, applicable latency/cost limits |
| Independent tuning or substitution | Domain evaluation outside presentation; replacement preserves real contract semantics |
| Performance | Measured bottleneck and representative before/after results with behavior preserved |
| Data changes | Integrity, consumer compatibility, applicable migration and recovery proof |
| Realtime/device work | Event semantics and the actual capture, interruption, consumer, and cleanup lifecycle |

Fixtures can prove orchestration without proving capability quality. Keep those
claims separate. Record a rejected candidate or missing input honestly; never
replace the quality target with an easier metric. An incomplete requirement remains
open unless the user explicitly authorizes its deferral.

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
| Quality | Responsibility ownership, change isolation, meaningful tests, accessibility, and actual user behavior |
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

Before completion, map original outcomes and authorized changes to integrated evidence,
explicitly approved deferrals, or remaining gaps. State whether the delivered result
is an accepted product, an approved intermediate milestone, or incomplete work.
Do not present passing tests, completed reviews, or a runnable prototype as proof
of an unmet central capability. When a required independent check is unavailable,
report it rather than fabricating success.
