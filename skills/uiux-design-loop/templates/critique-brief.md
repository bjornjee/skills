# Critique brief — example

This illustrative response follows the JSON contract in `agents/uiux-grader.md`; that file owns the output shape and `rubric.md` owns scoring and acceptance. The parent captures the response unchanged and follows SKILL.md for implementation and iteration limits. The evidence below is fictional example input, not a verification record.

## Verdict

Overall: ITERATE. The requested flow is present, but the Sessions link has unclear affordance and its supporting content needs stronger composition. Route/console behavior evidence is missing. Independence is established. All supplied evidence identifies revision `example-revision-1`.

## Per-dimension scores

- user-flow-fidelity: 4/5 — step-1-desktop shows the primary CTA and step-2-desktop shows the required next step.
- visual-register-match: 4/5 — both screenshots match the declared refined-minimal direction in register.md.
- content-density: 3/5 — step-2-desktop leaves the Sessions section as a heading and arrow without the supporting content required by flow-map.md.
- affordance-honesty: 2/5 — step-2-desktop makes the Sessions cross-link look decorative.
- brand-voice-adherence: N/A — flow-map.md explicitly declares no brand/voice constraints for this prototype; register.md supplies visual direction only.
- cross-locale-consistency: N/A — flow-map.md explicitly limits this task to one locale without a cross-locale preservation requirement.
- accessibility: 4/5 — audit A-1 and behavior rows 1–3 document contrast, keyboard access, and focus behavior for the selected flow.
- technical-quality: UNVERIFIED — behavior row 4 lacks route/console results at this revision; audit A-2's source review cannot establish live behavior.

Priority weights are all 1.0. Affordance has priority 3 and content density has priority 2. Null scores do not participate in priority calculations.

## Preservation gate

State: WARN. Behavior rows 1–3 and screenshots step-1-desktop and step-2-desktop are fresh, but row 4 lacks required route/console results for the preservation contract. No confirmed regression is established by that missing evidence.

## Audit gate

State: PASS. Audit A-1/A-2 covers the selected surface files at this revision with no P0/P1 findings; disclosed P2 findings A-3/A-4 correspond to the two visual repairs below. A-5 is an optional P3 suggestion to refine decorative spacing. The source audit does not substitute for missing live behavior evidence.

## Brief diff

No prior verdict was supplied.

## Critique brief

1. [affordance-honesty] step-2-desktop / A-3: make the Sessions cross-link visibly actionable while preserving its destination and keyboard behavior.
2. [content-density] step-2-desktop / A-4: compose the supporting content required by flow-map.md around the Sessions heading so it reads as a complete section.

Before acceptance, collect the missing route/console results for technical-quality and the preservation gate. If no verification budget remains, report this gap without dispatching another grader. A-5 remains optional and does not authorize additional work.

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
    "technical-quality": null
  },
  "score_exceptions": {
    "brand-voice-adherence": {"state": "N/A", "reason": "flow-map.md explicitly declares no brand/voice constraints for this prototype; register.md supplies visual direction only."},
    "cross-locale-consistency": {"state": "N/A", "reason": "flow-map.md explicitly limits scope to one locale without a cross-locale preservation requirement."},
    "technical-quality": {"state": "UNVERIFIED", "reason": "behavior row 4 lacks route/console results at example-revision-1; source audit A-2 cannot establish live behavior."}
  },
  "preservation_gate": {"state": "WARN", "evidence": ["behavior rows 1–3 and screenshots step-1-desktop/step-2-desktop are fresh; row 4 lacks required route/console results at example-revision-1"]},
  "audit_gate": {"state": "PASS", "blocking_findings": [], "p2_findings": ["A-3: Sessions link affordance", "A-4: Sessions content composition"], "p3_findings": ["A-5: Optional decorative spacing refinement"]},
  "critique_brief": [
    {"dimension": "affordance-honesty", "evidence": "step-2-desktop / A-3", "change": "Make the Sessions cross-link visibly actionable while preserving its destination and keyboard behavior."},
    {"dimension": "content-density", "evidence": "step-2-desktop / A-4", "change": "Compose the supporting content required by flow-map.md around the Sessions heading."}
  ],
  "brief_diff": [],
  "accepted_tradeoffs": [],
  "verification_gaps": ["technical-quality and preservation gate: collect missing route/console results for behavior row 4 at example-revision-1"]
}
```

## How the parent uses this

Follow SKILL.md Gate 2: address the evidenced findings and requested outcome in one coherent batch within the authorized scope. Check remaining iteration budget before dispatching another grader. Capture matching screenshots, behavior evidence, and audit findings after edits. Neither this example nor a quality verdict authorizes an additional round or additional scope.
