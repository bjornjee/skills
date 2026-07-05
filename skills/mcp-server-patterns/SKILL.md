---
name: mcp-server-patterns
description: Use when building or debugging an MCP server — tool/resource/prompt registration, tool-description engineering, the isError contract, authz and path sandboxing, stdio vs Streamable HTTP. Node/TypeScript SDK; defer to Context7 for current signatures.
---

# MCP Server Patterns

The Model Context Protocol lets a client's model call your **tools**, read your **resources**, and expand your **prompts**. This covers the design rules that don't churn; the SDK surface does — verify method names and signatures against the current [MCP docs](https://modelcontextprotocol.io) or Context7 (query "MCP") before copying any signature.

## Primitives

- **Tools** — actions the model invokes (search, run, write). Registered via `registerTool()` / `tool()` depending on SDK version.
- **Resources** — read-only data the model fetches by `uri` (file contents, API responses). Registered via `registerResource()` / `resource()`.
- **Prompts** — parameterized templates the client surfaces to the user (e.g. Claude Desktop slash commands).

Pick the primitive by control and effect: **resource** for read-only, addressable, cacheable data the *client* pulls by `uri`; **tool** for anything with side effects or computed/parameterized retrieval the *model* invokes per call; **prompt** for a user-triggered template, not an autonomous model action. Modeling a mutation as a resource hides it from the client's approval gate.

Validate every tool input with **Zod** (or the SDK's schema format) — an unvalidated `input` reaches your handler as `any`.

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

// registration signature varies by SDK version (positional vs options-object) — check the docs
server.registerTool(
  "get_file",
  {
    description: "Read a repo-relative text file. Not for binaries or URLs.",
    inputSchema: { path: z.string().describe("repo-relative path, no leading /") },
  },
  async ({ path: rel }) => {
    const abs = resolveInsideRoot(rel);           // canonicalize + allowlist check (see Authz)
    if (!abs) return { content: [{ type: "text", text: `Rejected path: ${rel}` }], isError: true };
    return { content: [{ type: "text", text: await fs.readFile(abs, "utf8") }] };
  },
);
```

## Transport

- **stdio** for local clients (Claude Desktop) — one client per process.
- **Streamable HTTP** for remote (Cursor, cloud): the current single-endpoint spec. Prefer it over legacy HTTP+SSE, which you add only for backward compatibility.

Keep tool/resource logic transport-agnostic and pick the transport in the entrypoint, so the same server runs either way.

Streamable HTTP runs **stateful** (a session id per client; the server holds per-session context) or **stateless** (each request self-contained). Choose stateless for horizontally-scaled or serverless deploys — a stateful session pinned to one instance breaks behind a load balancer without sticky routing.

## Tool-description engineering

The description is the **only** signal the model uses to decide whether to call your tool — it is a prompt, not a docstring.

- **State when to use AND when not to.** "Search indexed docs. Not for live web — use `fetch_url` for that." Explicit boundaries stop mis-fires.
- **Name parameter semantics precisely.** `path` is ambiguous; `absolute_path` / `repo_relative_path` is not. The schema's `.describe()` text is read by the model, so spend words there.
- **Two sharp tools beat one flag-switched tool** when behaviors diverge. `list_files` + `delete_file` are clearer and safer than `file_op(action, …)` — the model reasons better about narrow tools, and you can gate them independently.
- **You pay the description token cost on every request** — all tool defs sit in the context window. Budget it: trim prose, drop redundant examples, and don't register tools a session will never use.

## Error contract

The model acts on your result shape, so make failure legible:

- **User-recoverable errors** (bad input, not-found, rate-limited) → return content with **`isError: true`** and an actionable message the model can relay or retry on: `{ content: [{ type: "text", text: "No file at <path>. Check the path and retry." }], isError: true }`.
- **Protocol / programmer failures** (server bug, unreachable dependency) → **throw**, and let the transport surface a protocol error rather than dressing it up as a tool result.
- **Empty success must be distinguishable from error.** A tool that returns `[]` for both "no matches" and "query failed" makes the model retry blindly. Return an explicit `"no matches"` success versus an `isError` failure.
- Never leak raw stack traces into tool content — they burn tokens and teach the model nothing it can act on.

## Authz & sandboxing

Tools run with your server's privileges, and the model's input is untrusted.

- **Scope tool visibility per session / caller.** Register admin or destructive tools only for authorized callers — don't expose `delete_project` to every session because one operator needs it.
- **Canonicalize file/exec paths against an allowlist root.** Resolve to an absolute real path first (`fs.realpathSync` / `path.resolve`), *then* check it is still under the allowed root. Reject `..` traversal **after** resolution — a prefix check before resolving is bypassable via symlinks and `../`.
- **Never let tool args reach a shell unquoted.** Pass argv arrays (`execFile`, not `exec`); string-interpolating model output into a shell command is command injection with the model as the attacker's proxy.
- **Declare tool annotations honestly.** Hints like `readOnlyHint` / `destructiveHint` let clients gate auto-approval; a destructive tool mislabeled read-only invites an unsafe auto-run. The annotation is a claim the client trusts — don't buy smoother UX with a lie.

## Best practices

- **Idempotency:** prefer idempotent tools so a retried call is safe.
- **Rate & cost:** for tools hitting external APIs, note limits and cost in the description — the model can't see your quota.
- **Versioning:** pin the SDK in `package.json` and read release notes before bumping; registration signatures have changed across versions.

## Official SDKs

- **TypeScript/JavaScript:** `@modelcontextprotocol/sdk` (npm) — the reference implementation.
- **Go:** `modelcontextprotocol/go-sdk`. **C#:** the official .NET SDK.

For any current signature, defer to Context7 (library "MCP") or the official docs — this skill deliberately doesn't pin them.
