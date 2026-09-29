# Manage GPU Runs: validation

Maintainer record for the standalone GPU-lifecycle skill, 2026-09-29.

## Scope

The skill accepts a caller-supplied workload through an existing brief or command.
It owns resource admission, supervision, preservation and cleanup, while workload
selection and scientific acceptance stay with the caller. An allocation lease can
cover multiple jobs only within explicit shared limits. No particular optimizer,
framework, companion skill or integration API is required.

The package contains the entrypoint, UI metadata and two operational references.
It contains no experiment-search, data-curation or model-selection doctrine,
project-specific examples, executable helpers or cloud-provider adapter.

## Static verification

- Skill-creator `quick_validate.py skills/manage-gpu-runs`: passed.
- `node scripts/check-version-bump.js origin/main`: passed for 2.3.0 to 2.4.0.
- `make test`: all 128 repository tests passed.
- `git diff --check`: passed; old skill names and removed-reference links are
  absent from the new package and README.

These checks verify packaging and repository invariants, not live GPU operation.
No allocation, training, transfer, installation or deployment was performed.

## Independent audit and offline probes

A fresh strict reviewer read the complete PR plus working-tree replacement and
applicable authoring/harness guidance, without parent conversation history. It
received six synthetic requests and facts without expected answers, and wrote an
isolated temporary report. The coordinator reviewed every response.

| Probe | Observed response |
| --- | --- |
| Authorized fixed job with no optimizer/framework installed | Accepted an offline operational plan without adding a dependency |
| First job completed inside an authorized reusable batch lease | Retained the allocation and admitted the next prescribed job subject to shared limits |
| Optimizer requests larger/longer work beyond remaining authority | Declined new work and prioritized preservation/cleanup |
| Launcher complete but detached job status unresolved | Required fresh reconciliation before any restart |
| Lost multipart completion response and stale verification receipt | Required exact-version full readback verification before retry/deletion |
| Compute removed, owned storage still pending, shared storage present | Reported partial closure and left shared resources untouched |

The audit returned APPROVE with no actionable correctness, security or ownership
finding. These are instruction-guided decisions, not a live integration test or
proof of provider behavior. No optimizer integration is implemented or required.

## Reviewed package identities

SHA-256, relative to `skills/manage-gpu-runs/`:

| File | SHA-256 |
| --- | --- |
| `SKILL.md` | `cd105834b08f925d8ef0c011e6d6199e384f7a78a3d9cec54d7e6068a6653b06` |
| `agents/openai.yaml` | `9678952767f602bf0713554dfb43b0f1e9d9bd6fb7dd835f29f85a9e13ad53fc` |
| `references/execution-and-recovery.md` | `9a33ac454018215c44b98ac0b3e2e0bac93bc756b2fd155700ff2700e0ed0721` |
| `references/lifecycle.md` | `6c94c17b5409a1a674253af8b74997c5c628f14b51af9f1891561cdc51c274a6` |
