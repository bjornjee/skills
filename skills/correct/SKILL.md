---
name: correct
description: Prevent a demonstrated recurring agent mistake with a scoped structural fix or executable guard. Use when asked to stop a repeated mistake or enforce a recurring correction, rather than for an ordinary one-off bug fix.
---

# Correct

Turn a recurring correction into a repository change that prevents or detects the
mistake. Prefer enforcement over adding another instruction, while keeping the
intervention proportional to the demonstrated failure.

## Establish the mistake

Start with the user's examples, failing output, review feedback, or selected
changes. Identify the violated invariant and the shared cause. Cite the concrete
occurrences; distinguish demonstrated recurrence from a suspected pattern. When
evidence is missing, inspect the relevant files and a bounded slice of their
history, not every session or repository artifact.

Check whether the repository already has a guard, canonical API, or clear rule.
If a guard exists, find why it was bypassed or not run before adding another. A
missed existing instruction is not evidence that more wording will help. An agent
currently looping or losing context belongs with `agent-introspection-debugging`;
this skill addresses prevention in future work.

For the selected class, state the invariant, the evidence, and the smallest useful
intervention. If no recurrence can be established, report that limit and handle
the concrete issue without inventing a broader rule.

## Choose the strongest practical prevention

Consider these options in order, stopping at the smallest one that addresses the
cause within the agreed scope. This is a preference, not a requirement to redesign
the repository before adding a test.

1. **Remove the opportunity.** Give duplicated state one owner, derive a repeated
   list from its source, or route callers through an existing canonical API.
   Inspect callers and compatibility requirements before removing an old path.
2. **Reject the invalid form.** Use an existing type boundary or validator. If a
   lint or repository check fits better, make its error name the problem and the
   supported alternative. Use existing tooling before adding a dependency or CI
   workflow. A ratchet may reject new violations while separately tracking known
   debt; do not silently exempt changed violations.
3. **Protect the behavior.** Add a regression check for the observable failure,
   not the current implementation's shape. Prefer an existing test surface.
4. **Clarify a judgment call.** When a machine cannot distinguish good from bad
   reliably, refine the relevant existing guidance with the decision criterion
   and a useful example. Do not replace judgment with a brittle keyword ban.

## Implement and prove within scope

Follow the active doctrine's planning, worktree, proof-profile, and review rules.
An audit request stays read-only; an approved prevention change authorizes that
change, not a sweep of unrelated mistake classes or global guidance edits.

Before implementing a guard, replay a real offending case in an isolated fixture
or worktree and capture the failure. Match each historical case to its applicable
contract and revision; reverted or superseded behavior is not automatically a
current requirement. After the change, show that the original
case is prevented or detected and that a legitimate nearby case still works.
For a new validator, feed it the historical bad form as well as valid forms; a
test that always fails or bans legitimate behavior is not useful enforcement.
Use the package's normal test entrypoint so the guard actually runs. Reuse the
same check in local and existing CI flows where applicable; disclose an unwired
CI check or an untested boundary rather than claiming coverage.

If a reliable guard would require a larger redesign, explain the tradeoff and
propose that work separately. For judgment-only guidance, review representative
good and bad decisions and state that no executable prevention was established.
Do not automatically add a rule table, edit installed skills or global doctrine,
commit changes, or file external follow-ups. Retire redundant guidance only when
its full intent is covered and that edit is within scope.

## Handoff

Briefly report the mistake and evidence, the intervention and why it fits, the
checks actually run, and any remaining ways the mistake can occur. Keep proposed
work distinct from implemented and verified work.

Adapted from pstack's `correct`; source revision and MIT notice are in [LICENSE](LICENSE).
