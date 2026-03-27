# Principles

These apply to all work, all languages, all projects.

## KISS — Keep It Simple, Stupid
- Simplest solution that works. No premature abstraction.
- If three lines of code are clear, don't extract a helper.
- No feature flags, backwards-compat shims, or "just in case" code.
- One way to do things. If a pattern exists, follow it. Don't introduce alternatives.

## DRY — Don't Repeat Yourself
- Build foundational, reusable components well. The application layer above stays thin.
- Shared logic lives in shared packages. Import, don't duplicate.
- Constants, enums, and types are defined once and imported everywhere.
- If you copy-paste, you're doing it wrong — extract and share.

## Research Before Code
- Search GitHub, library docs, and package registries before writing anything new.
- Prefer battle-tested libraries over hand-rolled solutions.
- If an open-source project solves 80%+ of the problem, adopt or port it.

## Plan Before Implement
- No code until the approach is agreed on.
- Break complex work into phases. Identify dependencies and risks upfront.

## Test First
- RED → GREEN → REFACTOR. Target 80%+ coverage.
- Tests must fail before implementation, pass after.

## Review Before Commit
- All changes reviewed for correctness, security, and convention adherence.
- Address critical and high issues. Fix medium when possible.
