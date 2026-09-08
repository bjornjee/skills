---
name: claude-api
description: Use when building on the Anthropic Claude API or SDKs — model choice, the tool-use loop, token and context budgeting, prompt caching, batches. Falsifiable patterns for production agents, not SDK hello-worlds.
---

# Claude API

Production patterns for the Messages API and Claude Agent SDK. Examples are Python; the TypeScript SDK (`@anthropic-ai/sdk`) mirrors them method-for-method. Assumes the client is constructed and `ANTHROPIC_API_KEY` is in the environment — wiring that up is not this skill's job.

## Model selection

Select against a representative evaluation, not a fixed hierarchy. Define the task slice, required capabilities (for example tool use, vision, or thinking), quality threshold, latency budget, and cost budget. Test candidate models with the same prompts and tools, then record the selected ID, evaluation results, and acceptance thresholds in project configuration. Re-run the evaluation before changing that ID.

**Input contract for the examples:** `selected_model` comes from project configuration. Before deploying or changing it, verify its capabilities, availability, context/output limits, lifecycle, and pricing in Anthropic's [models overview](https://platform.claude.com/docs/en/about-claude/models/overview) and [pricing](https://platform.claude.com/docs/en/about-claude/pricing). Check whether the configured identifier denotes a pinned snapshot or a moving alias in the [model-versioning documentation](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions); choose a pinned snapshot when reproducibility matters, and record the identifier with evaluations and requests.

## The tool-use loop

One example, because everything else is a variation on it. Note the four things that keep it from wedging: an iteration cap with explicit exhaustion, explicit stop-reason handling, a `tool_result` for every executed `tool_use` (even failures), and all results returned as one user turn. This minimal example dispatches sequentially; callers can add bounded concurrency for independent calls. `dispatch` validates tool arguments and returns textual results.

```python
MAX_STEPS = 10
messages = [{"role": "user", "content": task}]

for _ in range(MAX_STEPS):
    resp = client.messages.create(
        model=selected_model, max_tokens=4096, tools=tools, messages=messages,
    )
    messages.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason == "end_turn":
        break
    if resp.stop_reason != "tool_use":
        raise RuntimeError(f"Incomplete turn: {resp.stop_reason}; preserve state for recovery")

    results = []  # every tool_result for this turn goes in ONE user message
    for block in resp.content:
        if block.type != "tool_use":
            continue
        try:
            out = dispatch(block.name, block.input)
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": out})
        except Exception:  # dispatch is a boundary; do not expose raw errors to the model
            results.append({"type": "tool_result", "tool_use_id": block.id,
                            "content": "Tool execution failed. Do not retry automatically; report the failure and request help.", "is_error": True})
    messages.append({"role": "user", "content": results})
else:
    raise RuntimeError("Tool execution budget exhausted; preserve state and report incomplete")
```

- **Every `tool_use` gets a `tool_result` with the matching `tool_use_id`** — even on error, return `is_error: True` with an actionable string. A missing pairing 400s the next request and wedges the conversation.
- **Parallel calls come back in ONE user turn.** When the assistant emits several `tool_use` blocks, execute them concurrently and return all `tool_result` blocks in a single user message, each keyed to its id. Never serialize independent calls one-result-per-turn — that breaks the pairing contract and burns round-trips.
- **Cap execution and detect lack of progress.** Repeated signatures alone do not prove a loop: reads may need refreshing, failed calls may be retryable, and state can change. Use bounded retries and idempotency rules for mutations; report budget exhaustion explicitly.

### stop_reason drives control flow

| `stop_reason` | Meaning | Do |
|---|---|---|
| `end_turn` | Model finished | Return the answer |
| `tool_use` | Model wants results | Execute, append results, loop |
| `max_tokens` | Output truncated mid-turn | Report incomplete; never execute partial tool arguments; recover explicitly |
| `stop_sequence` | Hit a configured custom delimiter | Inspect the matched delimiter; accept only if the caller defined it as completion, otherwise report incomplete. The minimal loop above configures none. |

### tool_choice

