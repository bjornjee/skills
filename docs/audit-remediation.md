# Global skills audit remediation

This change implements repository-owned findings from the September 7 audit. All implementation edits are inside this repository. It does not sync, reinstall, retire, or modify anything in the user's installed global configuration. The worktree was advanced to current main before implementation, preserving PR #83's GitHub publication guidance.

## Disposition of the 34 findings

| Audit finding | Repository action / remaining scope |
|---|---|
| 1 Source-of-truth split | Doctrine and install docs require a selected permanent checkout; sync records source path and payload hash. Actual checkout/global reconciliation remains separate. |
| 2 Escaping package | Root native manifest and root marketplace source; isolated package test. |
| 3 Unowned deletion | Per-file hashes, preserve extras, refuse conflicting unowned/edited files. |
| 4 Partial sync / CODEX_HOME | Destination preflight, private recovery journal, caught-failure rollback, custom home support. |
| 5 Unsupported safety promises | Repo docs state the actual advisory hook limits. The obsolete installed safety-guard is outside this repo and remains untouched. |
| 6 Stale / missing global skills | Safe v1 migration documentation and file ownership; actual reconciliation remains separate. |
| 7 Claude rule drift | Read-only check, permanent-checkout guard, unique backups. Existing globals remain untouched. |
| 8 Enforcement ownership | Reconcile LEARNINGS/README; preserve other owners' main-branch and commit registrations. |
| 9 Hook lexical defects | Quoted diagnostics, executable paths and Git option regressions; explicitly limited advisory behavior. |
| 10 Root overreach | Audit-only scope, authorization continuity, default-branch discovery, bounded I/O, explicit context inheritance. |
| 11 Architecture contradictions | Conditional FastAPI layers, Python tooling and module-system conventions; mirrored rules updated. |
| 12 Testing contradictions | Unit isolation versus hermetic integration, boundary proof, valid missing-API RED, root-owned verification profiles. |
| 13 Review scope | Caller-specified base/tip, full PR diff, untracked files and nested instructions. |
| 14 Review recall | Behavior/specification evidence accepted; remove numeric-confidence cutoff and mechanical cohesion/comprehension bans. |
| 15 Severity conflict | Shared critical/high blocking contract and consistent codegraph orchestration. |
| 16 Go/shell portability | Load bundled rule references; byte-parity tests. |
| 17 UI weight arithmetic | Raw score floor; weights affect repair priority only. |
| 18 UI evidence cycle | Behavior and audits before each grade; matching final revision; browser evidence owned by parent. |
| 19 UI states / exit | Disjoint states, mandatory defects remain blocking, explicit nonblocking tradeoffs, stop on PASS. |
| 20 Impeccable compatibility | Resolve runtime catalog, surface modes, bounded verification; remove obsolete product-register assumptions. |
| 21 Go factual errors | Correct cleanup timing, derived deadlines, and soft memory-limit guidance with primary references. |
| 22 Worker cancellation | Cancellable receive/send and context-aware processing; execute snippet under Go race testing. |
| 23 MCP path validation | Distinguish real paths from lexical resolution and specify component containment. |
| 24 MCP error/annotation semantics | Tool execution errors and untrusted annotation hints. |
| 25 Parser completeness | Explicit record boundaries and rejection; run intact/missing/neighbor scenarios. |
| 26 Claude model identities | Correct dateless snapshots and model-specific context limits. |
| 27 Claude loop | Allow valid repeated calls; explicit truncation/budget failures; bounded example tests. |
| 28 Index guidance | Statistics are review evidence, not deletion authority; query-plan/skip-scan qualification. |
| 29 Delegation identity/capabilities | Exact session ID, available command discovery, TypeScript reviewer, optional dashboard integration. |
| 30 Install ID / duplicate MCP | Correct README identity. Duplicate installed MCP registrations remain outside scope. |
| 31 Pet QA | Outside scope: hatch-pet is a personal global skill not owned by this repo. No edits or copying into this package. |
| 32 Pet overwrite / provenance | Same global-only follow-up; retain the audit's collision and provenance recommendations. |
| 33 Verification gaps | Isolated package/install/rollback tests, executable examples, version-against-base gate, independent workflow scenarios. |
| 34 Duplication/context | Simplify UI orchestration and remove overlapping rules; keep details in references. Personal media skill restructuring remains outside scope. |

## Decision frame

Execution is explicit install-time batch work under the invoking user's permissions. No background watchers, credentials, publishing, or network access are added to installation. Input volume is the repository payload plus previously recorded managed files; extra global trees are not scanned. The installer owns deterministic writes/recovery, while agents own instruction interpretation and evidence collection. The package exposes skills only.

External consumers are marketplace installation paths, the ownership manifest, and UI verdict readers. The v2 changes intentionally require migration and a major version bump; see [ADR 001](adr/001-global-skill-contracts.md). Coordination is limited to reviewing this PR and separately authorizing global rollout.

## Verification and limits

Final local verification: `make test` passes 104 tests; the version-against-base gate passes for 1.3.1 → 2.0.0; `git diff --check`, Bash syntax validation, and ShellCheck 0.11.0 pass. All 38 skill/agent frontmatter documents parse as YAML. The frontmatter check also exposed an existing unquoted colon in the TDD guide description; the corrected scalar is covered by a generated-TOML regression test. Independent code and instruction reviews reported no remaining blocking findings.

The bundled skill creator validator passes 14 of the 15 changed skills. Its remaining failure rejects Ponytail's existing `argument-hint` field; the same failure reproduces on the base branch. That Claude-compatible metadata is preserved. This limitation is separate from the successful YAML parse and repository test suite.

Regression tests first demonstrated unowned-file deletion, overwriting, late partial installation, ignored CODEX_HOME, parser record loss/merging, idle-worker cancellation failure, quoted-command false positives, and Claude-loop truncation/retry/budget failures. Tests invoke real child processes and isolated filesystem destinations; failure injection covers a caught rename error. No live global install or plugin enablement was used to verify this PR.

An isolated agent evaluated nine UI workflow cases: low/high weights, stale behavior evidence, P2 findings, optional-pass refusal, exhausted budget after edits, current Impeccable surface modes, accepted nonblocking tradeoffs, and contaminated reviewer context. This checks instruction interpretation, not the visual quality of a live application or every possible model response.

The hook is not a shell parser or security boundary. Per-file atomic rename plus rollback is not a cross-filesystem transaction; abrupt process death requires journal inspection/recovery. Serialization covers one CODEX_HOME; do not run different installers against the shared skill destination concurrently or edit managed files during installation. Normal tests do not call Anthropic, OpenAI image generation, or any paid model API.
