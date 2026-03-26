# Workflow

These constraints apply to all development work regardless of language or platform.

## Research
- Search existing code, GitHub, library docs, and package registries before writing anything new.
- Prefer proven approaches over net-new code.

## Planning
- No code until the approach is agreed on.

## Implementation
- Write tests first. Target 80%+ coverage.
- Tests must fail before implementation (RED), pass after (GREEN), then refactor.

## Review
- All changes must be reviewed for correctness, security, and adherence to project conventions before committing.

## Git
- Conventional commits: `<type>: <description>` (feat, fix, refactor, docs, test, chore, perf, ci).
- PRs: full commit history analysis, `git diff [base-branch]...HEAD`, summary + test plan.
