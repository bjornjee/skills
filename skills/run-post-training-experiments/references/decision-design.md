# Decision design under uncertainty

## Define the choice before the experiment

Name the decision-maker, intended use/population, available actions and real-world
consequences. Distinguish the desired outcome from its benchmark proxy. Specify
the minimum practically worthwhile improvement, asymmetric costs of errors and
hard constraints. Safety, authority and resource limits are eligibility conditions;
do not trade them away through a favorable weighted score.

The objective is expected final decision quality under these constraints. There
is no universally optimal experiment independent of objectives, assumptions and
available evidence. A score gain is useful only to the extent it changes a
consequential choice. An inconclusive result may still justify a different action
when the costs of acting and waiting differ; state the reasoning.

## Compare explanations and next actions

Maintain a short list of plausible mechanisms for the observed weakness and the
evidence for and against each. Separate data defects, inadequate coverage,
optimization limits, model constraints, measurement errors and runtime effects
where they are plausible. Do not turn an error correlation into a causal claim.

For each feasible next action, record:

| Question | Required reasoning |
| --- | --- |
| What will it resolve? | A consequential uncertainty and the competing explanations it distinguishes |
| What might be observed? | Predicted outcomes, uncertainty and the decision under each materially different outcome |
| What does it cost? | Full lifecycle cost, elapsed time, data/review effort, risk and the work it displaces |
| Why this action now? | Comparison with the strongest feasible alternative, including stopping |

Include audits, improved measurement, data repair, controlled training, replication
and held-out confirmation when relevant. Choose information for its expected
effect on the final decision, not novelty or volume. Use quantitative expected
value when defensible; otherwise document qualitative rankings, assumptions and
the conditions that would reverse them. Do not fabricate probabilities or a
precise utility score from weak evidence.

Consider downstream experiments that an action enables or eliminates. Immediate
gain per dollar is a useful heuristic, not a guarantee of the best sequence.
Account for setup reuse, switching costs and limited confirmation data. Bound
planning to the selected decision and plausible alternatives; do not enumerate
every possible recipe or reprocess all historical runs.

## Make effects identifiable

Choose the smallest design capable of answering the question. A single-factor
comparison is appropriate for an isolated effect; a factorial or other designed
comparison may be needed when factors interact. Declare which effects can be
separated, which are confounded and which conclusions the design cannot support.
Use randomization, blocking, paired comparisons or seed replication when they
address the actual source of variation. Neither single-factor changes nor a
particular statistical method are universal requirements.

For data interventions, state whether the estimand is the effect of the complete
training policy or of data content under controlled exposure/compute. Changing
data quantity, weighting and optimizer steps together cannot isolate content
quality without appropriate comparators. Record those differences even when the
combined-policy effect is the intended question.

Use lower-cost proxies only when their relationship to the target outcome is
credible for this decision. Record known ranking reversals and uncertainty; do
not eliminate a candidate solely on an unvalidated proxy. A hardware smoke proves
execution, not model quality. Reserve final confirmation at the intended fidelity.

## Update, stop and review the decision

Before observing results, record forecasts, continuation/stop criteria, practical
effect thresholds and the confirmation plan. After each bounded stage, update
explanations from the evidence; keep negative and inconclusive outcomes visible.
Do not retroactively change the hypothesis or gates to make the result favorable.

Continue only if a feasible next action is worth its expected decision benefit
after total cost and opportunity cost. Stop when the choice is sufficiently
supported, no affordable action is likely to alter it usefully, or constraints
bind. Preserve resources for required confirmation, recovery and cleanup. If
evidence cannot settle the question within budget, report it unresolved rather
than converting the budget limit into evidence of success or failure.

Judge decision quality using what was knowable at decision time: relevant
alternatives, data fitness, calibrated uncertainty and coherent tradeoffs. A lucky
outcome does not validate poor reasoning; a well-designed negative experiment
can prevent waste. Record what changed the choice and what remains untested.

Methodological foundations: [decision-theoretic experiment selection](https://proceedings.mlr.press/v202/daulton23a.html),
[multi-fidelity optimization](https://proceedings.mlr.press/v115/wu20a.html), and
[interaction-aware experimental design](https://www.itl.nist.gov/div898/handbook/pri/section2/pri212.htm).
These motivate the doctrine; no particular optimizer is required.
