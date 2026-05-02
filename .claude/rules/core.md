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
- **Stay in declared scope.** If the task says "X only," don't touch Y. When you spot something else worth changing, surface it as a separate proposal — do not silently expand the diff.

## Workflow phases (in what order)

0. **Worktree.** Any code-modifying task beyond a single-line fix runs in a git worktree, not on the source branch. Use `/agent-dashboard:feature` for full feature flow, or `git worktree add` directly for ad-hoc work. Don't audit, refactor, or implement on the current branch — even for "quick" investigations that turn into commits.
1. **Research.** Use the built-in `Explore` agent for any non-trivial codebase question. Search the existing repo, library docs, and package registries before writing anything new. Output: a one-line "what already exists" answer.
2. **Plan.** Enter `EnterPlanMode` and use the built-in `Plan` agent if **any** of: the change touches >1 file, multiple valid approaches exist, the user goal is fuzzy, or the user used a verb like "improve", "refactor", "redesign", "audit". A one-line typo fix doesn't need plan mode; almost everything else does. No code until `ExitPlanMode` is approved. Break work into phases, identify risks and affected files.
3. **Implement (TDD).** If in a worktree and Codex CLI is available (`codex --version` succeeds), delegate implementation via `/codex-delegate`. Claude plans, Codex implements in the worktree, Claude reviews. Only implement directly if not in a worktree, Codex is unavailable, or the user opts out. When implementing directly, use `tdd-guide` to walk the RED → GREEN → REFACTOR cycle explicitly — the guide refuses to write implementation before a failing test exists, and shows the actual failing run before GREEN. The hook layer (`agent-dashboard`'s `test-gate`) blocks `git commit` unless `make test` passes, but a hook is a *gate*, not a *guide* — `tdd-guide` enforces the order of operations the gate cannot see. **Visual changes need visual verification.** For any UI/CSS/colour/layout change, drive the running site through Playwright (or the project's browser tool) and confirm the rendered result matches the requirement before declaring done. The diff is not proof — the screenshot is.
4. **Review.** Language-specific strict reviewers (below) fire on edited files. Address critical and high; fix medium when cheap.
5. **Git.** Conventional commits (`<type>: <description>` — feat/fix/refactor/docs/test/chore/perf/ci, no scopes). PRs include a diff-against-base summary and a test plan.

Coverage goal: **80%+** as an aspiration, not a hard gate. Don't pad tests to hit a number.

## Agent dispatch (who to delegate to)

Spawn without waiting for the user to ask:

| Trigger | Agent | Source |
|---|---|---|
| Codebase research / multi-area search before planning | `Explore` | Claude Code built-in |
| Complex feature, refactor, or architectural decision | `Plan` | Claude Code built-in |
| Plan approved, in a worktree, Codex available | `codex-delegate` (skill) | bjornjee-skills |
| New feature, bug fix, or refactor (any stack) | `tdd-guide` | bjornjee-skills |
| Go file edited | `go-reviewer-strict` | bjornjee-skills |
| Python file edited | `python-reviewer-strict` | bjornjee-skills |
| Dead code or duplication suspected | `refactor-cleaner` | bjornjee-skills |
| Hot-path or perf concern raised | `performance-optimizer` | bjornjee-skills |

**Parallel by default.** Independent agents launch in one message with multiple tool calls. Never serialize when there is no dependency.

**Context injection is mandatory.** Subagents get a fresh context window — they do NOT inherit this session's CLAUDE.md, rules, or history. Every spawn must include:
1. Exact file paths (not descriptions).
2. Relevant diff or snippet inline.
3. Enough task context to start without exploring.

Bad: "Review the recent Go changes."
Good: "Run `go-reviewer-strict` on `internal/tmux/runner.go` (added new `Output` variant) and `internal/tmux/runner_test.go` (added mock expectations). Diff: <paste>."

## Model selection when delegating

| Task | Model | Why |
|---|---|---|
| Exploration, search, environment setup | `haiku` | Fast, cheap, no deep reasoning needed |
| Research, analysis, code review | `sonnet` | Strong comprehension and synthesis |
| Code writing, architecture, complex reasoning | `opus` | Best output quality |

Set `model` explicitly on every ad-hoc spawn. Built-in `Plan` and `Explore` pick their own model — don't override unless you have a specific reason. Named agents in `agents/` declare their own model in frontmatter — trust those.