| Value | Behavior | Use when |
|-------|----------|----------|
| `{"type": "auto"}` | May call a tool or answer in prose | Default agent loop |
| `{"type": "any"}` | Must call some tool, model picks which | Always want a structured call, never prose |
| `{"type": "tool", "name": "x"}` | Must call tool `x` | Routing / extraction into one known schema |

Add `"disable_parallel_tool_use": true` inside `tool_choice` when you need exactly one call per turn (deterministic routing); leave it off to let the model parallelize.

## Token & context management

- **Count before you send** when input is user-controlled or growing: `client.messages.count_tokens(model=..., system=..., tools=..., messages=...)` returns `input_tokens`. Gate against the selected model’s current context and output limits before the API rejects the request.
- **Prune to preserve the cache prefix.** A cache breakpoint only hits on a byte-identical prefix. Keep the system prompt, tool defs, and few-shot examples byte-identical across turns; when history grows, truncate the *middle* (oldest turns after the few-shots) — never the head, or every cache read reverts to a full re-charge.
- **At `stop_reason == "max_tokens"`** the turn was cut off, not finished. Two recoveries:
  - *Continuation* — the generation itself was long: append the partial assistant message and send a `"continue"` user turn.
  - *Summarize-and-restart* — the history is the bloat: replace old turns with a summary and start a fresh window. Raising `max_tokens` alone just re-truncates.

### max_tokens starvation after large tool results

A 50K-token tool result can consume the window until the model has no room to answer. Budget the response *before* appending results: reserve output tokens, and truncate the **tool result** (head + tail with an elision marker) — never the system prompt or tool defs, which carry your instructions and the cache prefix.

## Prompt caching

Cache large, stable prefixes (system prompt, tool definitions, long context) when repeated requests justify the cache-write cost. Measure hit rate, latency, and token cost for the selected model against the current [prompt-caching pricing](https://platform.claude.com/docs/en/about-claude/pricing).

```python
resp = client.messages.create(
    model=selected_model, max_tokens=1024,
    system=[{"type": "text", "text": large_context, "cache_control": {"type": "ephemeral"}}],
    messages=[{"role": "user", "content": question}],
)
print(resp.usage.cache_read_input_tokens, resp.usage.cache_creation_input_tokens)
```

Expect `cache_creation_input_tokens > 0` on the first call (writing the cache) and `cache_read_input_tokens > 0` on hits. If reads stay 0 across turns, the prefix is not byte-identical — something above the breakpoint is mutating.

## Batches

Use Message Batches for non-time-sensitive bulk work when its current service constraints and pricing fit the workload. Submit, then poll `processing_status`:

```python
batch = client.messages.batches.create(requests=[
    {"custom_id": f"req-{i}", "params": {"model": selected_model,
     "max_tokens": 1024, "messages": [{"role": "user", "content": p}]}}
    for i, p in enumerate(prompts)
])
while client.messages.batches.retrieve(batch.id).processing_status != "ended":
    time.sleep(30)
for r in client.messages.batches.results(batch.id):
    ...  # r.custom_id maps back to your input; results are unordered
```

Results come back **unordered** — key on `custom_id`, never on position. Check the current batch limits, completion window, and pricing in Anthropic's [Message Batches documentation](https://platform.claude.com/docs/en/build-with-claude/batch-processing).

## Cost optimization

| Strategy | When to use |
|----------|-------------|
| Prompt caching | Repeated stable prompt prefixes; measure cache hits and current pricing |
| Batches API | Non-time-sensitive bulk processing within the current service limits |
| Model selection | A lower-cost candidate meets the evaluation's quality and latency thresholds |
| Shorter `max_tokens` | Output is known to be short |
| Streaming | Faster perceived response is valuable; measure its effect on the user flow |

## When to reach elsewhere

- Streaming, vision, and extended thinking are one-parameter changes (`stream=`, an `image` content block, `thinking={...}`) — the SDK reference has the shapes; they don't need a pattern here.
- Multi-turn agent orchestration, subagents, and session/filesystem machinery: use the Claude Agent SDK instead of hand-rolling the loop above.
- Exact current model IDs, pricing, and rate limits: docs.anthropic.com — never answer those from memory.
