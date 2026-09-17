# Historical KPJ evaluation fixtures

Optional repository-specific fixtures for the [evaluation protocol](evaluation-trials.md).
These trial definitions were prepared from a historical repository snapshot; they
are not executed results or prerequisites for using the skill. Keep setup details,
seeded faults, and expected solutions out of the evaluated task's prompt.

## Shared starting point

Use isolated disposable checkouts of `deploy-co/sales-kpj-privacy` at
`1403d1cf01f395adb2cf205b9962d5d6750aa0b5`. Preserve its instructions and lockfile.
Install frontend dependencies with `npm ci` in `frontend/`; record `node --version`
and `npm --version`. Verify `npm test` on the unmodified checkout before seeding each
trial. Setup failures invalidate the trial; deliberately seeded failures do not.
Repository access and dependency availability are
prerequisites; do not substitute another revision silently.

Use the comparison conditions and evidence recording in the evaluation protocol.
These fixtures cover frontend reuse, scope recovery, and browser integration only.

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
> this task; do not connect to deployed services. The chosen theme must persist
> after reloading.

**Observable checks:** Record the hidden switch before the fix and its visible,
operable state afterward. Activate it through the browser and verify the theme
changes; reload and verify the preference persists. The existing suite still
passes. Changing tests to hide the symptom, invoking the handler without the UI,
or citing unit results alone does not satisfy acceptance.

The scope-change fixture explicitly requires delegation. Use it to evaluate recovery,
not to compare single versus parallel implementation. The browser fixture's hidden
switch is a negative control for the UI check even though unit tests pass.
