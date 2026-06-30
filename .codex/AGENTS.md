# Core

> *Canonical source: `~/Code/bjornjee/skills/.codex/AGENTS.md`. To change doctrine: edit the canonical file, bump the skills-plugin version, run `make sync-codex-rules` from the skills repo. Do not edit the destination copy at `~/.codex/AGENTS.md` directly.*

Always-on doctrine for Codex CLI. Loaded every session.
What to do, in what order, and which skill to reach for. Methodology for
each step lives inside the corresponding skill in `~/.agents/skills/`, not here.

## First principles (what to value)

- **KISS.** Simplest thing that works. No premature abstraction. Three clear lines beat one extracted helper.
  - Don't introduce a service layer for in-memory CRUD. Routes calling a store directly is fine until the logic warrants extraction.
  - Don't create a custom exception class when `HTTPException(404)` (or the equivalent in your framework) already does the job.
  - Don't add `ruff`, `mypy`, `pre-commit`, `Makefile`, or CI configs unless the brief asks. Add them when you actually need them.
  - Simple must still be bounded under the real workload. Prefer direct code, but do not confuse fewer lines with acceptable cost.
- **DRY.** Shared logic in shared packages. Constants/types defined once and imported. Copy-paste means extract.
- **No just-in-case code.** No feature flags, backwards-compat shims, or fallbacks unless tied to an explicit migration.
- **One way to do things.** If a pattern exists, follow it. Don't introduce alternatives.
- **Battle-tested over hand-rolled.** If an OSS project solves 80%+, adopt or port it. Conversely, stdlib over third-party when stdlib suffices.
- **Bounded work.** Every implementation must make the unit of work explicit: what input size it scales with, what triggers it, and where it runs. Work that scales with all user history, all files, all rows, all agents, or all external state is suspect unless the plan bounds it, batches it, caches it, indexes it, or moves it off the critical path.
- **The ladder.** Read the task and trace the real flow first. Then stop at the first rung that holds:
  1. Does this need to exist? (YAGNI)
  2. Already in this codebase? Reuse, don't re-implement — grep before you write.
  3. Stdlib does it? Use it.
  4. Native platform feature? Use it.
  5. Installed dependency? Use it.
  6. Can it be one line? One line.
  7. Only then: the minimum that works.

  Lazy about the solution, never about reading the problem. Trust-boundary validation, data-loss handling, security, and accessibility are never on the chopping block. Mark deliberate shortcuts with a `ponytail:` comment that names the ceiling and upgrade path (e.g. `// ponytail: global lock, per-account locks if throughput matters`).

## Workflow phases (in what order)

1. **Research.** Search the existing repo, library docs, and package registries before writing anything new. Output: a one-line "what already exists" answer.
2. **Plan.** No code until the approach is agreed. Break work into phases, identify risks and affected files.
   - **Execution context.** Identify the code paths touched and classify each as interactive, request/response, background, startup, test-only, or batch. State what calls it, how often it can run, and what blocks while it runs.
   - **Scale shape.** State the data volume the change scales with and whether that volume is bounded by the current request/selection or by global accumulated state. If it scales with global state, the plan must include a bounding strategy.
   - **Critical-path rule.** Interactive and request/response paths may only do bounded CPU work and bounded I/O. Unbounded scans, subprocesses, network calls, full-history reads, or fanout must move to startup/background work, an index/cache, a queue, or an explicit incremental strategy.
3. **Implement (proportional proof).** Use RED → GREEN → REFACTOR when changing behavior, fixing a bug, or protecting a regression. For surgical docs/config/mechanical edits where a new test would only assert the implementation, do not add padding tests; run the smallest relevant existing proof or state why none applies.
   - **Verification profile.** Pick one before editing and escalate if the diff grows:
     - Surgical: docs, rules, config, generated metadata, or trivial isolated helpers. No implementation-only tests.
     - Targeted: isolated behavior with nearby coverage. Run the specific test/package/validator command.
     - Full: public APIs, shared state, persistence, auth/security, migrations, concurrency, test/build infrastructure, broad refactors, or unbounded risk. Run the full project gate.
   - **Ownership boundary.** This core doctrine owns the profile taxonomy. Workflow plugins and skills, including agent-dashboard, may require selecting a profile and proof command, but must reference these rules instead of redefining the profile meanings.
   - Prefer scoped commands during the loop (`pytest path::test`, `go test ./pkg`, `node --test file.test.js`, `terraform validate` in the touched module). Reserve `make test`/full suites for Full-profile changes, before PR/push when available, or when the scoped proof cannot bound the risk.
   - When TDD applies, the test fails before code and passes after. Show the failing output before writing implementation; show the passing output before refactoring.
   - **One assertion focus per test.** Do not bundle create/get/list/patch/delete into a single test — split into separate `test_*` functions. Failure localization matters.
   - **Cover golden path + edge cases + error paths separately.** Three atomic tests beat one fat test that asserts everything.
   - **Use a shared fixture** (e.g. `client` in `conftest.py`) for setup. Don't instantiate `TestClient(app)` or equivalent inside every test.
   - **Scale test when scale matters.** If correctness depends on data volume, call frequency, concurrency, or latency, write a failing test, benchmark, or measurable reproduction that represents that risk before implementation. Do not rely only on tiny functional fixtures.
   - **Root cause, not symptom.** Grep every caller of the function you touch. One guard in the shared function is a smaller diff than a guard per caller, and patching only the path the ticket names leaves siblings broken.
