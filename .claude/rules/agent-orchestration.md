# Agent Orchestration

## Automatic Agent Usage

No user prompt needed:
1. Complex feature → **planner** agent
2. Code written/modified → **code-reviewer** agent
3. Bug fix or new feature → **tdd-guide** agent
4. Architectural decision → **architect** agent
5. Build fails → **build-error-resolver** agent

## Parallel Execution

ALWAYS launch independent agents in parallel. Never run sequentially when tasks are independent.

## Multi-Perspective Analysis

For complex problems, use split-role sub-agents:
- Senior engineer (correctness)
- Security expert (vulnerabilities)
- Factual reviewer (accuracy)

## Extended Thinking

Enabled by default. For complex tasks:
1. Enable Plan Mode for structured approach
2. Use multiple critique rounds
3. Use split-role sub-agents for diverse perspectives
