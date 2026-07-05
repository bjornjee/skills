---
name: incident-response
description: Use when production is broken or degraded — mitigation-first response, timeline capture, severity ladder, and blameless postmortems. Agent-loop failures go to agent-introspection-debugging instead.
---
# Incident Response

Production is broken. The goal ordering is: stop the bleeding → understand → prevent recurrence. (Agent-loop failures are a different skill: `agent-introspection-debugging`.)

## Mitigate before you diagnose
- First move restores service, not understanding: roll back the last deploy, disable the feature/config, shed load, scale out. Root cause comes after users stop hurting.
- Rollback is the default mitigation. "Roll forward with a fix" needs justification: the fix is truly one line, verified locally, and rollback is impossible or worse.
- If the trigger is unknown, bisect reality: what changed in the last N hours — deploys, config, dependencies, traffic shape, certificates, quotas.
- One person mitigates; another investigates. The same pair of hands doing both serializes the incident.

## Declare early, classify honestly
- Declare on suspicion, not certainty — a false alarm costs minutes; a late escalation costs the SLA. Nobody is punished for declaring.
- Severity ladder (adjust names to the org, keep the shape):
  - **SEV1** — users down / data loss in progress: all hands, comms channel opens, updates every 30 min.
  - **SEV2** — degraded or subset impact: owner + backup engaged, updates hourly.
  - **SEV3** — internal-only / cosmetic: ticket, fix in normal flow.
- Say what you know, what you don't, and when the next update comes. Silence reads as abandonment.

## Capture the timeline as you act
- Timestamped notes in the incident channel *while acting*: what you saw, what you ran, what changed. Memory reconstructs badly and postmortems built from memory are fiction.
- Save the evidence before it rotates: log excerpts, graphs (screenshot with time range), the exact failing request. Dashboards age out; the postmortem needs the artifact.
- Every mitigation action is announced before it's taken ("rolling back api to v141 now") — two people mitigating unannounced is how incidents get worse.

## Blameless postmortem (within 48h for SEV1/2)
- Structure: impact (who/what/how long) → timeline (from the notes) → contributing factors → what went well → action items.
- "Human error" is never a root cause — it's the start of the next question: what made the error easy to make and hard to catch? Fix the system, not the human.
- Contributing factors, plural. Single-root-cause narratives are almost always incomplete for real incidents.
- Action items have an owner and a date or they are wishes. "Add alert on queue age" beats "improve monitoring".
- Feed durable patterns into `LEARNINGS.md` — a postmortem nobody can find prevents nothing.

## When NOT to apply
Pre-production breakage: fix it via the normal bug-fix flow (evidence, RED, GREEN) — no severity theater. But if staging shares infrastructure with prod, treat infrastructure incidents as real ones.
