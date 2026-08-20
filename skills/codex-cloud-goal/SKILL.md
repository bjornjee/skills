---
name: codex-cloud-goal
description: Run a Codex Cloud implementation goal whose required terminal outcome is a created pull request. Use only when the caller deliberately chooses Cloud implementation through PR creation; do not use for review-only work or tasks that prohibit PR publication.
---

# Codex Cloud Goal

Run one implementation goal through `pr_created`. The Cloud worker owns edits,
tests, diff review, and PR metadata. The orchestrator owns worker launch/watch,
review iteration, persistent state, publication invocation, and recording the PR
URL. The configured Codex Cloud/GitHub integration owns branch, push, and PR
transport outside the worker container. The user owns merge unless they grant
separate, explicit authority.

## Bootstrap gate

The Cloud environment must run only:

```text
make sync-codex-cloud
make check-codex-cloud
```

Before launching a worker, require the configured Cloud worker and GitHub
publication capabilities. If either is absent, stop before implementation and
report the missing capability. Never substitute `gh`, direct GitHub credentials,
repository secrets, local CLI delegation, desktop plugins/hooks, or changes to
`/opt/codex`.

Validate the complete task text with this skill's
`scripts/validate-cloud-goal.js task`. A clause that prohibits opening, creating,
or publishing a PR contradicts this workflow. Reject it and require the caller to
choose either Cloud implementation through PR creation or a non-publishing
workflow. A merge prohibition is compatible and remains in force.

## Persistent state contract

The orchestrator persists this object in its durable goal state, outside the
worker checkout. Validate snapshots with `scripts/validate-cloud-goal.js state`
and each `{ "previous": ..., "next": ... }` update with
`scripts/validate-cloud-goal.js transition`:

```json
{
  "state": "planned",
  "implementation_complete": false,
  "verification_passed": false,
  "review_passed": false,
  "pr_metadata": null,
  "pr_url": null,
  "last_error": null,
  "evidence": []
}
```

Allowed states, in order, are `planned`, `implementing`, `verifying`,
`reviewing`, `iterating`, `publishing`, and `pr_created`. Repeat
`iterating -> verifying -> reviewing` until review passes. Persist the latest
state before each launch or external mutation so a resumed orchestrator watches
or continues the existing goal instead of duplicating work or publication.

`pr_created` is valid only when `implementation_complete=true`,
`verification_passed=true`, `review_passed=true`, `pr_metadata` is complete,
and `pr_url` is a concrete HTTPS pull-request URL. Earlier states must not carry
a PR URL. On merge-style updates, explicitly clear stale `pr_url`,
`pr_metadata`, pass flags, and `last_error`; omission is not clearing.

## Worker handoff

Give the worker the agreed plan, exact scope, Full verification commands, and
repository rules. Require one structured result containing:

- implementation status and changed files;
- verification commands and outcomes;
- review findings, with blocking findings resolved;
- PR title, PR body with summary and test plan, head branch, and base branch.

The worker must not run `git push` or publish. When it reports unresolved review
findings, move to `iterating`, record the error and evidence, send the concrete
feedback to the same goal, then verify and review again. A failed test or review
explicitly writes its boolean false and cannot advance to publication.

## Publication

<publishing>
The outcome of this goal is a created pull request.
Do not use gh or direct GitHub credentials inside the worker.
After verification and review pass, prepare the PR metadata and invoke
the configured Codex Cloud publication capability.
Do not mark the goal complete until a PR URL is recorded.
Merging is outside this goal unless explicitly authorized.
</publishing>

Move to `publishing` only after all three booleans are true. Invoke publication
once with the reviewed metadata, read back the created PR, record its URL, then
move to `pr_created`. If publication fails or its result lacks a concrete URL,
remain in `publishing`, record the error, and do not claim completion. Never
merge as part of this goal.
