# ADR 003: Correct global contracts within their owners
Status: accepted for implementation after the September 8 repository audit.
Context: shared skills had conflicting scope/tool choices and an optional reminder used unsafe, ineffective state/output contracts.
Decision: core retains mandatory guarantees; projects own local tools; domain skills own technical criteria; workflows and agents follow those owners.
Decision: keep the optional Bash hook entrypoint and use Python 3 standard-library JSON, private descriptor-based state, and nonblocking file locking on macOS/Linux.
Authority: the hook runs locally only when explicitly configured; it emits advice, never invokes compaction, and has no network or publication role.
Scale: one bounded input and one hashed session counter per invocation; no cross-session scan; contention skips an advisory update.
Failure: malformed input or unsafe/unavailable state skips the reminder; runtime permissions and required verification remain authoritative.
Consumers: global skill users receive the corrected contracts only after their normal explicit installation; the helper requires Python 3.
Rollout: review in four scoped PRs; preserve the agreed single-release version treatment; do not sync installed globals as part of implementation.
Rollback: revert source changes before installation; after an explicit rollout restore verified installed-file backups. Ignore old shared-temp counters; do not migrate or delete them by name.
