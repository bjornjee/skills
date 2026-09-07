# Critique brief — example

This illustrative response follows the JSON contract in `agents/uiux-grader.md`; that file owns the output shape and `rubric.md` owns scoring and acceptance. The parent captures the response unchanged and follows SKILL.md for implementation and iteration limits. The evidence below is fictional example input, not a verification record.

## Verdict

Overall: ITERATE. The requested flow is present, but the Sessions link has unclear affordance and its supporting content needs stronger composition. Independence is established. All supplied evidence identifies revision `example-revision-1`.

## Per-dimension scores

- user-flow-fidelity: 4/5 — step-1-desktop shows the primary CTA and step-2-desktop shows the required next step.
- visual-register-match: 4/5 — both screenshots match the declared refined-minimal direction in register.md.
- content-density: 3/5 — step-2-desktop leaves the Sessions section as a heading and arrow without the supporting content required by flow-map.md.
- affordance-honesty: 2/5 — step-2-desktop makes the Sessions cross-link look decorative.
- brand-voice-adherence: N/A — flow-map.md explicitly declares no brand/voice constraints for this prototype; register.md supplies visual direction only.
- cross-locale-consistency: N/A — flow-map.md explicitly limits this task to one locale without a cross-locale preservation requirement.
- accessibility: 4/5 — audit A-1 and behavior rows 1–3 document contrast, keyboard access, and focus behavior for the selected flow.
- technical-quality: 4/5 — audit A-2 and behavior row 4 record the selected routes working without console errors at this revision.

Priority weights are all 1.0. Affordance has priority 3 and content density has priority 2. Null scores do not participate in priority calculations.

## Preservation gate

State: PASS. Behavior rows 1–4 and screenshots step-1-desktop and step-2-desktop cover the complete declared preservation contract at this revision.

## Audit gate

State: PASS. Audit A-1/A-2 covers the selected surfaces at this revision with no P0/P1 findings; disclosed P2 findings A-3/A-4 correspond to the two visual repairs below.

## Brief diff

No prior verdict was supplied.

## Critique brief

1. [affordance-honesty] step-2-desktop / A-3: make the Sessions cross-link visibly actionable while preserving its destination and keyboard behavior.
2. [content-density] step-2-desktop / A-4: compose the supporting content required by flow-map.md around the Sessions heading so it reads as a complete section.

```json
{
  "evidence_revision": "example-revision-1",
  "independent": true,
  "overall": "ITERATE",
  "scores": {
    "user-flow-fidelity": 4,
    "visual-register-match": 4,
    "content-density": 3,
    "affordance-honesty": 2,
    "brand-voice-adherence": null,
    "cross-locale-consistency": null,
    "accessibility": 4,
    "technical-quality": 4
  },
  "score_exceptions": {
    "brand-voice-adherence": {"state": "N/A", "reason": "flow-map.md explicitly declares no brand/voice constraints for this prototype; register.md supplies visual direction only."},
    "cross-locale-consistency": {"state": "N/A", "reason": "flow-map.md explicitly limits scope to one locale without a cross-locale preservation requirement."}
  },
  "preservation_gate": {"state": "PASS", "evidence": ["behavior rows 1–4 and screenshots step-1-desktop/step-2-desktop cover the complete declared contract at example-revision-1"]},
  "audit_gate": {"state": "PASS", "blocking_findings": [], "p2_findings": ["A-3: Sessions link affordance", "A-4: Sessions content composition"]},
  "critique_brief": [
    {"dimension": "affordance-honesty", "evidence": "step-2-desktop / A-3", "change": "Make the Sessions cross-link visibly actionable while preserving its destination and keyboard behavior."},
    {"dimension": "content-density", "evidence": "step-2-desktop / A-4", "change": "Compose the supporting content required by flow-map.md around the Sessions heading."}
  ],
  "brief_diff": [],
  "accepted_tradeoffs": [],
  "verification_gaps": []
}
```

## How the parent uses this

Follow SKILL.md Gate 2: address the evidenced findings and requested outcome in one coherent batch within the authorized scope. Check remaining iteration budget before dispatching another grader. Capture matching screenshots, behavior evidence, and audit findings after edits. Neither this example nor a quality verdict authorizes an additional round or additional scope.
