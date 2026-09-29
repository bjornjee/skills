# Paid compute, preservation and cleanup

## Before allocating

Record authority for payloads/destinations, resource count/type, spend, absolute
deadline, storage cap, retention and exact cleanup scope. Reuse existing explicit
authority without repeating per-run questions. A retry shares the original clock
and cost ledger unless the user explicitly changes them. An account top-up or
unmet score target cannot extend an expired window.

Prove backup and cleanup paths before paying. Verify cloud account identity,
region, bucket/destination and actual role permissions through supported ordinary
authentication; a familiar profile name is not evidence. Test the permitted
transfer/readback operation with a harmless small payload within scope. Keep
credentials and signed URLs out of repositories, logs and reports; do not extract
cached secrets. Short-lived object-specific authority can be suitable, but must
cover the operation and realistic transfer/verification duration.

Reserve the whole lifecycle: failed boots, setup, upload, smoke, training,
evaluation, checkpoint/recovery writes, transfers, destination verification and
teardown. Estimate current rates and exposure; distinguish estimates from invoices.
Measure throughput early and forecast remaining bytes at a conservative observed
rate, including full destination readback. Model training ETA omits these costs.

Measure full recovery size, not only inference weights. Reserve storage across
the entire user-defined scope, including accumulated retained artifacts, in-flight
final sizes, temporary archives, duplicates and atomic old/new replacement. Count
physical allocation appropriately for hardlinks. Archive retained overflow to an
approved durable store and verify it before local removal. Prune only authorized
superseded artifacts with exact removal receipts; historical backup PASS does not
prove current availability after pruning.

If local transfer is too slow, consider a proven direct path from GPU to approved
object storage. A helper, upload URL or proposed path is not completed preservation.
Do not allocate if required backup or teardown cannot fit the authorized bounds.

## One owner and current ledgers

Keep one run owner and linked run/resource/transfer ledgers containing immutable
input identities, exact owned resources, creation time/rates/deadlines, process or
session identity, phase, operation status, expected bytes/hashes, destination
identity and verification receipts. Record actions and receipts append-only;
update a current-state pointer without erasing failed attempts or partial outputs.
Use existing tooling; a ledger is not a reason to invent a cloud orchestrator.

Before acting, reconcile ledgers with current provider/process state. Poll only
known active sessions. Launcher completion alone does not imply lifecycle death.
Do not duplicate launches/transfers, poll completed sessions or contact retired
hosts. Bound polling, transfer buffers and concurrency explicitly for available
memory, bandwidth and the remaining budget.

Give unused failed boots a finite idle cutoff; verify compute and owned storage
removed before a replacement that would exceed the resource limit. After repeated
boot failures, investigate availability before spending again. Cancel boot-idle
cleanup once verified setup/uploads start; the artifact-preserving lifecycle
deadline then governs. Start backups as committed artifacts become ready, giving
large final recovery enough time rather than leaving it to the last transfer slot.

When monitoring is requested, reuse the current monitor and read fresh ledgers
each wakeup. Stay quiet on unchanged, non-actionable progress; notify meaningful
changes, failures or required action according to user preferences. Monitoring
does not authorize another launcher or extending the budget. Retire the completed
monitor under its authorization once preservation, cleanup and handoff are done.

## Destination proof precedes deletion

Preserve the contract-required weights/configs, predictions, metric counts,
summaries, READY markers, final full recovery and committed pointer, selection and
history, source/data/runtime manifests, logs and smoke evidence in approved storage.
Keep sensitive raw data and model payloads out of Git; repository reports should
contain permitted aggregates and provenance only.

For each required artifact, verify a full destination SHA-256 against the frozen
source manifest. Reconcile archive members against that manifest as well as the
archive hash. Exit 0, byte length, prefix hashes and multipart ETags are insufficient.
Bind conditional writes and receipts to the exact immutable key/object version,
full digest, run identity and verification time. Preserve receipts outside the
compute instance. A stale PASS from another version or a prior failed attempt
cannot certify the current object.

If multipart completion succeeds but its response is lost, reconcile the exact
object/version and full destination readback before retrying. Record a verified
completion only when identities and digest match; if identity remains ambiguous,
keep status unverified and preserve the source. Do not blindly repeat completion,
overwrite the object or start a second transfer. Use bounded streaming buffers and
concurrency for upload/readback, rather than loading a large recovery into RAM.

## Teardown and conflict handling

Recheck cleanup authentication while backups run. Use finite authentication waits
that leave time to notify the user and act before the cleanup deadline. A pending
sign-in call is not cleanup progress. Set a warning checkpoint from measured
remaining work, not a fixed historical allowance.

After all required backup verification, delete the exact compute **and owned
storage** through authorized supported flows. Verify both absent from active
inventories after asynchronous deletion; inspect the exact storage state.
Distinguish submitted, pending, verified recoverable deletion and permanent purge.
Normal deletion authority does not imply purge authority. Do cleanup before
discretionary analysis, unless explicitly instructed otherwise.

If preservation and cleanup no longer fit, stop opening new work and escalate
early with exact resources, cost estimate, verified/pending backups, remaining
bytes/throughput, deadline and concrete required action. Do not silently choose
either overrun or deletion of unverified required artifacts. Preserve the current
state while seeking a decision; silence is not an extension or loss authorization.
Provider deletion on depleted credit is not successful agent cleanup. Report who
performed deletion, deadline compliance and verified inventory state separately;
do not treat a UI balance or estimated exposure as a final invoice.
