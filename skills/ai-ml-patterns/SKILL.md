---
name: ai-ml-patterns
description: Eval-first AI/ML workflow — labelled datasets, baseline metrics, systematic prompt variants, experiment tracking. Use when working on evals, prompts, or model optimization.
---
# AI/ML

- Build an eval pipeline before optimizing prompts or models.
- Use labelled datasets with known ground truth.
- Run baseline measurements first (precision, recall, F1, latency at p50/p95).
- Test prompt variants systematically — name each variant, run multiple times, compare quantitatively.
- Track experiments with timestamped results and clear winner/loser analysis.
- Verify eval results against live/real-world conditions — static datasets miss edge cases.
- Datasets and eval data are never copied into worktrees — always symlinked from the source repo.
