# Execution identity and recoverable training

## Freeze a reproducible start

Reuse the project's validated driver and supported contracts. Hash the parent
weights/config, ordered labels/head, datasets and lineage, code/package contents,
runtime and recipe. Verify both uploaded archives and extracted files. Validate
annotations, tokenization/window counts, intended trainable parameters, gradient
presence/finiteness and expected optimizer steps. Record intentionally frozen
parameters separately. An image tag alone does not identify the installed runtime.

Preserve exact intended warm-start values, including head ordering and any dtype
conversion; a post-load cast does not prove the loader preserved source values.
Select and verify precision, optimizer, trainable scope and output schema for the
actual experiment; preserve them as controlled variables unless they are the
declared intervention.

State which trajectory is intended:

- **Warm start:** starts a new experiment from a measured parent's weights; any
  optimizer reset is deliberate and recorded as a controlled variable.
- **Resume:** restores the committed training trajectory, including optimizer and
  other state. Loading inference weights with an empty optimizer is a new warm
  start, not uninterrupted continuation.

## Cheap proof, then a real-device smoke

Before paid compute, run the project's scoped regression checks and actual tiny
driver path, including smoke, continuous training and committed stop/resume.
Compare final weights, predictions, metrics, optimizer/scheduler/scaler state as
applicable, history and RNG; preserve the original parent. Declare numerical
equivalence tolerances when exact determinism is unavailable. Helper-level tests
alone do not prove subprocess or driver lifecycle behavior.

Bind proof to the tested input, implementation, recipe and runtime identities,
including its harness/output hashes. Reuse only matching evidence. A summary PASS
with missing artifacts is unverified. Changed recipes or data invalidate affected
proof; replacement hardware/runtime requires a fresh real-device smoke unless
the explicit compatibility contract already covers it. Do not disable admission
checks or edit old receipts to make a new contract appear validated.

Run smoke in a disposable output location on the actual training device/runtime.
Include a partial accumulation batch, intended gradients, optimizer steps,
evaluation, saved inference snapshot, committed recovery and intended exit state.
Check the final receipt and artifact hashes, not merely a “training started” log.
Its evaluation coverage must exercise the actual evaluator contract. Full training
starts separately from the immutable intended parent, never smoke-updated weights.

## Commit recovery, not just inference snapshots

An inference snapshot and READY marker do not establish recoverable training or
off-instance backup. Full recovery preserves:

- Weights at trainable precision; optimizer and any scheduler/scaler state.
- Relevant RNG states, sampler/data-order state, completed steps/epochs and history.
- The experiment contract and clear accumulation/epoch boundaries. Either commit
  with no pending gradients or preserve every pending state needed for exact resume.

Use the existing atomic writer: complete and flush new state, commit a hash-bound
pointer, then retire only the prior owned state according to retention authority.
Reserve space for both old and new states. Validate full hashes, pointer, contract
and progress before load. Hash integrity does not establish trust in executable
serialization; prefer tensor/primitive formats and restricted loading. Do not
load an arbitrary pickle from an untrusted source.

After interruption, reconcile partial evaluation/snapshot output with the last
committed pointer and actual process state. Preserve partial output; do not
silently overwrite it or delete it just to make resume pass. A finished launcher
can leave a detached lifecycle alive. Verify run/process identity and committed
stage before one owner resumes; unknown status never authorizes a duplicate run.
