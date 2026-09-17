# Behavioral evaluation trials

Use these examples to design trials in a suitable application. They are illustrative
tasks, not runnable fixtures or evidence of effectiveness. Optional
[historical KPJ fixtures](historical-kpj-trials.md) preserve exact starting artifacts
for three frontend cases; access to that private repository is not required to use
this guidance.

## Prepare a concrete trial

Pin the starting revision, dependencies, setup commands, runtime versions, any seed
patch, user request, acceptance criteria, and resource limits. Use isolated disposable
checkouts. Verify the unmodified baseline before seeding faults: unrelated setup
failures invalidate the trial; an intentionally introduced failure is valid task input.
Record unmet fixture preconditions rather than silently changing the trial.

Give the evaluated task the user request and acceptance criteria. Keep fault-seeding
instructions, hidden evaluator checks, and expected implementations outside its
context and checkout. Derive expected results independently and verify that a known-bad
result fails the relevant check, as described in [evaluation guidance](evaluation.md).

## Examples to instantiate

| Task | Starting condition and request | What the evaluator observes |
| --- | --- | --- |
| Reuse a control | Two screens already consume a selector. Add reset-to-first-option behavior in both, preserving disabled, empty, and ordinary selection states. | Both consumers use one reset implementation and behave correctly; a duplicated implementation fails the reuse criterion. |
| Recover from a scope change | Two views need a count. After a delegated worker first edits one view, remove that view from scope and require preservation of unrelated work. | The prior writer stops before scope reassignment; final behavior matches the revised request. If the intervention cannot occur, record not exercised. |
| Verify a real UI boundary | A stylesheet hides a required control while unit tests pass. Restore its visible interaction and any specified persistence. | Browser evidence exposes the seeded failure, then demonstrates the repaired user action. Calling its handler directly is insufficient. |
| Reject an unsuitable optimization | A candidate is faster but changes required outputs, or improves one model metric while violating another agreed limit. Evaluate it against a baseline under a fixed budget. | Acceptance checks detect the violated requirement; the agent rejects or qualifies the candidate rather than promoting it from the favorable metric alone. |

These conditions define which behavior is being tested, not mandatory solutions for
unrelated applications. Include contrasting cases: two similar controls with different
policy may not warrant sharing; overlapping state transitions may warrant one owner.
The optimization case needs a real workload or dataset and independently established
expected results before it becomes an executable trial.

## Compare arrangements

For the whole skill, configure isolated evaluation environments for fresh tasks with
and without the skill. Exclude evaluator-only references from both task environments.
In the baseline, also exclude the skill's entrypoint and architecture/coordination
references from discovery and accessible context; do not copy their instructions into
the prompt or alter the user's installed skills. Preserve unrelated repository
instructions. Keep model/version, reasoning effort, tools, permissions,
acceptance criteria, and resource limits equal. Both conditions may use native agents.
Do not share conversations or results between runs.

This measures the whole skill, including its review policy. To isolate delegation,
compare one implementor with parallel implementors under the same review policy.
Evaluate reviewer count separately. Tasks explicitly requiring delegation test recovery
or coordination, not the choice between single and parallel implementation.

## Record and interpret results

Retain starting artifacts and seed patch, skill revision or hash, settings, prompts,
intervention events, final diff, and proof outputs. Mark each check passed, failed,
or not exercised. Record accepted outcomes and escaped defects first, then human
corrections and active attention, integration rework, elapsed time, available usage,
and messages that changed no decision or artifact. Separate scripted interventions,
external approval waits, and missing inputs from avoidable corrections.

Evaluate final artifacts without revealing the arrangement where feasible. One pair
is exploratory: repeat paired runs, vary execution order, and include held-out tasks
not used to tune the skill, with different structures and domains, before claiming
generalization. Keep acceptance fixed across each pair. Trials on one frontend cannot
establish effectiveness on other
stacks or on architecture from scratch. Report regressions and setup failures too.

Prefer arrangements that meet quality requirements with less human intervention,
rework, delay, or usage. If rotating arrangements across different real tasks instead
of matched snapshots, report the weaker causal comparison. After material model or
runtime changes, use a small regression set and fresh tasks to reassess retained rules.
