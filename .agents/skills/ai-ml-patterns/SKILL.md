---
name: ai-ml-patterns
description: REQUIRED when working on eval pipelines, prompt engineering, ML experiments, agent orchestration, or files in evals/, prompts/, or coral/ directories. Enforces eval-first methodology, labelled datasets, baseline measurements, and systematic prompt variant testing.
---

# AI/ML & Evals Conventions — Mandatory

These are not suggestions. Every rule below MUST be followed for AI/ML work.

## When to Activate

- Any task involving eval pipelines, prompt engineering, or ML experiments
- Agent orchestration systems (multi-agent, routing, delegation)
- Files in `evals/`, `prompts/`, `coral/`, or experiment-related directories
- This skill activates implicitly for AI/ML work

## Python Stack

Follow `$python-patterns` for all Python conventions. In addition:

- Build backend: `hatchling`. Package manager: `uv`.
- LLM gateway: `litellm` for provider-agnostic model access. Configuration via `litellm_config.yaml`.
- HTTP client: `httpx` (async by default).
- Config: `omegaconf` for hierarchical YAML-based experiment config. `pydantic-settings` for app-level settings.
- Async: `uvicorn` for serving. `pytest-asyncio` for testing.
- Python version: `>=3.11`.

## Eval Pipeline

1. **Eval pipeline before optimization.** Build an eval pipeline before optimizing prompts or models. No prompt changes without quantitative evidence they help.

2. **Labelled datasets.** Use labelled datasets with known ground truth. No evaluation against unlabelled or self-generated data.

3. **Baseline first.** Run baseline measurements first (precision, recall, F1, latency at p50/p95). Every change is measured against the baseline.

4. **Systematic variant testing.** Test prompt variants systematically:
   - Name each variant explicitly (e.g., `v3-chain-of-thought`, `v4-few-shot-5`)
   - Run multiple times to account for variance
   - Compare quantitatively, not by vibes
   - Track experiments with timestamped results and clear winner/loser analysis

5. **Live verification.** Verify eval results against live/real-world conditions — static datasets miss edge cases.

## Agent Orchestration

When building multi-agent or orchestration systems:

- Separate concerns: routing, execution, and evaluation are distinct layers.
- Config-driven agent definitions — agents are data (YAML/JSON), not hardcoded classes.
- Every agent action must be observable: log inputs, outputs, tool calls, and decisions.
- Use structured output (Pydantic models) for inter-agent communication, not free-form strings.
- Cost tracking: log token usage and model per request. Use cheaper models for simple routing/classification.

## Prompt Engineering

- Prompts are versioned files, not inline strings. Store in `prompts/` with clear naming.
- Template variables use a consistent format (e.g., `{variable_name}` or XML tags).
- System prompts are separate from user prompts — never concatenate them into one string.
- Include few-shot examples as structured data, not baked into the prompt template.

## Data Handling

- Datasets and eval data are never copied into worktrees — always symlinked from the source repo.
- Large artifacts (models, embeddings, datasets) go in `data/`, `datasets/`, or `artifacts/` — never committed to git.
- Use `.gitignore` for data directories. Use symlinks in worktrees.

```bash
# Good: Symlink datasets
ln -s /path/to/source/data ./data

# Bad: Copy datasets into worktree
cp -r /path/to/source/data ./data
```

## Project Structure

```
src/ or <package_name>/   # Main package
  agents/                 # Agent definitions and runners
  evals/                  # Evaluation pipelines and harnesses
  prompts/                # Versioned prompt templates
  services/               # External integrations (LLM providers, APIs)
  config/                 # Configuration schemas and loaders
tests/                    # Mirrors src/ structure
examples/                 # Runnable examples and demos
```

## Testing

- Eval tests are separate from unit tests — they may be slow and require API keys.
- Unit tests mock LLM calls (use `httpx.MockTransport` or `respx`). Never call real LLM APIs in CI.
- Eval tests run on demand, not in CI, unless they use cached/deterministic responses.
- Test prompt templates render correctly with edge-case inputs (empty strings, special characters, long inputs).
