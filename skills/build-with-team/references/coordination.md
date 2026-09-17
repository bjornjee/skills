# Coordination decisions

Use this reference when challenging shared architecture, dividing work, or reviewing
an integrated milestone. These are decision criteria, not a fixed team roster.

## Choose the arrangement

Trace dependencies in behavior, contracts, and state. Separate files alone do not
make assignments independent. A worker may own a capability across UI, application,
and persistence when that reduces handoffs.

| Evidence about the work | Arrangement |
| --- | --- |
| Clear requirements and independently verifiable outcomes | Parallel implementation owners |
| Clear requirements with tightly connected changes | One owner across the connected work |
| Uncertain approach with independently testable alternatives | Bounded investigations or experiments against common acceptance criteria |
| Uncertain shared assumption affecting several features | Resolve the assumption before expanding dependent implementation |

Share relevant factual context and accepted decisions with implementors. Assign
enough scope and authority to finish without routine approval requests. Use native
assignment messages; a separate assignment document is unnecessary.

## Challenge consequential architecture

A boundary is consequential when a mistaken choice would force substantial changes
across consumers or be costly to reverse. Ordinary local choices need no architecture
review. For a consequential choice, give an independent read-only agent the outcome,
accepted constraints, repository evidence, and proposed boundary and alternative.
Exclude prior debate and the coordinator's conversation history.

Ask it to identify missed reuse, unnecessary layers, misplaced state or responsibility,
unsupported assumptions, and dependencies that defeat the proposed division of work.
Require concrete evidence and a correction or falsifiable investigation; no findings
is valid. The coordinator adjudicates and tests unresolved assumptions. Reopen the
decision when new evidence warrants it, rather than repeating opinion rounds.

## Select acceptance evidence

Use the project's applicable domain guidance and proof commands. This table helps
select evidence; it does not replace core verification profiles or specialist methods.

| Work | Evidence to establish before acceptance |
| --- | --- |
| CRUD | Operations, validation, persistence, and relevant access/error behavior |
| Shared UI | Actual consumers reuse the implementation; rendered states and accessibility work |
| Model experiments | Baseline, exact metrics and dataset version/splits, protected evaluation data, and relevant latency/cost limits |
| Performance | Measured bottleneck and before/after results on a representative device/workload, with required behavior preserved |
| Data changes | Integrity invariants, consumer compatibility, and applicable migration/recovery checks |
| Realtime integration | Event semantics, ordering, cleanup, and the actual capture-to-consumer lifecycle |

Set experiment limits before running; stop when acceptance is met or the budget or
stopping condition is reached. Report a rejected candidate or unresolved feasibility
as such. Do not replace the product's quality target with an easier metric.

## Adapt from observed signals

| Signal | Response |
| --- | --- |
| Multiple workers need one unresolved decision | Resolve it and pause only dependent work |
| Overlapping edits or repeatedly conflicting assumptions | Consolidate ownership after stopping the previous writers |
| An experiment invalidates an assumed capability | Revise affected contracts and assignments before expansion |
| A contract is sufficiently proven and remaining work is independent | Expand parallel implementation where useful |
| Messages repeat without new evidence | Inspect the blocker; stop relaying debate or unchanged status |

Separate external authorization or missing inputs from implementation defects.
Communicate the actionable blocker once; reassess when authority, inputs, or relevant
state change. Preserve the runtime's required approval and recovery behavior.

## Review an integrated implementation

The coordinator launches three separate read-only reviewers at a stable integrated
milestone, before declaring the behavior-changing outcome complete. Workers do not
launch their own review hierarchies. Supply each reviewer the same revision or frozen
diff, changed-file scope, accepted requirements, relevant decisions, and proof artifacts.
Disable conversation-history inheritance and withhold other reviewers' findings and
the implementation narrative; retain the actual requirements and constraints.

| Review | Focus |
| --- | --- |
| Correctness | Requirements, contracts, failure paths, security, and regression evidence |
| Quality | Maintainability, ownership, dependencies, meaningful tests, accessibility, and actual user behavior |
| Simplicity | Missed reuse, duplication, unnecessary layers/dependencies, and speculative flexibility |

Use an applicable strict language reviewer for correctness instead of automatically
adding a fourth generic review; preserve any additional checks required by core or
project instructions. If concurrency is limited, run independent reviews sequentially.

Findings need evidence, consequence, and a concrete correction. Simplicity proposals
must preserve acceptance requirements. Allow no findings; reviewer agreement is not
proof. The coordinator adjudicates, applies fixes, and verifies them using core gates.
Material fixes require review of affected changes; unrelated reviews remain valid.
Do not rerun all reviewers merely to solicit more findings. Reviewers assess the
integrated result, not every intermediate worker response.

## Example: car inspection

Suppose detector quality is uncertain while the inspection-event contract is established.
First verify the actual owners of detection, duplicate suppression, and coverage
progression; do not move deduplication into detection merely because duplicates appear
in the report.

The coordinator can assign a bounded detector experiment and independent report UI
work using the existing event contract. Keep capture/coverage changes together if
they depend on the same unresolved state transitions. The experiment compares exact
type/location quality as well as any-damage detection, with applicable latency limits.
An F1 improvement that violates another acceptance requirement is not promoted.

If a candidate requires different event semantics, resolve that shared decision before
dependent workers adopt it. The coordinator finally verifies that the chosen detector,
tracking behavior, and report agree through a real inspection journey. Passing model
evals and rendering a report independently do not establish that integration.

This illustrates decisions and evidence, not mandatory architecture or measured proof
that this team arrangement outperforms another.
The split depends on the established contract: if detector experiments must change
finding identity or lifecycle semantics, report work is no longer independent.
Resolve that boundary first instead of retaining the same team arrangement.
