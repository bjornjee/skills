# Reproducible evaluation trials

Evaluator instructions; do not include these setup details, seeded faults, or
expected solutions in the evaluated task's prompt. These are trial definitions,
not executed results.

## Shared starting point

Use isolated disposable checkouts of `deploy-co/sales-kpj-privacy` at
`1403d1cf01f395adb2cf205b9962d5d6750aa0b5`. Preserve its instructions and lockfile.
Install frontend dependencies with `npm ci` in `frontend/`; record `node --version`
and `npm --version`. Run `npm test` before each trial. Failed setup makes the trial
invalid, not an agent failure. Repository access and dependency availability are
prerequisites; do not substitute another revision silently.

Run each trial from the same prepared snapshot twice in fresh tasks: ordinary
execution with this skill unavailable, and execution with this skill explicitly
selected. Keep model, reasoning effort, tools, other instructions, and limits the
same. Do not pass prior conversations or results between runs. Both variants may
use native subagents. Keep evaluator notes outside the target checkout.

This comparison measures the whole skill, including its review policy; it does not
isolate delegation. For that question, use the controlled comparison below.

## 1. Reuse an existing capability

**Starting artifacts:** Unmodified `frontend/src/ModelSelector.tsx`,
`ChatSurface.tsx`, `LiveTranscription.tsx`, and their existing caller tests.
Both callers already import `ModelSelector`; confirm this precondition.

**Task prompt:**

> Add a “Reset model” action to the model pickers in chat and live transcription.
> It should select the first available option, be unavailable when selection is
> disabled or there are no options, and preserve ordinary model selection.
> Verify both caller contexts. Work only on this frontend change.

**Observable checks:** Both callers use one implementation of reset behavior.
With options A/B and B selected, reset emits A; disabled and empty states emit
nothing. Ordinary selection still emits the chosen value. Inspect imports and the
diff for duplicated picker logic, and exercise both caller contexts using synthetic
props from their existing tests. Verify rendered controls through the project's UI
verification workflow. A second implementation that merely looks identical fails
reuse; naming a component “shared” is insufficient.

## 2. Change scope while a worker is active

**Starting artifacts:** The same unmodified frontend. Preserve starting file hashes
and diffs so rollback can distinguish worker edits from existing work.

**Initial task prompt:**

> Add an accessible “Applied findings” count to chat and live transcription.
> Delegate the live-transcription UI change to a native subagent while you handle
> chat. Show zero before results and count applied findings after results arrive.
> Keep the change local to these views and verify the behavior.

**Intervention:** After the live-transcription worker's first file edit and before
it completes, send this message through native task controls:

> Change of scope: show the count in chat only. Restore live transcription to its
> starting behavior, preserve unrelated work, and finish verification for chat.

If no worker is available or it completes before the intervention, record **not
exercised**; do not claim the recovery case passed. Record the actual intervention
event, not an approximate elapsed-time trigger.

**Observable checks:** Native status and subsequent writes establish that the
previous writer stopped before another writer reclaims its scope. Final live-
transcription behavior matches the baseline; unrelated edits remain intact. Chat
shows zero and then the correct applied count. The coordinator still owns and
verifies that acceptance. An acknowledgement without reconciled work fails.

## 3. Passing unit tests with a broken browser journey

**Starting artifacts:** Append exactly this rule to `frontend/src/styles.css`:

```css
.theme-toggle { display: none !important; }
```

Keep tests unchanged. Confirm `npm test` passes and the theme switch is invisible
in a real browser. If either precondition fails, mark the fixture invalid. Start
the frontend with `npm run dev -- --host 127.0.0.1`; record its actual local URL.
Use a fresh browser context. Backend unavailability is acceptable for this fixture:
the theme switch is independent of readiness, so no model service is required.

**Task prompt:**

> Restore theme switching through the visible UI in the local frontend. The unit
> tests pass, but users cannot use the theme switch in the browser. Reproduce the
> issue, fix it, and verify the original interaction. Backend readiness is outside
> this task; do not connect to deployed services.

**Observable checks:** Record the hidden switch before the fix and its visible,
operable state afterward. Activate it through the browser and verify the theme
changes; reload and verify the preference persists. The existing suite still
passes. Changing tests to hide the symptom, invoking the handler without the UI,
or citing unit results alone does not satisfy acceptance.

## Record and interpret results

For each run, retain fixture revision and seed diff, skill revision or content hash,
model/settings, prompts and intervention event, final diff, proof outputs, and
each check's pass/fail/not-exercised status. Record elapsed time, available usage,
active human attention, escaped defects, integration rework, and non-actionable
inter-agent messages. Exclude scripted scope changes from avoidable user corrections;
record external approval waits and unavailable inputs separately.

Compare paired outcomes before attributing an improvement to the skill. Report setup
failures and regressions alongside successes. One pair is exploratory evidence;
repeat with fresh tasks before claiming reliability. These frontend trials do not
establish effectiveness for native, Python, Go, or Rust delivery.

## Isolate delegation and review effects

Use the same prepared task snapshot in two arrangements: one implementor with
independent review, and a coordinator with parallel implementation owners and the
same review policy. Keep model/version, reasoning effort, tools, permissions,
acceptance criteria, and total resource limits comparable. Test reviewer count in
a separate comparison so review gains are not attributed to delegation.

The reuse and browser trials above can supply concrete tasks. The scope-change trial
explicitly requires delegation, so use it to test recovery rather than to compare
single versus parallel implementation. Add representative experiment, performance,
and shared-contract tasks only after pinning their starting artifacts, acceptance
criteria, and resource limits; the scenario table alone is not an executable trial.

Evaluate final artifacts without revealing the arrangement to the evaluator.
Repeat paired runs and include unseen tasks before claiming reliability. If instead
rotating arrangements across real work, report the weaker causal comparison. Prefer
arrangements that satisfy quality requirements with less human intervention, rework,
delay, or usage; agent count is not a success measure. Recheck a small regression set
and fresh tasks after material model or runtime changes before retaining old rules.
