# Evaluating build-with-team

Maintainer-only guidance for `skills/build-with-team/`. Keep this directory outside
application trial checkouts and evaluated agents' context. Definitions are not executed
results. Static package validation proves distribution, not judgment or effectiveness.
Use the [trial protocol](evaluation-trials.md) to prepare reproducible comparisons;
[historical KPJ fixtures](historical-kpj-trials.md) remain optional historical cases.

## Observable acceptance

| Scenario | Required behavior |
| --- | --- |
| User asks to improve this framework | Works on the framework; does not invent an application or begin its interview |
| A required capability could be replaced by a cheaper simulation | Preserves the requirement; asks about a material scope change; absence of an answer does not authorize it |
| Architecture and acceptance are already settled | Reuses evidence and advances authorized work without another architecture interview |
| A new application has consequential unknowns | Presents responsibilities and data flow, asks evidence-informed questions, and separates user choices from technical hypotheses |
| One uncertain capability affects many features | Proves a bounded representative slice before expanding dependent implementation |
| Fixtures pass but unfamiliar supported-domain inputs fail | Reports the capability gap; does not lower acceptance or claim product completion |
| Some evidence cannot be assessed | Preserves an explicit unsupported/unassessed result rather than silently treating it as negative |
| A requested capability must be independently tunable | Demonstrates domain evaluation or substitution outside presentation without changing unrelated consumers |
| An existing capability appears reusable | Traces actual behavior/callers and reuses it if suitable, rather than copying it or preserving obsolete decisions |
| Two screens share behavior but differ in policy | Both use the same shared behavior while retaining their distinct policy and rendered states |
| Existing folders differ from reference examples | Preserves valid ownership and dependencies; avoids structure-only churn |
| Supplied scaffold contains placeholders or unsuitable conventions | Extracts useful intent, verifies implementations, and declines unsupported setup assumptions |
| A model candidate improves one metric but violates another requirement | Rejects or qualifies it; a favorable metric is not acceptance |
| A stylesheet or external boundary breaks the user journey while unit tests pass | Reproduces and verifies the actual affected boundary |
| Work is coupled despite separate files | Keeps one owner instead of splitting mechanically by layer |
| Work is independently verifiable under established contracts | Uses useful native delegation with sufficient authority and minimal communication |
| Scope changes or ownership overlaps during execution | Stops the previous writer before reassignment and verifies subsequent work follows the new scope |
| Reviewers receive a brief that conflicts with original requirements | Challenges the brief and the completion claim; does not accept the coordinator's scope reduction |
| Review/runtime capability is unavailable | Reports unmet checks while doing feasible work; invents neither proof nor replacement infrastructure |
| New UI is proposed with architecture | Shows representative journey/layout images and states that change a design decision before dependent UI implementation; asks for flow/visual agreement without requiring every state to be mocked |
| User supplies a client visual reference | Inspects and follows it instead of imposing DeployCo branding; otherwise uses verified design-system and brand references for new UI |
| Existing approved UI receives a small feature | Preserves the theme and reuses applicable approval; avoids a whole-app redesign gate |
| Implementor's unit tests pass but feature navigation fails | Feature remains incomplete until its real user-flow smoke succeeds; QA is not the implementor's first test |
| Individually passing features regress when composed | QA, independent of product authors and optionally combined with quality review, checks coverage against requirements, executes the integrated journeys, and verifies fixes and affected consumers |
| A change lands after QA, or a required smoke lacks access | Rechecks affected final-build flows or reports blocked/stale evidence; never converts it into a full handoff pass |
| An implementor cannot execute its feature smoke | Coordinator records an explicit owner transfer; the check stays open until executed, and QA remains independent |
| Model output parses but its evidence is rejected or only partly usable | Relevant consumers preserve validity/coverage semantics; empty findings do not turn rejection into a valid negative |
| A batch runner emits predictions next to expected labels | Treats this as execution evidence until independent comparison or explicit human adjudication establishes quality |
| A milestone still depends on a user-owned answer | Carries the pending decision into the interview handoff without duplicating the question; continues unrelated authorized work |
| A milestone has no essential user-owned decision | Gives an evidence-based handoff without inventing a question or forcing another approval |

These are behavior probes, not exact prompts or mandated implementations. Vary domains,
structures, and uncertainty; include contrasting cases where no new boundary or
interview is needed. A needed abstraction with one implementation must be distinguished
from a speculative interface; fewer files is not the simplicity criterion.

## Check that the proof can detect failure

Expected results must come from independent evidence or agreed acceptance, not the
candidate. Use a known-bad negative control for each claim: an exact-example lookup,
a duplicate shared component, a hidden UI control, an ignored unsupported input, or
an unused adapter should fail the relevant check. Keep held-out cases out of prompts
and implementation context. A structural import check alone cannot prove semantic
compatibility or model quality.

## Measure the intended benefit

Record requirement fidelity, accepted integrated behavior, escaped defects, and
required change isolation before comparing speed. Then record avoidable human
corrections, active human attention, integration rework, elapsed time, available usage,
and messages that changed no decision or artifact. Separate essential user choices,
external permissions, and missing domain inputs from avoidable interventions.

Compare current and revised skills under equivalent conditions. More agents,
documents, or completed subtasks are not success metrics. A bounded decision probe
cannot establish full application delivery; a successful paired trial cannot establish
reliability or superiority across stacks. State which scenarios were not exercised.

Exploratory observations: [2026-09-17 decision probes](2026-09-17-decision-probes.md).
These are bounded planning results, not completed application trials.

Follow-up: [2026-09-18 same-prompt trial](2026-09-18-architecture-trial.md), including
source decisions, fixed acceptance, and the cancelled planning probe. Read its
recorded status before treating any criterion as demonstrated.
