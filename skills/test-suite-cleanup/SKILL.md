---
name: test-suite-cleanup
description: Use when the user requests a one-time cleanup of an accumulated test suite. Inventory existing protection and propose test-only packages for human approval.
---

# Plan a one-time test-suite cleanup

Explore this repository and propose a small first wave of substantial, nonoverlapping tasks to improve test quality.

Your responsibility is discovery and planning only. Do not change repository files, implement tests, or dispatch workers. Produce a reviewable proposal and stop for user approval.

1. Scope and boundaries

All proposed implementation tasks must be test-only. Production code, documentation, schemas/policies, configuration, dependencies, lockfiles, build scripts, and CI remain unchanged.

Use existing tools and test infrastructure. Do not install dependencies, provision environments, or call live services during discovery. Keep generated reports, verification scripts, and test outputs outside the repository.

Preserve existing changes. Record the repository revision and working-tree state so the proposal has a clear baseline.

2. Discover features and existing protection

Work from both directions:
- Feature down: identify intended behaviors, actors, states, boundaries, and failure cases.
- Tests/code up: identify what is implemented, what tests actually assert, and what remains unprotected or uncertain.

Gather evidence from requirements, README/product documents, accepted decisions, API/UI/CLI/worker entry points, implementation, and tests. Representative local journeys can supplement this when safe prerequisites already exist; clicking every button is not a complete feature inventory.

Cite relevant files and lines. Distinguish intended requirements, observed implementation, characterization tests, and unresolved assumptions. Existing code alone is not proof of correct behavior.

Give every meaningful capability—including deferred capabilities and those without tests—a concrete behavior, source/entry point, authority or explicit uncertainty, and implementation status. Do not hide unrelated features in a generic “remaining work” category.

Inventory tests across all packages and runner configurations, including tests outside conventional test folders. Cross-check tracked files and record exclusions or unsupported formats. Distinguish test files from executable test cases.

Inspect shared fixtures, helpers, imports, and resources before deciding ownership boundaries. For assigned tests, retain complete source references or snapshots supporting dependency relationships, resolved destinations, and affected consumers. Do not claim completeness from truncated snippets. Unresolved material dependencies become pre-edit gates.

3. Assess test quality

For the proposed packages, inspect actual assertions and fixtures. Look for:
- Meaningful observable behavior rather than implementation details.
- Happy paths, boundaries, errors, and relevant state transitions.
- Realistic inputs and assertions that would detect a plausible defect.
- Excessive mocking, assertions that only confirm mocked behavior, brittle snapshots, nondeterminism, and unnecessary duplication.
- Valuable regression protection that must be preserved.

Label findings as preserved strength, demonstrated weakness, confirmed gap, investigation candidate, or unavailable evidence. Do not infer missing protection from filenames or a keyword search alone.

Use coverage, when available, to locate unexercised code. Equal coverage does not establish that two tests are interchangeable: inputs, roles, states, assertions, and detected faults may differ. Do not optimize for test count or a coverage percentage.

4. Establish an honest baseline

Inspect runner commands before executing them. Run bounded local checks where existing prerequisites permit.

Use existing environments without automatic installation or syncing. Disable caches or redirect writes outside the repository. Set explicit command timeouts.

Record exact commands, working directories, required nonsecret environment overrides, stdout, stderr, exit status, and timeout status. Distinguish:
- Collected tests from executed tests.
- Partial collection from complete discovery.
- Passing checks from failures, skips, timeouts, and missing dependencies.
- Missing executables from missing project dependencies or model/data/service prerequisites.

Do not require a full-suite run merely to complete discovery. Explain what unavailable evidence prevents you from concluding. Compare repository state before and after discovery.

5. Propose substantial, exclusive packages

Normally propose 2–4 coherent feature packages. Size them by contracts, complexity, dependencies, and validation effort—not arbitrary folder boundaries or file counts. Smaller repositories may justify fewer packages.

Explicitly defer the remaining scope with reasons. Deferral does not imply low value.

For each package, provide:
- Responsibility in at most two sentences.
- Feature contract and supporting authority.
- Exact existing and optional-new test paths it may edit.
- Concrete, cited quality targets and valuable protection to retain.
- Shared helpers, consumers, resources, and cross-feature check owners.
- Relative effort and readiness: ready, setup required, or decision required.
- Exact focused test commands, selected tests, working directory, required environment, and prerequisites.
- One feasible defect-detection check: known-bug replay, targeted fault injection, or a small mutation sample in a disposable copy.
- Required acceptance evidence and remaining limitations.

For the defect check, identify the source location, exact proposed fault or replay, scenario, expected assertion difference, and why execution reaches the relevant behavior. Label unexecuted checks as proposals.

Fault checks are plans only during discovery. Future execution must use an isolated copy and only that package’s prerequisites, verify that the test loads the intended copy, and compare original, faulted, and restored results. Equivalent or unreachable faults, setup/collection failures, and timeouts are inconclusive—not proof of assertion quality.

Keep machine-readable inventory, ownership, and command records. Retain the actual checking commands/scripts and outputs; derive reported counts from them. Mechanically verify:
- Every inventoried test candidate is assigned once or explicitly deferred.
- Write allowlists do not overlap.
- Existing paths exist and proposed new paths do not collide.
- Command selectors resolve from their stated working directory and cover the assigned tests.

Self-authored success flags are not verification.

New tests must be discoverable by the unchanged normal runner. Give shared test helpers one owner or freeze them and identify affected consumer checks. Global fixtures remain read-only.

Exclusive file ownership does not guarantee runtime independence. Explain which packages can run in parallel and which checks require sequencing or resource isolation.

6. Define future implementation and acceptance rules

Workers must establish a runnable baseline before editing and document existing failures separately from introduced failures. They may add or improve tests, consolidate justified duplication, or conclude that no change is warranted.

Every deletion, consolidation, or removed assertion needs a short ledger:
- What behavior it protected.
- Why the change is justified.
- Which retained test protects it, or what authority retires the requirement.
- What evidence supports the decision.

Evaluate retained tests collectively so separate workers cannot each delete protection while relying on the other’s test.

Production defects must be reported separately. Do not fix production code, weaken assertions, or add skips/xfails to conceal failures. Temporary faults belong only in disposable validation copies and never in delivered changes.

Expanding an approved write allowlist requires a revised contract and approval.

Require independent review of requirements, the exact test diff, removal ledger, and raw results. The reviewer should independently select representative boundary or fault checks and return accept, rework, or blocked with evidence. Passing coverage or agent agreement alone is insufficient.

Propose—but do not dispatch—a final read-only validation task for one integrated revision. It must verify test-only scope, normal discovery and relevant project gates, shared contracts, cumulative removals, and available coverage/fault evidence. Missing evidence must remain explicit. Return required fixes to named owners; do not make unowned edits.

7. Deliver for human review

Return:
- A concise feature map and baseline summary.
- A package table with the contracts above.
- Exact ownership, command records, and deferred-scope details in an appendix.
- Links to supporting evidence and mechanical check results.
- Parallel/sequential execution recommendations.
- A recommended pilot and decisions needed before dispatch.

Make three decisions distinct: approving scope, confirming environment readiness, and accepting completed test changes.

State unresolved requirements and verification limits plainly. Do not replace missing evidence with confident prose.

Stop for review. Do not dispatch or implement.
