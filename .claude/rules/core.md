# Core

> *Canonical source: `~/Code/bjornjee/skills/.claude/rules/core.md`. To change doctrine: edit the canonical file, bump the skills-plugin version, run `make sync-rules` from the skills repo. Do not edit the destination copy at `~/.claude/rules/core.md` directly.*

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

0. **Worktree.** Any code-modifying task beyond a single-line fix runs in a git worktree.

   Symptoms you're about to skip this wrongly:
   - "It's just a quick audit, I won't commit."
   - "The user said 'check it', not 'fix it'."
   - "I'll move to a worktree if it grows."
   - You've already run `git checkout` on something that isn't `main`.

   <HARD-GATE>
   No Edit, no Write, no `git add` on the source branch. Period.
   Use `/agent-dashboard:feature` or `git worktree add` first.
   This applies even when the task starts as "just look at it."
   </HARD-GATE>

   Every audit turns into commits eventually. Every time.

1. **Research.** Use the built-in `Explore` agent for any non-trivial codebase question. Search the existing repo, library docs, and package registries before writing anything new. Output: a one-line "what already exists" answer.

   Symptoms you're about to skip this wrongly:
   - "I already know this codebase."
   - "It's faster to just grep myself."
   - "`Explore` is overkill for one question."
   - You're about to write code without having read the existing entry point.

2. **Plan.** Use the built-in `Plan` agent (`subagent_type: Plan`) for non-trivial implementation. See the dispatch table below. No code until the approach is approved.

   Trigger if **any** of: >1 file affected, multiple valid approaches, fuzzy goal, or the request uses a verb like "improve", "refactor", "redesign", "audit", "investigate".

   **Terminology — read this once, then never confuse it again.**
   In this file, *"plan tool"* / *"plan mode"* / *"the planner"* all mean the **`Plan` agent** (`subagent_type: Plan`). They do **NOT** mean the `EnterPlanMode` / `ExitPlanMode` deferred tools — those are a separate Claude Code mechanism that resets the session permission mode and should not be invoked from this doctrine. If the user says *"use the plan tool"*, spawn the Plan agent.

   Anti-pattern: *"This is simple enough to just code."*
   Every project goes through this rationalization. The plan can be short — but it MUST be presented and approved.

   Symptoms you're about to violate:
   - You're opening Edit before having spawned the Plan agent.
   - You're thinking "I'll plan as I go."
   - The user used a fuzzy verb and you're already searching for a fix.

   <HARD-GATE>
   No Edit / Write / mutating Bash until a plan has been presented and the user has approved it.
   The only skip: a literal typo or single-character fix.
   </HARD-GATE>

   **Red Flags — STOP and Start Over.** If any of these match your self-talk, you are about to violate Phase 2:
   - *"I correctly skipped the plan-mode tools, but I also skipped the Plan agent."*
   - *"The user said 'plan tool' so I'll call EnterPlanMode."*
   - *"I'll just enter plan mode quickly even though it resets permissions."*
   - *"This is simple enough to just code."*
   - *"I'll plan as I go."*
   - *"I already explored, that counts as planning."*

   Anti-pattern: **"Skipping Plan agent because plan-mode tools are deferred."**
   The deferred tools and the Plan agent are different mechanisms. Deferring the tools doesn't defer the requirement to plan. Spawn the agent.

   Anti-pattern: **"Calling EnterPlanMode because the user said 'plan'."**
   User shorthand resolves to the Plan agent. Always. Spawn the agent.

3. **Implement (TDD).** RED → GREEN → REFACTOR. In that order. With proof at each step.

   Wrote code before the test? Delete it. Write the test. Watch it fail. Then re-write the code. No exceptions.

   The hook layer (`agent-dashboard`'s `test-gate`) blocks `git commit` unless `make test` passes — but a hook is a *gate*, not a *guide*. `tdd-guide` enforces the order of operations the gate cannot see.

   <HARD-GATE>
   The failing test run must be PASTED, not paraphrased.
   "I assume it would fail" is not RED.
   A compile error is not RED — fix it and re-run until you get a real assertion failure.
   </HARD-GATE>

   ### Delegation choice (orthogonal to TDD)

   In a worktree with `codex --version` available, delegate implementation via `/codex-delegate` (Claude plans, Codex implements, Claude reviews). Otherwise drive `tdd-guide` directly. The choice of who implements does not relax the RED → GREEN → REFACTOR requirement above — TDD applies to both paths.

   ### Visual changes need visual verification

   UI / CSS / colour / layout change?

   <GATE-FUNCTION>
   BEFORE claiming the visual change works:
   1. IDENTIFY what should look different after the change.
   2. LOCATE the observable (selector, screenshot region, computed style).
   3. RUN Playwright (or the project's browser tool) against the running site.
   4. VERIFY the rendered output matches the requirement.
   5. ONLY THEN claim done.
   </GATE-FUNCTION>

   The diff is not proof. The screenshot is.

   ### Bug fixes need evidence, not theories

   Before any fix:
   1. Quote the offending code path — `file:line`, read it, don't infer it.
   2. Quote the actual log line, error message, or test failure output **verbatim**.
   3. State the root cause as a falsifiable claim: *"X happens because Y at file:line returns Z."*

   Anti-pattern: *"It's probably because of X."*
   "Probably" is a guess. Guesses get reverted. Read the code. Read the logs.

   <HARD-GATE>
   No Edit on a "fix" until you have pasted:
   - The offending file:line range, AND
   - The reproducing output (test failure, log line, stack trace).
   "I think the issue is..." without evidence = stop and gather it.
   </HARD-GATE>

   The fix is the last step, not the first.

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

**Parallel by default.** Independent agents launch in **one message** with multiple tool calls.

Sequential dispatch of independent work = wasted minutes every session. Every time.

Anti-pattern: *"I'll send the second one once the first comes back."*
If the second doesn't read the first's output, send them together. Now.

**Context injection is mandatory.** Subagents start blind. They do NOT inherit your CLAUDE.md, rules, or session history.

Anti-pattern: *"The agent will figure it out."*
Agents with thin prompts produce shallow, generic work. Every time.

Required in every spawn:
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
