---
name: manage-gpu-runs
description: Provision, monitor, recover and tear down bounded GPU workloads with verified artifact preservation and finite cost, time and storage limits. Use for paid GPU allocation, job supervision, transfers and cleanup; experiment design, candidate selection and model-quality acceptance belong to the caller.
---

# Manage GPU Runs

Run an authorized workload through a complete resource lifecycle: prepare,
allocate, supervise, preserve, verify and clean up. Use the project's existing
runner and supported provider tools. This is standalone operational guidance;
it requires no particular optimizer, orchestration framework or companion skill.

## Keep responsibility explicit

| Owner | Responsibility |
| --- | --- |
| Caller (person, script or optimizer) | Workload choice, inputs/recipe, scientific evaluation, candidate selection and whether to request another job |
| This skill's operator | Resource admission, one lifecycle owner per allocation, launch supervision, finite limits, transfers, preservation and verified cleanup |
| Existing workload runner | Workload execution, job progress, output generation and committed recovery semantics |

Accept a concrete job or bounded batch through the existing brief, configuration
or runner interface. Do not create an integration API or install a framework just
to use this skill. Preserve caller-supplied evaluation outputs as artifacts;
their interpretation and the next experiment remain outside this skill.

An optimizer request is not spending authority. Execute it only inside existing
user-authorized scope, including resource count, approved inputs/destinations and
remaining budget. Honor that authority without repeated per-job questions. A
metric target, top-up or retry does not extend it. Planning or inspection alone
does not authorize allocation; successful execution does not authorize deployment.

## Establish the run contract

Before paid allocation, record the minimum operational facts:

- Exact workload command/job configuration, input/code/runtime identities,
  expected output manifest and runner-defined completion/recovery conditions.
- Resource requirements, approved provider/destinations, allocation ownership,
  finite resource/concurrency count, retry allowance and any authorized reuse.
- Total spend, absolute deadline, storage/retention limits and warning, stop,
  preservation and cleanup boundaries. Include prior attempts in shared limits.
- Required artifacts and recovery state, verified backup/cleanup access, capacity
  reservations and a feasible transfer/verification/teardown forecast.

Bound work to this run/batch and the storage scope governed by the user's cap.
Track resource status, workload status, backup status and cleanup status separately.
Missing operational prerequisites leave admission unverified. Ask only for material
missing scope while completing feasible preparation; never launch from guesses.

Read [lifecycle management](references/lifecycle.md) before provisioning,
monitoring, transfer or cleanup. Read [workload execution and recovery](references/execution-and-recovery.md)
before launch or resume. These references define the operational checks without
choosing a model, dataset, metric or training recipe.

## Manage the lifecycle

1. Prepare the package locally. Reconcile any existing allocation, active jobs,
   sessions and transfers before launching or retrying. Unknown status means
   reconcile, not duplicate. Do not contact retired hosts.
2. Verify authority, backup and cleanup paths, capacity and full-lifecycle cost.
   Allocate only within the approved limits. Bound failed-boot idle time and
   verify owned resource cleanup before a replacement would exceed those limits.
3. Verify the actual hardware/runtime and uploaded files. Require the runner's
   applicable, identity-bound smoke/recovery proof. Keep disposable smoke output
   separate from the intended workload start. Launch through the existing runner.
4. Supervise known active work and preserve committed outputs incrementally.
   Recheck preservation forecasts and cleanup access. Stop admitting new jobs
   before they consume the reserve needed for artifact verification and teardown.
5. At the authorized lease/batch end, verify every required artifact at its
   destination, delete exact owned compute and storage, then verify both absent
   from active inventories. An individual job ending does not require teardown
   while an explicit bounded reuse lease remains valid.

Use runner-defined safe-stop/resume boundaries within the resource deadline;
escalate early if required artifact preservation conflicts with that deadline.
Never silently choose budget overrun or loss of unverified required artifacts.
Do not alter the workload recipe, add epochs or choose candidates to recover
from a resource failure. Return those decisions to the caller with evidence.

## Operational handoff

Return the run identity and actual execution outcome, including failures or partial
completion; verified artifact locations/object versions and digests; recovery
pointer/status; elapsed time and estimated versus verified cost; exact resource
and cleanup states; remaining authority; and any concrete required user action.
Keep credentials and signed URLs out of handoffs and logs.

Report job completion, artifact preservation and resource cleanup independently.
Pass through the caller's requested evaluation artifacts without declaring a
scientific winner. End or update authorized monitoring when its work is complete;
do not leave it polling finished sessions or retired resources.
