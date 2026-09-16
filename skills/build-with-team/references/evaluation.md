# Evaluating the workflow

Use these behavioral scenarios when testing the skill. They are expected outcomes,
not evidence that tests have already run. Static package validation proves only
that the skill can be distributed and discovered.

For reproducible trials of reuse, scope changes, and browser integration, use
[trial setup and checks](evaluation-trials.md). Keep evaluator instructions separate
from the task prompt. Record actual outcomes before making effectiveness claims.

| Scenario | Expected observable behavior |
| --- | --- |
| User requests the framework, with no target application | Produces or improves the framework; no application interview, goal creation, or delivery launch |
| Existing viewer already supports the requested interaction | Inspects the capability and its contract, explains the actual gap, and reuses it when suitable |
| A legacy deployment path remains in code after an accepted replacement | Resolves current intent from evidence; does not preserve the legacy path merely because it exists |
| Duplicate suppression already belongs to an upstream layer | Traces callers and preserves the existing owner instead of adding another policy implementation |
| A consequential tenancy requirement is unknown | Presents one evidence-informed question with viable pills and tradeoffs; waits for the required choice |
| Architecture and acceptance are already settled | Skips redundant questions and advances the authorized slice |
| User changes the core journey while workers are active | Reconciles affected assignments and verifies subsequent work uses the new scope |
| Unit tests pass but the actual user journey fails at an integration | Reports incomplete acceptance and investigates the real boundary rather than claiming overall readiness |
| A small feature has no independent work to delegate | Keeps one owner; no artificial team ceremony |
| Two planned screens need the same control | Names its owner and contract, implements one component, and verifies both consumers use it correctly |
| A supplied scaffold has empty folders and outdated setup assumptions | Retains useful conventions after checking fit; demonstrates working consumers instead of treating folder names as proof |
| An application has a coherent layout unlike the reference scaffold | Preserves its layout and applies relevant ownership/reuse principles without imposing the example's directories |
| A task uses only one of the supported stacks | Loads relevant guidance only; does not add the other stacks or their tooling |
| Native screens share a capture session | Gives the session one owner and checks lifecycle behavior on the target platform |
| Python entrypoints share a business operation | Calls one implementation with composed dependencies instead of duplicating rules in each entrypoint |
| A small Go command or Rust binary needs one capability | Keeps a suitable small structure; does not invent interfaces, packages, or workspaces to match the illustration |
| A feature needs a component with genuinely different behavior | Keeps the behavior local rather than expanding a shared primitive with unrelated modes |
| Native goals or subagents are unavailable | Explains the relevant limitation and performs feasible work within current authority; invents no replacement runtime |

For an application trial, compare against ordinary single-task execution on
comparable work with the same model, tools, and acceptance criteria. Capture
accepted outcome, user corrections/decisions, avoidable rework, elapsed time, and
usage when available. Distinguish essential product choices and permission blocks
from interruptions caused by missing context or incorrect architecture.

Success means fewer avoidable human interventions without worse correctness,
simplicity, or integrated acceptance. More agents, documentation, or completed
subtasks are not success metrics. Record regressions and remove ceremony that
does not improve outcomes; a single successful trial does not establish reliability.
