---
name: run-post-training-experiments
description: Choose, design and run post-training experiments using decision value, data fitness and controlled evaluation. Use for fine-tuning or continued-training trial planning, data-quality diagnosis, checkpoint comparison and bounded execution/recovery; deployment and bulk dataset generation are separate workflows.
---

# Run Post-Training Experiments

Choose experiments that improve the expected quality of the final decision within
the available budget. Establish whether the data can support that decision before
optimizing a model. Reuse the project's runner, evaluator and artifact tooling.
Successful execution, measured improvement, experimental acceptance and deployment
are separate outcomes. Do not build a training framework to apply this skill.

## Decision quality and data fitness first

Read [decision design](references/decision-design.md) to define the choice, compare
possible experiments and decide when to stop. Specify the intended real-world
outcome, minimum worthwhile improvement, costs of wrong decisions and hard
constraints. Compare competing explanations and feasible next actions, including
auditing data, replication, confirmation and stopping. Ask which possible results
would change the decision; information with no decision consequence has little
value. Record uncertainty without inventing precise probabilities.

Read [data quality](references/data-quality.md) before trusting a benchmark or
proposing a data intervention. Establish target-population relevance, coverage,
label validity, independence, provenance and effective diversity separately for
training and evaluation. Hashes prove identity, not fitness. Missing evidence
limits claims; a material validity failure calls for a bounded audit or repair
before a run that would rely on it. More rows alone do not establish better data.

## Establish the experiment

Identify whether the request is planning, execution, recovery, monitoring or
comparison. Planning and comparison do not authorize paid allocation, transfers
or deployment. Honor existing explicit authority; resolve only missing material
scope. For an existing run, read fresh run/resource/transfer ledgers and reconcile
actual state before any launch or retry. Do not take over another lifecycle owner.

Prepare a short experiment contract before execution:

| Decision | Record |
| --- | --- |
| Intended choice | Available actions, target population/outcome, practical value, unacceptable losses and evidence that would change the decision |
| Hypothesis | Measured incumbent errors, competing explanations, predicted changes, falsifying result and retention risks |
| Data fitness | Training/evaluation roles, quality evidence, source/group structure, coverage, unresolved defects and allowed claims |
| Intervention | Bounded design, identifiable effects/interactions, controlled variables, parent, optimizer-start semantics, comparators and checkpoint schedule |
| Evaluation | Frozen/versioned gold, exact metric semantics, required categories/slices and support, all gates, deterministic selection/tie rule, uncertainty method |
| Identity | Hashes of weights/config, label order/head, data/lineage, code, packages/runtime and recipe |
| Work and authority | Selected rows/tokens/windows, epochs/steps, evaluation/checkpoint count, hardware/resource limit, payload/destinations, finite total spend/time, storage cap and cleanup scope |
| Ownership and failure | One lifecycle owner; runner owns committed progress, evaluator owns counts, artifact store owns preservation; stop/reconcile/escalate conditions and rollback to retained incumbent |

Execution is offline batch work bounded by this contract, not interactive request
work or a scan of accumulated experiment history. Inventory only the selected
comparators and the storage scope governed by the user's cap. Reuse valid proof
only while its bound identities match; missing evidence is unverified. A retry,
top-up, elapsed authorization window or missed score target does not extend the
budget. Separate preparation, training and promotion authority.

## Design before optimizing

Read [evaluation and diagnosis](references/evaluation.md) when designing the
hypothesis, evaluating checkpoints or choosing a next experiment.

Start with the incumbent measured on the locked track. Diagnose task-relevant
error classes and their likely mechanisms before choosing a change.
Further optimization on unchanged data and training-data repair are different
experiments. Use the smallest design that can distinguish the relevant effects;
multiple factors may be necessary to identify interactions. A bundled change
without separating comparisons identifies only its combined effect. Predict both
intended gains and likely regressions.

Never copy evaluation inputs or related records into training
repairs. Independently adjudicate suspected gold errors, version corrections and
rescore every comparator. Do not remove rows or merge/drop labels to cross a gate.
Treat a genuine taxonomy change as a new task/schema decision with comparable
evaluation. Reused development evidence is not an independent test or
production validation.

## Prove, execute and preserve

Read [execution and recovery](references/execution-and-recovery.md) before changing
a runner, preparing a warm start, running smoke or resuming. Read
[GPU lifecycle](references/gpu-lifecycle.md) before paid provisioning, transfers,
monitoring or teardown.

1. Complete local preparation and scoped regression proof plus the real tiny
   driver lifecycle: smoke, continuous run, committed stop/resume. Check actual
   weights, predictions, optimizer/progress and RNG; helper-only tests do not
   establish driver recovery. Preserve the immutable parent.
2. Prove backup and cleanup access, reserve the full lifecycle budget and storage,
   and measure transfer feasibility including the largest full recovery state.
3. Verify uploaded inputs and actual runtime. Run a separate real-device smoke
   that exercises partial accumulation, evaluation and committed recovery.
   Require identity-bound success before full training from the original parent;
   smoke-updated weights never become the full-run start by accident.
4. Run one lifecycle. Track committed checkpoints and bounded transfers in fresh
   ledgers. Unknown session outcomes require reconciliation, not resubmission.
   Stop opening work when verified preservation and teardown no longer fit.
5. Verify required artifacts at their destination, then remove the exact compute
   and owned storage and verify both absent from active inventories. Finish cleanup
   before discretionary local analysis. Escalate budget/preservation conflicts
   early; never silently choose overrun or loss of unverified required artifacts.

## Compare and decide

Compare the incumbent and all meaningful checkpoints on identical evaluation
versions/runtime tracks. Show global and category/slice results with support,
counts and regressions; show paired uncertainty using the real dependence units.
Report **best measured**, **qualifying**, and any relevant **Pareto tradeoffs**
separately. Apply the predeclared deterministic selection rule only among eligible
candidates. If none qualify, report unmet gates and retain the incumbent unless
replacement is separately authorized.

End with the hypothesis verdict (supported, contradicted or inconclusive), updated
beliefs, data limitations, remaining budget and preservation/cleanup status.
Explain which decision the evidence supports and what could still change it.
Continue only when a feasible next action has enough expected decision value to
justify its full cost, retaining confirmation and closure reserves. A negative
result can justify stopping; more epochs or examples are not automatic next steps.

Before separately authorized promotion, replay the full locked evaluation in the
intended serving runtime. Keep differing runtime score tracks, lineage and rollback.
A small HTTP smoke and saved GPU metrics do not establish serving acceptance.
