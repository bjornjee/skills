# Core

Always-on doctrine for the orchestrating agent. Loaded every session.
What to do, in what order, and who to delegate to. Methodology for each
step lives inside the corresponding subagent definition, not here.

## First principles (what to value)

- **KISS.** Simplest thing that works. No premature abstraction. Three clear lines beat one extracted helper.
- **DRY.** Shared logic in shared packages. Constants/types defined once and imported. Copy-paste means extract.
- **No just-in-case code.** No feature flags, backwards-compat shims, or fallbacks unless tied to an explicit migration.
- **One way to do things.** If a pattern exists, follow it. Don't introduce alternatives.
- **Battle-tested over hand-rolled.** If an OSS project solves 80%+, adopt or port it.

## Workflow phases (in what order)

1. **Research.** Search the existing repo, library docs, and package registries before writing anything new. Output: a one-line "what already exists" answer.
2. **Plan.** No code until the approach is agreed. Break work into phases, identify risks and affected files. Output: plan file or plan-mode exit.
3. **Implement (TDD).** RED → GREEN → REFACTOR. Test fails before code, passes after.
4. **Review.** Every change reviewed for correctness, security, convention. Address critical and high; fix medium when cheap.
5. **Git.** Conventional commits (`<type>: <description>` — feat/fix/refactor/docs/test/chore/perf/ci, no scopes). PRs include diff-against-base summary and a test plan.

Coverage goal: **80%+** as an aspiration, not a hard gate. Don't pad tests to hit a number.

## Agent dispatch (who to delegate to)

Spawn without waiting for the user to ask:

| Trigger | Agent |
|---|---|
| Complex feature, refactor, architectural decision | `planner` |
| Code written or modified | `code-reviewer` |
| Bug fix or new feature | `tdd-guide` |
| User input, auth, API surface, sensitive data handling | `security-reviewer` |
| Build or test failure | `build-error-resolver` |
| Go file edited | `go-reviewer-strict` (in addition to `code-reviewer`) |
| Python file edited | `python-reviewer-strict` (in addition to `code-reviewer`) |
| Dead code or duplication suspected | `refactor-cleaner` |
| Hot-path or perf concern raised | `performance-optimizer` |

**Parallel by default.** Independent agents launch in one message with multiple tool calls. Never serialize when there is no dependency.

**Context injection is mandatory.** Subagents get a fresh context window — they do NOT inherit this session's CLAUDE.md, rules, or history. Every spawn must include:
1. Exact file paths (not descriptions).
2. Relevant diff or snippet inline.
3. Enough task context to start without exploring.

Bad: "Review the recent changes for security issues."
Good: "Review `packages/agent-state/index.js` (added file locking) and `scripts/hooks/agent-state-fast.js` (state sync update). Diff: <paste>."

## Model selection when delegating

| Task | Model | Why |
|---|---|---|
| Exploration, search, environment setup | `haiku` | Fast, cheap, no deep reasoning needed |
| Research, analysis, code review | `sonnet` | Strong comprehension and synthesis |
| Code writing, architecture, complex reasoning | `opus` | Best output quality |

Set `model` explicitly on every ad-hoc spawn. Named agents in `agents/` already declare their own model in frontmatter — trust those.
