# Data fitness for a decision

## Define what the data must support

Assess fitness relative to the intended use and claim, not a universal quality
score. Training data must supply valid learning signal; evaluation data must
support a trustworthy comparison for the target population. Those roles need not
have identical sampling distributions. A clean but irrelevant dataset can be
unfit, and a large dataset can contain little independent information.

Before a consequential experiment, keep a compact data statement:

| Dimension | Evidence to establish |
| --- | --- |
| Purpose and population | Intended use, source population, collection period/conditions, inclusion/exclusion rules and known coverage gaps |
| Provenance and authority | Source, permitted use/destinations, transformations, version and ownership of corrections |
| Composition | Independent groups, unique content, duplicates/replay, weighting, required slices and missingness |
| Supervision | Annotation/rubric version, reviewer competence and calibration, disagreement, uncertainty and adjudication |
| Independence | Split unit, lineage across splits, contamination checks and prior exposure to selection/tuning |
| Technical integrity | Valid schema, labels/targets, transformations and actual tokenizer/window or task-unit behavior |
| Fitness verdict | Supported claims, material defects, unresolved uncertainty and the bounded audit/repair needed |

Separate facts, estimates and unknowns. Choose audit depth for the decision's
stakes and suspected failure mechanism. Use representative sampling to estimate
defect prevalence and targeted audits to investigate mechanisms; report their
selection separately. A failure-selected sample cannot estimate population rates.
Do not demand an exhaustive census when a bounded audit answers the question.

## Coverage and independent information

Compare the data-generating process with intended use, including important rare
conditions, negative cases, changing conditions and out-of-distribution behavior.
Report support and uncertainty for required slices. Distinguish representative
evaluation from deliberately oversampled challenge sets; report them separately
or use justified prespecified weighting. Do not present challenge-set prevalence
as population prevalence.

Track independent source/group counts as well as rows and tokens. Duplicates,
replay and transformations of the same source increase exposure without creating
equivalent independent evidence. Balance retention and targeted repairs according
to the hypothesis; do not rebalance blindly or equate uniform labels with quality.

Synthetic data requires source/rule validity, diversity and transfer evidence.
Generator variety, reviewer agreement or a high synthetic benchmark score alone
does not establish representativeness of real use. Preserve lineage and disclose
shared generators, templates or sources that may create correlated blind spots.

## Trustworthy supervision and measurement

Check annotation consistency, completeness and semantic correctness against an
explicit task definition. Calibrate reviewers or automated judges against
independent trusted judgments appropriate to the domain; agreement alone does not
prove correctness. Do not let the candidate model define its own evaluation gold
or use the same unvalidated judge as the sole generator and acceptance authority.

Keep ambiguous, disputed and missing labels visible. Do not silently convert
unknowns into negatives or remove difficult records to improve a score. Use
independent adjudication for corrections, retain the original version and rescore
every comparator on corrected gold. If a rubric or schema changes, version the
task and separate its effect from model improvement.

A material measurement defect blocks the conclusion that relies on it. It need
not block a scoped diagnostic experiment designed to resolve that defect. State
which claims remain possible while the uncertainty is unresolved.

## Split by lineage and preserve confirmation

Split at the dependence unit required by the intended claim before augmentation
or derived-data generation. Keep related records on the appropriate side of the
boundary; detect exact, normalized and relevant near-duplicate/source overlap.
Fit learned preprocessing and selection rules on the training/development side,
not on protected confirmation data. Check temporal and feature availability against
what the serving system will actually know. Hashes do not detect these leakages.

Use separate training, exploratory development and protected confirmation roles.
Once confirmation results inform tuning, that data is no longer untouched
confirmation evidence for subsequent candidates. Obtain fresh confirmation or
use an explicitly justified adaptive-inference protocol; do not merely rename the
reused set. Disclose contamination that cannot be ruled out.

## Repair the bottleneck, then reassess

Tie each collection, correction, filtering or weighting action to a diagnosed
failure and predicted effect. More examples are justified by a coverage or learning
need, not by row count alone. Preserve valid retention coverage and avoid copying
evaluation inputs or related records into repairs. Use controlled comparisons to
separate data content from changed exposure/compute when making that causal claim.

Version accepted repairs and their provenance; repeat the checks affected by the
change. End with an explicit fitness decision and claim limits. Neither successful
validation scripts nor flawless file hashes establish semantic data quality.

Methodological foundations: [dataset documentation](https://arxiv.org/abs/1803.09010)
and [leakage and evaluation validity](https://arxiv.org/abs/2207.07048).
