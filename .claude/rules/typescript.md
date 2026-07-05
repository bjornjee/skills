---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---
# TypeScript

General TS/Node rules. React Native specifics live in `react-native.md`; both may load on the same file — this one governs the language, that one the platform.

## Compiler is the first reviewer
- `strict: true` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` in every new tsconfig. Weakening compiler options to make code compile is fixing the smoke alarm with a hammer.
- No `any` — use `unknown` and narrow. No non-null `!` outside tests. No `as` on data you didn't construct.
- `@ts-ignore`/`@ts-expect-error` require a reason on the same line; prefer `@ts-expect-error` (it errors when stale).

## Trust boundaries
- Parse, don't cast: every external input (HTTP body, env, file, LLM output, queue message) goes through a schema (`zod` or equivalent) at the boundary. `JSON.parse(x) as Config` is a runtime bug with a type-checker alibi.
- Inside the boundary, trust the types — re-validating everywhere means the boundary isn't doing its job.

## Errors & control flow
- Throw only at boundaries; inside domain logic return discriminated unions / `Result` shapes so the compiler forces handling.
- Discriminated unions get exhaustiveness checks: a `switch` ends with a `never`-typed default (`assertNever(x)`), so adding a variant breaks the build, not production.
- `??` vs `||`: use `||` only when `0`/`''`/`false` are genuinely invalid values. Defaulting with `||` on numeric or string config is a classic silent bug.

## Async
- No floating promises: every promise is awaited, returned, or explicitly `void`-ed with a comment. Enable `@typescript-eslint/no-floating-promises`.
- Independent awaits go through `Promise.all` — sequential awaiting of unrelated calls is silent 2-10x latency.
- Async functions that can reject are handled where the context to handle them exists — an `unhandledRejection` crash in Node is a design failure, not bad luck.

## Modules & structure
- ESM only for new code (`"type": "module"`); no new CJS. Node built-ins imported with the `node:` prefix.
- Barrel files (`index.ts` re-export hubs) are import-cycle factories and tree-shaking obstacles — import from the concrete module.
- No mutable module-level state; module scope is for constants and pure definitions. A mutable module singleton is a hidden global with import-order semantics.

## Runtime & deps
- Stdlib before deps: `node:test`, built-in `fetch`, `node --env-file`, `node:util` `parseArgs` — reach for a package only when these run out.
- Pin engines (`"engines": { "node": ">=22" }`) and commit the lockfile. CI installs with `npm ci`, never `npm install`.

## Tests
- `node:test` (or the repo's established runner) with the same no-real-world rule as Go/Python: no live network, no wall clock, no shared module state between tests — reset or inject.
