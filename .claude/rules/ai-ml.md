---
paths:
  - "**/evals/**"
  - "**/prompts/**"
---
# AI/ML

- Build an eval pipeline before optimizing prompts or models.
- Use labelled datasets with known ground truth.
- Run baseline measurements first (precision, recall, F1, latency at p50/p95).
- Test prompt variants systematically — name each variant, run multiple times, compare quantitatively.
- Track experiments with timestamped results and clear winner/loser analysis.
- Verify eval results against live/real-world conditions — static datasets miss edge cases.
- Datasets and eval data are never copied into worktrees — always symlinked from the source repo.
