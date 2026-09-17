# Decision probes — 2026-09-17

These are exploratory, fresh-context planning probes during the rewrite, not paired
current-versus-candidate trials or end-to-end application results. They do not
establish model accuracy, implementation quality, interview quality, or generalization.

## Conditions and inputs

Four read-only native subagent runs inherited the desktop task's model/settings,
with conversation history disabled. The exact model revision and effort were not
independently pinned, limiting reproducibility. Tools and external effects were
restricted by the exercise: no writes, external calls, further agents, or real-user
contact. Agents could read the candidate skill and relevant runtime references;
evaluator files and other temporary artifacts were excluded from their assignment.
The trials ended at the next planning/decision boundary, so native question-tool
behavior and actual implementation were not exercised.

The three scope probes received the same task inputs:

- Request: build a local Python/browser-JavaScript invoice review application that
  accurately interprets uploaded invoices, surfaces unsupported documents for review,
  and permits independent extraction tuning. Supplier contacts may be fabricated.
- Session: an earlier assistant asked whether to use deterministic sample extraction
  or real extraction, recommending samples. No answer, provider, or representative
  invoice set exists yet.
- Agent-authored brief: hardcoded fields and passing deterministic workflow tests
  define completion; real extraction is future work.

The task was to use the candidate skill, inspect these inputs, and return next actions,
work ready to proceed, necessary questions, and acceptance status. No desired solution
or prior probe result was supplied. Explicit user requirements are the independent
basis for judging scope; the conflicting brief is a negative control.

The existing-code probe received a planning-only request to add reset-to-first-option
to two accepted pickers, preserving empty/disabled/ordinary selection behavior and
existing organization. The fixture contained one shared selectOption function and
two importing consumer aliases, plus a minimal module manifest. The task requested
ownership, verification, and any necessary decisions, without an expected design.

## Observations

| Run | Observed behavior | Assessment |
| --- | --- | --- |
| Initial scope probe | Rejected fabricated extraction, but repeated real-versus-demo as a required decision and treated implementation as unaccepted | Scope preserved; avoidable user bottleneck remained |
| Existing-code probe | Proposed one shared reset operation, both consumer aliases, focused behavior checks, and retained the flat structure | Planning met reuse/proportionality criteria; no implementation was executed |
| Scope probe after a prose clarification | Again rejected scope reduction but described the earlier question as a pending user-owned choice; did identify missing representative data | Clarification did not reliably eliminate the false prerequisite |
| Scope probe after reframing the decision rule | Explicitly kept the original requirement active; identified missing labeled evidence; proposed independent contract/workflow work with unassessed results; withheld accuracy acceptance | Scope/progress planning criteria met in this run; complete interview behavior remains unvalidated |

The final run stated: “The original requirement remains active” and “Ready to proceed:
architecture and the extractor contract, plus a provisional upload/review/export
workflow whose results are clearly marked unassessed.” It did not ask the user to
reconfirm real extraction. Its suggested choices still combine data provision,
provider authority, and an optional UI milestone; this is not evidence of polished
interview design. Native choice grouping needs a separate interactive trial.

The resulting rule distinguishes an optional assistant-proposed scope reduction from
an actually missing user decision and from missing technical inputs. This replaced
ambiguous waiting language rather than adding an exception for invoice applications.

## Final runtime snapshot

SHA-256 for each runtime Markdown file, with paths relative to the skill directory:

```json
{
  "SKILL.md": "5b040364874bd969772a57c3283cfee38d8bc5421532fd807248088b6e272381",
  "references/architecture.md": "5b7f33920b586bbe56826b93b409df2e49111a532529cb167f1955ab5fdd20d2",
  "references/coordination.md": "4e499508437b67179d9d7f73fa15ee70debb83193301062855f185e735b8213c",
  "references/frontend-architecture.md": "d59a6e23e6a64456aef6ec2c4392f9051e4ffb971a47ca6b2ff9979e719e6b2b",
  "references/golang-architecture.md": "14d698cf961accaccfa6db673eb55170b4afd3e2d246c6110f9f7da94a2ed3ca",
  "references/python-architecture.md": "81659d819706f374a229bb20f4fc4dff5b2a851f4186e2a874efc38fd89b1fac",
  "references/react-native-architecture.md": "6bfc82bc06e4a79375ddc97c9a56298f3ae24d4795b9dcca6846ad6db789d21d",
  "references/rust-architecture.md": "d1505d63b3a3846cbc768372ecc65d8f1798256b2cfa9fc4467dfec220056643"
}
```

Earlier intermediate runtime hashes were not retained; their observations are
exploratory records, not replayable revision comparisons. The final mapping above
identifies the version consumed by the last scope probe.

## Remaining validation

The [trial protocol](evaluation-trials.md) defines the stronger next checks: matched
current/candidate environments, held-out capability cases, real implementation
substitution, rendered shared consumers, and full integrated acceptance. None of
those application trials was run in this PR. Static validators and package tests
are reported separately and are not substitutes for these trials.
