---
name: create-linear-issue
description: Create one verified Linear issue from a Codex Agent Task v1 contract and optionally dispatch it under separate explicit authority. Use when a user asks Codex to create a Linear implementation issue for a repository handled by a mapped Symphony workflow.
---

# Create Linear Issue

Create one verified Linear issue per invocation through connected Linear tools.
Keep contract authoring, validation, mutation, and verification in this skill.

## Authority

- Treat an explicit create request as mutation authority for one resulting issue.
  Do not ask for redundant confirmation.
- Ask one narrow question only when a materially ambiguous field remains after
  bounded read-only resolution. Do not choose between zero matches or multiple matches.
- Treat issue creation and dispatch as separate authority decisions. A request
  to create does not authorize dispatch.
- Do not create teams, projects, workflow states, or labels.
- Stop before mutation when connected Linear tools are unavailable.

## Task contract

Render the description in this exact order. Omit `Notes For Agent` only when it
has no content; when present, keep it last.

```md
## Goal
<one concrete outcome>

## Context
- Repository: `<owner>/<repository>`
- Linear project: `<project name or URL>`
- <project-specific facts and links>

## Scope

In:
- <files, components, or systems the agent may change>

Out:
- <explicit non-goals>

## Acceptance Criteria

- [ ] <observable result>

## Verification

Run:

`<repository-owned command, or "agent selects smallest sufficient proof">`

## Risk

<low | medium | high>

## Notes For Agent

Workflow: <feature | fix | refactor | chore | pr>
Planning: <simple | full>
<optional constraints>
```

Replace every placeholder with concrete content. Require one outcome, an
explicit target repository, project-specific context, non-empty `Scope.In` and
`Scope.Out` lists, unique observable checkboxes, a verification instruction,
and a `low`, `medium`, or `high` risk. Reject empty, duplicate, out-of-order,
placeholder, unfinished, or malformed sections before any mutation.

Prefer one documented repository entrypoint such as `make test`, `npm test`, or
an equivalent checked-in command. Do not prescribe absolute paths, `~` paths,
global Codex or skill installation paths, or a bare language runtime invoking a
host-global script. When the repository has no stable validation entrypoint,
use `agent selects smallest sufficient proof` instead of inventing one.

## Workflow

### 1. Normalize the request

Collect the title, complete task description, explicit target repository, team,
project, state, requested labels, and whether dispatch was explicitly
requested. Keep one canonical expected value for every field used during
readback.

Require a trusted project-to-repository workflow mapping from an explicit user
statement or trusted workflow configuration. Confirm that the mapped
workflow's `after_create` hook clones the target repository into the issue
workspace. Reject an absent or conflicting mapping.

Treat a repository named in the issue as a validation claim, not permission to
escape the prepared workspace. Do not use a ticket-level `cd` or otherwise
switch repositories.

### 2. Validate the contract

Validate the title and rendered description against Codex Agent Task v1 before
any mutation. Stop with one actionable validation error when the contract is
malformed or unfinished. Do not create an issue that the downstream task
consumer would reject.

### 3. Resolve the destination

Use connected Linear tools to resolve the team first. Then resolve the project,
workflow state, and requested labels within that team's scope. Prefer
structured connector lookups over raw GraphQL. Limit each lookup to exact
matching or at most two result pages.

Require exactly one compatible match for every required destination:

- On zero matches, ask one narrow question for a corrected value.
- On multiple matches, ask one narrow question for the exact selection.
- Reject a project, state, or label that does not belong to the resolved team.
- Never create a missing destination object.
- Reject a project whose trusted repository mapping is absent or conflicts
  with the explicit target repository.

If dispatch was explicitly requested, resolve the existing `codex-ready` label
but keep it out of the create input.

### 4. Create once

Create one issue through the narrowest connected Linear issue-creation tool.
Pass the canonical title and description plus the resolved team, project,
state, and non-dispatch labels.

Treat a top-level API error, unsuccessful result, or missing issue identifier
as a definitive failure and stop. Never issue a second create call during the
same invocation.

### 5. Reconcile uncertainty

Treat a transport interruption, timeout, or incomplete response as an
uncertain create result. Before considering any retry, perform read-only reconciliation:

- Search within the bounded invocation window using the exact title and team,
  requesting at most two result pages.
- Compare the canonical description, project, state, and non-dispatch labels.
- If exactly one full match exists, treat it as the created issue.
- If zero, multiple, or partial matches exist, stop and report the ambiguity.
  An immediate zero-result read does not prove that the write did not happen.

Do not blindly retry or automatically repeat issue creation. Finish with at
most one resulting issue.

### 6. Verify by readback

Read the issue back by its returned internal id or identifier. Compare the
exact canonical title and description, resolved team, project, state, and
complete non-dispatch labels. Treat any mismatch or missing field as failure
and report the expected and actual values.

### 7. Optionally dispatch

`codex-ready` is never implicit. Add it only when dispatch was explicitly requested,
the contract and workflow mapping validate, destination resolution
succeeds, and the initial readback is exact.

Update the complete label union so existing labels are preserved. Read the issue back again
and verify that `codex-ready` is present before reporting
dispatch success.

### 8. Report the result

Return the identifier and URL, target repository, verified destination and
labels, whether reconciliation was needed, and whether dispatch was performed.
Report one failure clearly and stop; do not create compensating issues.
