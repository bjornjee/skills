# Agent Orchestration

## Automatic Agent Usage

No user prompt needed:
1. Complex feature → **planner** agent
2. Code written/modified → **code-reviewer** agent
3. Bug fix or new feature → **tdd-guide** agent
4. Architectural decision → **planner** agent
5. Build fails → **build-error-resolver** agent
6. User input, auth, or API code → **security-reviewer** agent

## Parallel Execution

ALWAYS launch independent agents in parallel. Never run sequentially when tasks are independent.

## Multi-Perspective Analysis

For complex problems, use split-role sub-agents:
- Senior engineer (correctness)
- Security expert (vulnerabilities)
- Factual reviewer (accuracy)

## Subagent Context Injection

When spawning any subagent, the parent MUST include in the prompt:
1. **File paths** being worked on (exact paths, not descriptions)
2. **Diffs or snippets** — `git diff` output or the relevant code sections
3. **Task context** — enough detail that the subagent can start working immediately without exploring

The subagent should use `Read` on the provided paths directly. Do not run Grep/Glob to rediscover files already identified by the parent.

Bad: "Review the recent changes for security issues"
Good: "Review these files for security issues: `packages/agent-state/index.js` (added file locking to writeState), `scripts/hooks/agent-state-fast.js` (updated state sync). Diff: <paste git diff output>"

## Model Selection for Subagents

Named agents (in `agents/`) have models assigned in their frontmatter. For ad-hoc subagents, use:

| Subagent Purpose | Model | Why |
|-----------------|-------|-----|
| Explore / search / environment setup | haiku | File discovery, dependency install — no deep reasoning needed |
| Research / analysis | sonnet | Needs comprehension and synthesis quality |
| Code writing / editing | opus | Best output quality for code that ships |
| Architecture / planning | opus | Deep reasoning for design decisions |

Always set `model` explicitly when spawning ad-hoc agents. Do not rely on defaults.

## Extended Thinking

Enabled by default. For complex tasks:
1. Enable Plan Mode for structured approach
2. Use multiple critique rounds
3. Use split-role sub-agents for diverse perspectives
