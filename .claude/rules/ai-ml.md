---
paths:
  - "**/evals/**"
  - "**/prompts/**"
---
# AI/ML

## Evals first
- Build the eval pipeline before optimizing prompts or models. No eval, no tuning — you're guessing with style.
- Labelled datasets with known ground truth; baseline measurements first (precision, recall, F1, latency p50/p95).
- Hold-out set is never used for iteration. Tuning against your test set is how "95% accuracy" ships a broken feature.
- Every prompt change runs the regression eval in CI. Prompts are code; changes without evals are untested deploys.
- LLM-as-judge needs its own calibration eval against human labels before you trust it. An uncalibrated judge automates your blind spots.
- Test prompt variants systematically — name each variant, run multiple times (temperature ≠ 0 is nondeterministic), compare quantitatively.
- Track experiments with timestamped results and clear winner/loser analysis.
- Verify eval results against live/real-world conditions — static datasets miss edge cases.
- Datasets and eval data are never copied into worktrees — always symlinked from the source repo.

## RAG decisions
- Chunking: semantic/heading-based first, fixed-size (with overlap) as fallback. Chunks without overlap lose boundary answers.
- Retrieval: hybrid (dense + BM25) is the default; dense-only needs a justification. Keyword-ish queries (names, IDs, codes) die in pure vector search.
- Rerank when precision matters: retrieve top-50 cheap, rerank to top-5 with a cross-encoder.
- Eval retrieval separately (recall@k, MRR) before blaming generation. Most "hallucinations" are retrieval misses.
- pgvector until proven insufficient — a dedicated vector store is an ops burden you must earn with scale numbers.

## Finetune vs RAG vs prompt
- Prompt + few-shot first (hours to iterate). RAG when the knowledge changes or exceeds context (days). Finetune last (weeks + permanent maintenance).
- Finetune for format, style, tone, or latency at scale — with ≥500 quality labeled examples. Never for knowledge injection; the knowledge moves, the weights don't.
- Each step up must beat the previous on the eval, not on vibes.

## Prompt injection
- Untrusted content (user input, retrieved docs, tool output) is fenced and labeled in the prompt; instructions never travel in the data channel.
- The model is not a trust boundary. Tool-calling agents validate arguments server-side; model output is filtered/escaped before execution or rendering.
- Agent chains propagate the risk: one agent's output is the next agent's untrusted input.

## Structured output
- Schema-constrained decoding (tool-use / JSON schema mode) over "respond in JSON" prose instructions.
- Validate with the real parser; one repair retry with the error message, then fail loudly. Silent regex-rescue of malformed JSON hides model regressions.
- Temperature 0 for extraction and classification.

## Routing & cost
- Cheapest model that passes the eval. Cascade: cheap model first, escalate on low confidence — most volume never needs the frontier model.
- Cache aggressively: system prompts and few-shots are cache-shaped (prompt caching); identical requests are cache hits, not API calls.
- Batch API for anything offline (evals, backfills) — typically half price.

## Production
- Log per call: prompt, completion, model, latency, token cost, with PII redacted. You cannot debug or budget what you didn't record.
- Drift alert on eval-score drop over a rolling window, not on user complaints.
- Version prompts like code — they are code: reviewed, diffed, rolled back.
