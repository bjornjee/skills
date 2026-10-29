---
name: search-first
description: Research existing solutions and verify library APIs before coding. Use installed library skills and official documentation for dependency-specific guidance, alongside repository and package searches.
---

# /search-first — Research Before You Code

Systematizes the "search for existing solutions before implementing" workflow.

## Trigger

Use this skill when:
- Starting a new feature that likely has existing solutions
- Adding a dependency or integration
- The user asks "add X functionality" and you're about to write code
- Before creating a new utility, helper, or abstraction
- Implementing or debugging code that depends on library APIs or version-specific behavior

## Workflow

Need analysis → parallel search (npm/PyPI, MCP, skills, GitHub) → evaluate (functionality, maintenance, community, docs, license, deps) → decide (adopt / extend / build) → implement the minimum.

Before adopting: license compatible, maintained within the last year, and skim the transitive dependency tree — you inherit every one of them, including their CVEs.

## Decision Matrix

| Signal | Action |
|--------|--------|
| Exact match, well-maintained, MIT/Apache | **Adopt** — install and use directly |
| Partial match, good foundation | **Extend** — install + write thin wrapper |
| Multiple weak matches | **Compose** — combine 2-3 small packages |
| Nothing suitable found | **Build** — write custom, but informed by research |

## How to Use

### Quick Mode (inline)

Before writing a utility or adding functionality, mentally run through:

0. Does this already exist in the repo? → `rg` through relevant modules/tests first
1. Is this a common problem? → Search npm/PyPI
2. Is there an MCP for this? → Inspect the active runtime's enabled tool catalog first; consult runtime-specific configuration only when relevant
3. Is there a skill for this? → Inspect the active runtime's enabled skill catalog first; consult runtime-specific installation paths only when relevant
4. Is there a GitHub implementation/template? → Run GitHub code search for maintained OSS before writing net-new code

### Library guidance and documentation

1. Identify the relevant dependency and installed version from the active project. Read its installed project-local skill when available; keep project conventions and the runtime's instruction precedence authoritative over library preferences.
2. For Python/Node projects, if dependency skills have not been checked or dependencies changed, run `library-skills scan --json` from the relevant project/workspace member after dependencies are installed (`uvx library-skills scan --json` if the CLI is unavailable). Inspect `warnings`: a missing environment is not evidence that dependencies provide no skills. Scan once per relevant dependency change; do not scan unrelated projects or include transitive dependencies by default.
3. Read the relevant discovered `SKILL.md` before installing it. When installation is within the user's authorized task, select that skill with `library-skills install --skill <name> --yes`; add `--claude` for Claude Code. Keep dependency skills project-local, separate from globally synced personal skills. Use `library-skills --check` to verify installed links; do not bulk-install unrelated skills.
4. For unresolved API, setup, migration, or version questions, consult official documentation matching the installed version. Keep specialized official documentation workflows, such as OpenAI Docs, when applicable. Do not assume unversioned documentation matches an older installation.

In the handoff, briefly name the library skill or documentation source actually used, and any unresolved version or access gap. Installing a tool is not evidence that it was used.

### Full Mode (agent)

For non-trivial functionality, launch the researcher agent:

```
Task(subagent_type="general-purpose", prompt="
  Research existing tools for: [DESCRIPTION]
  Language/framework: [LANG]
  Constraints: [ANY]

  Search: npm/PyPI, MCP servers, Claude Code skills, GitHub
  Return: Structured comparison with recommendation
")
```

(Claude Code `Task` syntax — in Codex, run the research in a separate `codex exec` session.)

## Search Shortcuts by Category

### Development Tooling
- Linting → `eslint`, `ruff`, `textlint`, `markdownlint`
- Formatting → `prettier`, `black`, `gofmt`
- Testing → `jest`, `pytest`, `go test`
- Pre-commit → `husky`, `lint-staged`, `pre-commit`

### AI/LLM Integration
- Claude SDK → Official Anthropic documentation matching the installed version
- Prompt management → Check MCP servers
- Document processing → `unstructured`, `pdfplumber`, `mammoth`

### Data & APIs
- HTTP clients → `httpx` (Python), `ky`/`got` (Node)
- Validation → `zod` (TS), `pydantic` (Python)
- Database → Check for MCP servers first

### Content & Publishing
- Markdown processing → `remark`, `unified`, `markdown-it`
- Image optimization → `sharp`, `imagemin`

## Integration Points

### With plan mode
Run this skill before presenting a plan:
- The research identifies available tools
- The plan incorporates them instead of custom builds
- Avoids "reinventing the wheel" in the plan

### Progressive discovery
Repeat search cycles when the first pass is inconclusive:
- Cycle 1: Broad search (npm, PyPI, MCP)
- Cycle 2: Evaluate top candidates in detail
- Cycle 3: Test compatibility with project constraints

## Examples

### Example 1: "Add dead link checking"
```
Need: Check markdown files for broken links
Search: npm "markdown dead link checker"
Found: textlint-rule-no-dead-link (score: 9/10)
Action: ADOPT — npm install textlint-rule-no-dead-link
Result: Zero custom code, battle-tested solution
```

### Example 2: "Add HTTP client wrapper"
```
Need: Resilient HTTP client with retries and timeout handling
Search: npm "http client retry", PyPI "httpx retry"
Found: got (Node) with retry plugin, httpx (Python) with built-in retry
Action: ADOPT — use got/httpx directly with retry config
Result: Zero custom code, production-proven libraries
```

### Example 3: "Add config file linter"
```
Need: Validate project config files against a schema
Search: npm "config linter schema", "json schema validator cli"
Found: ajv-cli (score: 8/10)
Action: ADOPT + EXTEND — install ajv-cli, write project-specific schema
Result: 1 package + 1 schema file, no custom validation logic
```

## Anti-Patterns

- **Jumping to code**: Writing a utility without checking if one exists
- **Ignoring MCP**: Not checking if an MCP server already provides the capability
- **Over-customizing**: Wrapping a library so heavily it loses its benefits
- **Dependency bloat**: Installing a massive package for one small feature
