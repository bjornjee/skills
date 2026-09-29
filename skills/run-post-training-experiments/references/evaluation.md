# Evaluation, diagnosis and experimental decisions

First establish [decision value](decision-design.md) and
[data fitness](data-quality.md). A precise metric on unsuitable data cannot
support the intended decision.

## Lock the question and measurement

State the intervention, controlled variables, predicted error changes, evaluation
track and acceptable regression limits as a falsifiable hypothesis. Include a
null/no-improvement outcome and a bounded number of attempts. Record unique data
separately from replay exposures and actual tokenizer/window counts. A narrow
coverage diagnostic is evidence for a hypothesis, not proof of causation.

Freeze evaluation inputs, gold, annotation policy, label order, evaluator code and
inference configuration. Record matching rules, units, aggregation, denominators,
threshold operators, missing-output behavior and rounding. Compute metrics from
complete predictions and their underlying measurements. A proxy metric or training
loss cannot substitute for the declared acceptance metric.

Set global and every required category/slice gate before running. Specify minimum
support and the handling of zero-support/undefined metrics; they are unvalidated,
not automatic passes. Incomplete, failed or unsupported predictions must remain
visible and cannot quietly disappear from the denominator. Compare unrounded
ratios using the declared operator: a strict greater-than gate excludes equality.

## Diagnose the mechanism

Compare saved predictions on the same examples. Separate:

- Distinct task-relevant error classes and their proposed mechanisms. Avoid adding
  overlapping diagnostic counts together as though they were disjoint errors.
- Previously correct outputs lost, newly correct outputs gained, new false
  positives and removed false positives where applicable. Show safety-relevant
  regressions even when the aggregate metric improves.
- Model discrepancies from annotation uncertainty. An output absent from gold
  must not become a training negative without establishing that it is incorrect.

Use qualified, independent adjudication for gold corrections; where feasible,
hide model predictions during adjudication. Preserve the original track and
evaluate every comparator again on the successor gold. Separate label effects
from model effects. An error-selected audit estimates no population error rate.

Repair training supervision or create genuinely separate training material within
the authorized data workflow. Exclude evaluation inputs and related records;
record provenance and collision checks. Exact/normalized deduplication
does not prove source/template independence. A taxonomy change needs explicit
task/schema agreement and a versioned comparison plan, not retroactive relabeling
of a losing result.

## Compare candidates without hiding tradeoffs

Include the measured incumbent, immutable training parent if different, and all
meaningful saved checkpoints. Recompute metrics from complete predictions rather
than trusting a stale selection summary. Report at least:

| View | Evidence |
| --- | --- |
| Global | Declared task metrics, underlying counts/measurements, support and exact gate outcomes |
| Categories/slices | Every required category and cohort with support and the same counts/metrics |
| Paired changes | Lost/gained correct outputs, added/removed errors, uncertainty of the candidate-minus-comparator contrast |
| Selection | Best measured, qualifying set, deterministic winner/tie outcome, all unmet gates |

Predeclare a deterministic selection rule and tie breaker among candidates passing
every gate. Where quality, safety, latency or cost conflict, report
non-dominated (Pareto) candidates under the declared objectives; do not invent a
weighted score after seeing results. No qualifying candidate means no gate pass,
even if training exited successfully or the global score increased.

## Paired uncertainty and confirmation

Use the same resampled units for each candidate in a paired comparison. Choose
clusters from the real sampling process. Stratify by cohorts when justified and
preserve group integrity. Clusters that share an upstream source can still be
dependent; use a suitable larger/hierarchical unit or disclose the remaining
dependence. Record group membership, method, seed, replicate count and
interval construction. Choose enough replicates for stable estimates within the
analysis budget and justify the sampling design for the selected data.

Report absolute and paired-difference intervals. An interval containing zero is
inconclusive under that sampling model, not proof of equivalence. Sampling
uncertainty does not cover training-seed variance, selecting the best of many
checkpoints or residual dependence. Use separate bounded seed replication if that
question matters. Repeated development reuse creates selection optimism; reserve
an untouched confirmation track where available. If none exists, limit the claim
to development evidence and state what confirmation is missing.

Use the practical effect threshold and decision consequences alongside statistical
uncertainty. Prespecify repeated-look/selection handling and confirmation; ordinary
fixed-sample intervals are not automatically valid after optional stopping or
repeated checkpoint selection. Separate exploratory ranking from confirmatory
claims. Choose the next action using the decision-design reference rather than
automatically scheduling another epoch or data repair.