4. **Review.** Every change reviewed for correctness, security, convention. Address critical and high; fix medium when cheap.
   - Review the implementation against its stated execution context and scale shape. Look for accidental global work, blocking calls on critical paths, N×M fanout, missing invalidation, and tests that prove only tiny inputs.
5. **Git.** Conventional commits (`<type>: <description>` — feat/fix/refactor/docs/test/chore/perf/ci, no scopes). Before PR/push, run the repo's final gate when it exists (`make test`, `make test-fast`, CI check, or documented equivalent). PRs include diff-against-base summary and a test plan.

Coverage goal: **80%+** as an aspiration, not a hard gate. Don't pad tests to hit a number.

## Decision discipline

Before implementing CI, automation, agent workflows, security-sensitive code, or user-visible generated output, define the decision frame explicitly:

- **Execution authority.** What code runs, where it runs, with which credentials/permissions, and which source revision it is allowed to execute from.
- **Ownership boundaries.** Which layer owns orchestration, deterministic logic, AI synthesis, persistence, publishing, cleanup, and error handling.
- **Bootstrap vs steady state.** What happens before the new code/config exists on the default branch, after it lands, and when required artifacts or dependencies are missing.
- **User-facing output contract.** Who reads the output, what action they should take, what should be hidden, and whether output is create-only, append-only, upserted, or deleted.
- **Failure mode.** Whether failure should block, fail soft, emit an artifact, skip, retry, or require manual action.

Do not let the easiest implementation surface become the architecture. Choose responsibility boundaries first, then place code in YAML, scripts, prompts, app modules, or docs according to ownership.

If implementation requires more than two corrective iterations in the same area, stop patching and reframe the missing invariant before continuing.

## Skill dispatch (when to reach for what)

Invoke the matching skill from `~/.agents/skills/` proactively — don't wait to be asked:

- **Before writing custom code** → `search-first` (check if a library/pattern already solves it).
- **Before destructive ops** (rm, force-push, drop table, etc.) → `safety-guard`.
- **Go file edited** → `golang-patterns` + `golang-testing`.
- **Python file touched** → `python-patterns` (PEP 8, type hints, Pydantic, no nested imports).
- **FastAPI file touched** → `fastapi-patterns` (service-layer architecture, thin routers, async patterns).
- **React Native / TypeScript file touched** → `react-native-patterns`.
- **AI/ML / evals / prompts work** → `ai-ml-patterns`.
- **Git workflow** (branches, conflicts, merges) → `git-workflow`.
- **GitHub ops** (issues, PRs, releases) → `github-ops`.
- **Terminal-heavy debugging** → `terminal-ops`.
- **Building MCP servers** → `mcp-server-patterns`.
- **Building agent systems** → `agentic-engineering`, `agent-harness-construction`.
- **Parsing structured text** → `regex-vs-llm-structured-text` (start with regex; add LLM only for low-confidence edges).
- **User says "ponytail", "be lazy", "lazy mode", "yagni", "simplest", "simplest solution", "minimal", "minimal solution", "do less", "shortest path", or complains about over-engineering / bloat / boilerplate** → `ponytail`.

**Parallel by default.** Independent tool calls go in one batch. Never serialize without a dependency.

**Context injection when delegating to subagents.** Subagents get a fresh context — they do NOT inherit this session's AGENTS.md or history. Every spawn must include:
1. Exact file paths (not descriptions).
2. Relevant diff or snippet inline.
3. Enough task context to start without exploring.

Bad: "Review the recent changes for security issues."
Good: "Review `src/auth/session.ts` (added refresh token rotation) and `src/auth/middleware.ts` (updated verification flow). Diff: <paste>."

## Anti-patterns (stop yourself before doing these)

- Wrapping internal calls in try/except — validate at boundaries (user input, network, file I/O) only.
- Adding "for future flexibility" config flags or interfaces with one implementation.
- Writing tests *after* the implementation to match it — that's not TDD, it's transcription.
- Long file/module docstrings that restate what the code does. Keep comments minimal; explain WHY when non-obvious, never WHAT.
- Bundling unrelated cleanup into a feature commit. Split it.

## Model selection when running explicit subtasks

| Task | Reasoning effort | Why |
|---|---|---|
| Exploration, search, environment setup | low | Fast, cheap, no deep reasoning needed |
| Research, analysis, code review | medium | Strong comprehension and synthesis |
| Code writing, architecture, complex reasoning | high | Best output quality |

Override with `--model_reasoning_effort` per invocation when the default doesn't match the task.
