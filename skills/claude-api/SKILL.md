---
name: claude-api
description: Use when building on the Anthropic Claude API or SDKs — model choice, the tool-use loop, token and context budgeting, prompt caching, batches. Falsifiable patterns for production agents, not SDK hello-worlds.
---

# Claude API

Production patterns for the Messages API and Claude Agent SDK. Examples are Python; the TypeScript SDK (`@anthropic-ai/sdk`) mirrors them method-for-method. Assumes the client is constructed and `ANTHROPIC_API_KEY` is in the environment — wiring that up is not this skill's job.

## Model selection

| Model | ID | Best for |
|-------|-----|----------|
| Fable 5 | `claude-fable-5` | Frontier reasoning, hardest agentic tasks |
| Opus 4.8 | `claude-opus-4-8` | Complex reasoning, architecture, research |
| Sonnet 4.6 | `claude-sonnet-4-6` | Balanced coding, most development tasks |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | Fast, high-volume, cost-sensitive |

Default to Sonnet 4.6; escalate to Opus/Fable only when a task actually stalls on reasoning; drop to Haiku for classification, extraction, and routing.

**Production: pin the dated snapshot, never the alias.** `claude-sonnet-4-6` (alias) silently rolls to the next snapshot and can shift behavior under you; `claude-haiku-4-5-20251001` (snapshot) is frozen. Pin snapshots in anything you regression-test, and re-verify current IDs at docs.anthropic.com before shipping.

## The tool-use loop

One example, because everything else is a variation on it. Note the four things that keep it from wedging: the iteration cap, the identical-call breaker, a `tool_result` for every `tool_use` (even failures), and all results returned as one user turn.

```python
MAX_STEPS = 10
seen = set()
messages = [{"role": "user", "content": task}]

for _ in range(MAX_STEPS):
    resp = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=4096, tools=tools, messages=messages,
    )
    messages.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason != "tool_use":
        break

    results = []  # every tool_result for this turn goes in ONE user message
    for block in resp.content:
        if block.type != "tool_use":
            continue
        sig = (block.name, json.dumps(block.input, sort_keys=True))
        if sig in seen:                       # loop breaker: identical repeat call
            results.append({"type": "tool_result", "tool_use_id": block.id,
                            "content": "Duplicate call; you already have this result.",
                            "is_error": True})
            continue
        seen.add(sig)
        try:
            out = dispatch(block.name, block.input)
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": out})
        except Exception as e:                # a failure still returns a tool_result
            results.append({"type": "tool_result", "tool_use_id": block.id,
                            "content": f"error: {e}", "is_error": True})
    messages.append({"role": "user", "content": results})
```

- **Every `tool_use` gets a `tool_result` with the matching `tool_use_id`** — even on error, return `is_error: True` with an actionable string. A missing pairing 400s the next request and wedges the conversation.
- **Parallel calls come back in ONE user turn.** When the assistant emits several `tool_use` blocks, execute them concurrently and return all `tool_result` blocks in a single user message, each keyed to its id. Never serialize independent calls one-result-per-turn — that breaks the pairing contract and burns round-trips.
- **Cap the loop and break on repeats.** An unbounded loop with a flaky tool spins forever; identical repeated calls (same name + input) mean the model is stuck, not progressing — feed back an error result to break the cycle.

### stop_reason drives control flow

| `stop_reason` | Meaning | Do |
|---|---|---|
| `end_turn` | Model finished | Return the answer |
| `tool_use` | Model wants results | Execute, append results, loop |
| `max_tokens` | Output truncated mid-turn | Continue or summarize (below) |
| `stop_sequence` | Hit a stop string | Treat as done |

### tool_choice

| Value | Behavior | Use when |
|-------|----------|----------|
| `{"type": "auto"}` | May call a tool or answer in prose | Default agent loop |
| `{"type": "any"}` | Must call some tool, model picks which | Always want a structured call, never prose |
| `{"type": "tool", "name": "x"}` | Must call tool `x` | Routing / extraction into one known schema |

Add `"disable_parallel_tool_use": true` inside `tool_choice` when you need exactly one call per turn (deterministic routing); leave it off to let the model parallelize.

## Token & context management

- **Count before you send** when input is user-controlled or growing: `client.messages.count_tokens(model=..., system=..., tools=..., messages=...)` returns `input_tokens`. Gate against the 200K context window before the API 400s you.
- **Prune to preserve the cache prefix.** A cache breakpoint only hits on a byte-identical prefix. Keep the system prompt, tool defs, and few-shot examples byte-identical across turns; when history grows, truncate the *middle* (oldest turns after the few-shots) — never the head, or every cache read reverts to a full re-charge.
- **At `stop_reason == "max_tokens"`** the turn was cut off, not finished. Two recoveries:
  - *Continuation* — the generation itself was long: append the partial assistant message and send a `"continue"` user turn.
  - *Summarize-and-restart* — the history is the bloat: replace old turns with a summary and start a fresh window. Raising `max_tokens` alone just re-truncates.

### max_tokens starvation after large tool results

A 50K-token tool result can consume the window until the model has no room to answer. Budget the response *before* appending results: reserve output tokens, and truncate the **tool result** (head + tail with an elision marker) — never the system prompt or tool defs, which carry your instructions and the cache prefix.

## Prompt caching

Cache large, stable prefixes (system prompt, tool defs, long context) to cut cost up to 90% and latency on the cached span.

```python
resp = client.messages.create(
    model="claude-sonnet-4-6", max_tokens=1024,
    system=[{"type": "text", "text": large_context, "cache_control": {"type": "ephemeral"}}],
    messages=[{"role": "user", "content": question}],
)
print(resp.usage.cache_read_input_tokens, resp.usage.cache_creation_input_tokens)
```

Expect `cache_creation_input_tokens > 0` on the first call (writing the cache) and `cache_read_input_tokens > 0` on hits. If reads stay 0 across turns, the prefix is not byte-identical — something above the breakpoint is mutating.

## Batches

Non-time-sensitive bulk work at 50% cost. Submit, then poll `processing_status`:

```python
batch = client.messages.batches.create(requests=[
    {"custom_id": f"req-{i}", "params": {"model": "claude-sonnet-4-6",
     "max_tokens": 1024, "messages": [{"role": "user", "content": p}]}}
    for i, p in enumerate(prompts)
])
while client.messages.batches.retrieve(batch.id).processing_status != "ended":
    time.sleep(30)
for r in client.messages.batches.results(batch.id):
    ...  # r.custom_id maps back to your input; results are unordered
```

Results come back **unordered** — key on `custom_id`, never on position. SLA is up to 24h.

## Cost optimization

| Strategy | Savings | When to use |
|----------|---------|-------------|
| Prompt caching | Up to 90% on cached tokens | Repeated system prompt or context |
| Batches API | 50% | Non-time-sensitive bulk processing |
| Haiku over Sonnet | ~75% | Classification, extraction, routing |
| Shorter `max_tokens` | Variable | Output is known to be short |
| Streaming | 0% (same price) | Better UX only, not a cost lever |

## When to reach elsewhere

- Streaming, vision, and extended thinking are one-parameter changes (`stream=`, an `image` content block, `thinking={...}`) — the SDK reference has the shapes; they don't need a pattern here.
- Multi-turn agent orchestration, subagents, and session/filesystem machinery: use the Claude Agent SDK instead of hand-rolling the loop above.
- Exact current model IDs, pricing, and rate limits: docs.anthropic.com — never answer those from memory.
