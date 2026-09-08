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

Verification at version 2.0.1: `make test` passed 104 tests; the version-against-base gate passed for 1.3.1 → 2.0.1; `git diff --check`, Bash syntax validation, and ShellCheck 0.11.0 passed. All 38 skill/agent frontmatter documents parsed as YAML. The frontmatter check also exposed an existing unquoted colon in the TDD guide description; the corrected scalar is covered by a generated-TOML regression test. Independent code and instruction reviews reported no remaining blocking findings at that stage. The subsequent cold review identified the corrections below.

The bundled skill creator validator passes 14 of the 15 changed skills. Its remaining failure rejects Ponytail's existing `argument-hint` field; the same failure reproduces on the base branch. That Claude-compatible metadata is preserved. This limitation is separate from the successful YAML parse and repository test suite.

Regression tests first demonstrated unowned-file deletion, overwriting, late partial installation, ignored CODEX_HOME, parser record loss/merging, idle-worker cancellation failure, quoted-command false positives, and Claude-loop truncation/retry/budget failures. Tests invoke real child processes and isolated filesystem destinations; failure injection covers a caught rename error. No live global install or plugin enablement was used to verify this PR.

An isolated agent initially evaluated nine UI workflow cases. After the follow-up corrections below, a fresh isolated agent evaluated ten cases covering valid N/A dimensions, required locale/register evidence, budget exhaustion, preservation within the redesign, accepted tradeoffs, blocking audit findings, uncertain/definitive Linear creation outcomes, and medium-only codegraph findings. This checks instruction interpretation, not live UI or API behavior or every possible model response.

## Follow-up contract corrections

The stricter review distinguished conflicting contracts from valid domain specialization. This documentation/configuration follow-up preserves the existing standards and makes these corrections:

| Confirmed issue | Result |
|---|---|
| Obsolete UI critique example | Example follows the grader's eight-dimension output contract, including evidence and both gates; implementation follows the skill's coherent-batch and budget rules. |
| Numeric scores versus N/A and undefined REJECT | All eight keys remain present. Null scores require explicit N/A or UNVERIFIED exceptions; missing required evidence blocks acceptance. Verdict precedence is explicit. |
| Preservation N/A outside the redesign only | N/A requires an explicitly empty preservation contract; behavior within the redesign can still require verification. |
| TDD guide redefining profiles | The guide references core taxonomy and selects TDD by the change's proof needs, not a second set of profile definitions. |
| Overlapping codegraph approval categories | APPROVE has no remaining defects; WARNING has only disclosed medium/low findings, handled under core policy. |
| Missing Linear identifier called definitive failure | Reconcile uncertain results using bounded reads; definitive rejection stops; both retain the one-create-call limit. |
| Wrong Claude canonical-source notice | Claude identifies its own canonical adapter and installed rule-link provenance; shared policy stays aligned with Codex. |
| Delegation triggered by CLI alone | Both phase and dispatch table require the delegation skill's prerequisites, including plugin commands. |
| Atomic version-write claim | Documentation accurately describes updating and verifying the three manifests together. |

Clarifications keep the UI loop budget with the parent, distinguish database schema migrations from application writes, align planning dispatch with the existing planning phase, and scope the model-routing example to workflow design. Both doctrine adapters retain mandatory gates and distinguish doctrine, project, skill, agent, template, and runtime responsibilities. No changes were made solely to eliminate valid specialized language conventions, conditional mock policies, incident mitigation, or existing authorization exceptions.

Follow-up proof: 104 repository tests pass; all seven language mirrors match; all five changed skills pass the bundled skill validator. Both UI JSON examples parse, expose the same top-level fields and eight dimension keys, and have valid null-score exceptions and gate states. The strict instruction review found no blocker. These checks do not replace a future live rollout evaluation; no global sync or installation was performed.

## Cold-review corrections — version 2.0.2

| Finding or clarification | Correction |
|---|---|
| Claude plan mode unintentionally became optional | Restore the default plan-mode gate for nontrivial implementation and the planning red flags. Preserve the already-approved concrete proposal exception. Restore historical context in LEARNINGS; Codex retains its own runtime-supported workflow. This corrects a policy regression, not merely phrasing. |
| Single-line worktree exception contradicted the blanket source-edit ban | All three workflow clauses explicitly allow an authorized single-line fix in the source checkout unless stricter project instructions require isolation. Larger modifications remain isolated; read-only work remains read-only. |
| Relative CODEX_HOME depended on hook working directory | Reject nonempty relative values before writes. Absolute paths, including spaces, remain supported; the installed hook is exercised from a different directory. |
| Late Claude rule directory collision left earlier rules replaced | Check every planned rule destination for directory collisions before making backups or links. Keep the mutation-time check too; this is predictable-failure preflight, not a transaction or protection against concurrent editors. |
| MCP path guidance named only POSIX parent traversal | Use separator-aware component checks with the same path implementation for relative, absolute, and separator operations. |
| Parser decision diagram used universal percentages | Tie completion to task acceptance criteria and record accounting; calibrate confidence and validate repairs before acceptance. Correct the malformed opening sentence. |
| UI behavior template implied unlimited repair | WARN/FAIL block successful acceptance; exhausted verification budget stops with incomplete evidence or unresolved defects. |
| P3 optionality absent from the UI audit mapping | Preserve original severity and optionality; expose P3 separately in the map, grader, rubric, and example without turning suggestions into required work. |
| Reviewer ownership lists omitted TypeScript | Include TypeScript/Node and distinguish agent-owned review methods from governing doctrine/project rules. |
| CI checked only the grader's numeric example | Check both published JSON examples for eight dimensions, matching output fields, null N/A/UNVERIFIED exceptions, verification gaps, gate states, and P3 reporting. The critique example now demonstrates missing live evidence explicitly. |

Final proof for these corrections: `make test` passes **108 tests**, including the two installer failures first reproduced through real child processes with temporary homes. All three manifests declare **2.0.2**; the version-against-base check passes for **1.3.1 → 2.0.2**. `git diff --check`, Bash syntax validation, and ShellCheck 0.11.0 pass. Independent strict code and instruction reviews found no actionable defects in the correction diff. This is scoped evidence, not proof of optimal behavior across all future sessions. No installed globals were changed.

The hook is not a shell parser or security boundary. Per-file atomic rename plus rollback is not a cross-filesystem transaction; abrupt process death requires journal inspection/recovery. Serialization covers one CODEX_HOME; do not run different installers against the shared skill destination concurrently or edit managed files during installation. Normal tests do not call Anthropic, OpenAI image generation, or any paid model API.
