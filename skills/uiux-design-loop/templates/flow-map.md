# User flow — <feature or page name>

> Before Gate 1, declare the selected journeys and controls. The grader evaluates live completion as well as renders. Keep this proportional: a cosmetic change may need one control and its adjacent transition; a multi-step editor needs complete journeys and relevant recovery branches.

## User, goal, and scope

- User and task to accomplish: `<who, why, observable completion>`
- Selected surfaces, viewports, and locales: `<include relevant adjacent transitions>`
- Exclusions and rationale: `<what is outside this task and why>`
- Environment: `<functioning product / prototype; simulated and unavailable integrations>`
- Persistence contract: `<draft / session / reload / durable storage; what is actually supported>`

## Journeys and decision points

Give each journey a stable ID. Follow real controls from entry to completion, including branches material to the change. Declare selected screenshot states/viewports separately from interaction coverage; do not require a screenshot for every click.

| ID | Entry and preconditions | Steps and decisions | Observable completion | Failure / exit / recovery branches |
|---|---|---|---|---|
| J1 | `<user/data/state>` | `<state → action → next state>` | `<result visible to user and persisted as promised>` | `<validation, retry, undo, Back, unsaved exit as applicable>` |

## Actionable controls

Inventory every actionable control in the declared scope: buttons, links, selectors, editable fields, menu items, and keyboard actions. Group repeated instances only when their behavior is equivalent; name the group and representative instances to verify. This table can link an existing button map rather than duplicate it.

| ID / journey / state | Label and purpose | Preconditions | Action | Destination / state change | Persistence | Recovery |
|---|---|---|---|---|---|---|
| C1 / J1 / `<state>` | `<visible or accessible label; intended result>` | `<selection, permissions, mode, validity>` | `<click, type, key>` | `<route, selection, focus, visible result>` | `<draft vs committed; lifetime>` | `<Cancel, Back, retry, undo, or reason none applies>` |

## Interaction invariants

Record only applicable contracts, referencing control IDs:

- Primary completion action per state; labels predict effects/destinations. Explain any necessary intermediate screen or modal.
- Read-only/edit entry; Save commit boundary; Cancel rollback across all draft fields/generated content (or explicit autosave semantics).
- Back/close/navigation and unsaved work; selection after creation; consistent preview, counts, links, and downstream consumers.
- Loading/disabled/error/empty states and retry/undo; keyboard operation, validation focus, and focus return.
- What remains invariant across viewports/locales, and intentional differences.

Link preserved behavior to `preservation-contract.md`. Link journey/control IDs to results in `behavior-check.md`; do not infer completion from screenshots.

## Example — interview preparation (adapt, do not mandate)

For a multi-step preparation prototype, useful journeys would be:

- J1: shared brief/sources + roles → generate shared and role-specific questions/topics with source references → review/edit → save plan.
- J2: existing preparation opens read-only → Edit → change questions/topics/guidance → Cancel restores all originals; repeat and Save commits once.
- J3: add role → optionally suggest both questions and topics inline → Save role → return with new role selected → preview via role dropdown. Existing roles, counts, and the one shared interview link remain consistent.
- J4: unchanged shared link → participant name and role → interview uses shared plus selected-role preparation → answer → review/edit → finish.

In a prototype, demonstrate these local transitions while naming sample AI, reset-on-refresh state, and simulated finish. Those observations do not verify real generation, durable storage, or submission.
