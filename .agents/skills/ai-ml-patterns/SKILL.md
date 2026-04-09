---
name: ai-ml-patterns
description: REQUIRED when working on eval pipelines, prompt engineering, ML experiments, or files in evals/ or prompts/ directories. Enforces eval-first methodology, labelled datasets, baseline measurements, and systematic prompt variant testing.
---

# AI/ML & Evals Conventions — Mandatory

These are not suggestions. Every rule below MUST be followed for AI/ML work.

## When to Activate

- Any task involving eval pipelines, prompt engineering, or ML experiments
- Files in `evals/`, `prompts/`, or experiment-related directories
- This skill activates implicitly for AI/ML work

## Rules

1. **Eval pipeline before optimization.** Build an eval pipeline before optimizing prompts or models. No prompt changes without quantitative evidence they help.

2. **Labelled datasets.** Use labelled datasets with known ground truth. No evaluation against unlabelled or self-generated data.

3. **Baseline first.** Run baseline measurements first (precision, recall, F1, latency at p50/p95). Every change is measured against the baseline.

4. **Systematic variant testing.** Test prompt variants systematically:
   - Name each variant explicitly (e.g., `v3-chain-of-thought`, `v4-few-shot-5`)
   - Run multiple times to account for variance
   - Compare quantitatively, not by vibes
   - Track experiments with timestamped results and clear winner/loser analysis

5. **Live verification.** Verify eval results against live/real-world conditions — static datasets miss edge cases.

6. **Data handling.** Datasets and eval data are never copied into worktrees — always symlinked from the source repo. This prevents data duplication and ensures all worktrees use the same ground truth.

```bash
# Good: Symlink datasets
ln -s /path/to/source/data ./data

# Bad: Copy datasets into worktree
cp -r /path/to/source/data ./data
```
