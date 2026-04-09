---
name: git-workflow
description: REQUIRED when making git commits, creating branches, writing PR descriptions, or resolving merge conflicts. Enforces conventional commits, branching strategy, and safe git practices. Do NOT commit without this skill active.
---

# Git Workflow — Mandatory Conventions

These are not suggestions. Every commit, branch, and PR MUST follow these patterns.

## When to Activate

- Making any git commit (conventional commit format is mandatory)
- Creating branches or PRs
- Resolving merge conflicts
- Managing releases and tags
- This skill activates implicitly for all git operations

## Branching Strategies

### GitHub Flow (Simple, Recommended for Most)

```
main (protected, always deployable)
  |
  +-- feature/user-auth      -> PR -> merge to main
  +-- feature/payment-flow   -> PR -> merge to main
  +-- fix/login-bug          -> PR -> merge to main
```

**Rules:**
- `main` is always deployable
- Create feature branches from `main`
- Open Pull Request when ready for review
- After approval and CI passes, merge to `main`

### Trunk-Based Development (High-Velocity Teams)

- Everyone commits to `main` or very short-lived branches (1-2 days max)
- Feature flags hide incomplete work
- CI must pass before merge

### When to Use Which

| Strategy | Team Size | Release Cadence | Best For |
|----------|-----------|-----------------|----------|
| GitHub Flow | Any | Continuous | SaaS, web apps, startups |
| Trunk-Based | 5+ experienced | Multiple/day | High-velocity teams |
| GitFlow | 10+ | Scheduled | Enterprise, regulated |

## Commit Messages

### Conventional Commits Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting, no code change |
| `refactor` | Code refactoring |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `revert` | Revert previous commit |

## Merge vs Rebase

### Merge (Preserves History)

Use when merging feature branches into `main`, when multiple people worked on the branch, or when the branch has been pushed.

### Rebase (Linear History)

Use when updating your local feature branch with latest `main`, when you want clean history, and when you're the only one working on the branch.

**NEVER rebase branches that have been pushed to a shared repository or that others have based work on.**

## Conflict Resolution

```bash
# See conflicted files
git status

# After resolving, stage and commit
git add src/auth/login.ts
git commit
```

### Prevention Strategies

- Keep feature branches small and short-lived
- Rebase frequently onto main
- Communicate about touching shared files
- Review and merge PRs promptly

## Branch Naming Conventions

```
feature/user-authentication
fix/login-redirect-loop
hotfix/critical-security-patch
release/1.2.0
experiment/new-caching-strategy
```

## Anti-Patterns

- Committing directly to main
- Committing secrets
- Giant PRs (1000+ lines)
- Vague commit messages ("update", "fix")
- Rewriting public history (`git push --force`)
- Long-lived feature branches (weeks/months)
- Committing generated files or node_modules
