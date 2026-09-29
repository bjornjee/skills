# Workload execution and recovery

## Verify the caller's prepared workload

Use the existing runner and its supported contracts. Pin the supplied command,
configuration, inputs, code/package and actual runtime identities. Verify uploaded
archive and extracted-file hashes. An image tag alone does not identify the
installed runtime. Check requested device/memory/capacity against the allocation;
return incompatibilities rather than silently changing the workload.

Require the project's applicable driver and real-device smoke evidence, bound to
the current implementation, inputs, configuration and runtime. Reuse matching
proof; changed identities invalidate affected proof unless explicitly covered by
its compatibility contract. Inspect receipts and artifact hashes, not just a
summary PASS. Run only authorized, bounded checks and include them in the budget.

A recovery-capable job needs evidence through the actual driver path, including
committed stop/resume when required by its contract. Helper-only checks do not
prove that lifecycle. The caller/runner supplies acceptance for these technical
checks; this skill does not invent scientific evaluation criteria. A smoke proves
execution compatibility, not model quality. Keep smoke state disposable and start
the full job from the caller's intended immutable inputs.

## Preserve complete recovery state

The runner owns recovery format and semantics. Consume its manifest and committed
pointer rather than inventing a checkpoint system. An inference snapshot or READY
marker does not by itself establish recovery or off-instance backup.

For resumable training, required state normally includes trainable-precision
weights, optimizer and applicable scheduler/scaler state, RNG and data-order state,
progress/history and the workload contract. The commit must define its accumulation
or step/epoch boundary; either no work is pending or all pending state needed for
resume must be preserved. Other workloads need their runner's equivalent state.
If the runner cannot supply required recovery, report that limitation before
admitting work that depends on it. Restart from scratch requires a caller decision
and remaining authority; it is not a successful resume.

Require complete state and full hashes before accepting the runner's atomic
committed pointer. Reserve space for old and new state during replacement. Retire
only owned states permitted by the retention contract. Hash integrity does not
make executable serialization trusted: use the runner's restricted loading path
and trusted provenance, never arbitrary untrusted pickle payloads.

## Reconcile before resume

Check fresh runner/process state and exact run identity. A finished launcher may
leave a detached job running. One allocation owner admits work within the declared
concurrency limit; do not create a second lifecycle for an unknown outcome.

Reconcile partial output with the last committed pointer, hashes, configuration
and progress. Preserve partial files; do not overwrite or delete them merely to
make resume pass. Resume only through the supported runner path when validated
state, resource limits and remaining deadline permit. Loading inference weights
with a fresh optimizer does not restore a training trajectory. Return unsupported
recovery or recipe changes to the caller rather than silently improvising them.
