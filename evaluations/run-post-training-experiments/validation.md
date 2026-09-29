# Run Post-Training Experiments: validation

Maintainer record for the decision-quality and data-fitness revision, 2026-09-29.

## Scope

The skill uses an action-oriented, lowercase hyphenated name that identifies its
post-training experiment scope. The entrypoint, UI metadata, invocation prompt and
README use the same name. Five linked references contain reusable decision design,
data quality, evaluation, recovery and resource-lifecycle doctrine. No project case studies, historical
recipes, resource identifiers or project-specific examples are packaged.

Review checked consequential decision framing, competing explanations, data
fitness and independent supervision, identifiable effects/interactions, practical
effect thresholds and stopping value. Existing evaluation isolation, recovery,
finite authority/budget, verified cleanup and separate promotion authority remain.

## Independent offline forward test

A fresh subagent without parent history read the current skill/references and
relevant authoring/AI-ML guidance. It received six synthetic requests and raw facts,
with no expected answers or prior evaluation results. Its sole output was an
isolated temporary report; no network, data access, training or resource operations
were permitted. The coordinator reviewed all responses.

| Decision probe | Observed response |
| --- | --- |
| Large synthetic expansion with shared source lineage and uncalibrated generator/judge | Rejected production inference; identified dependent evidence and missing supervision validity; limited any diagnostic claim |
| Two potentially interacting interventions within a finite run budget | Proposed a four-cell factorial comparison; distinguished interaction estimation from training-seed uncertainty |
| Selected gain below the practical threshold after repeated checkpoint inspection | Retained incumbent, treated intervals as exploratory and protected confirmation resources |
| Competing audit, irrelevant training, infeasible high-information experiment and stopping | Selected the bounded decision-relevant audit without inventing probabilities; required versioned corrections and comparable rescoring |
| Authorized trial with sufficient data fitness and identity-bound proof | Permitted the offline execution plan without unnecessary repeat audits; preserved lifecycle and authority conditions |
| Data-content claim with changed weighting and doubled optimizer steps | Limited the claim to the combined policy; required a matched comparison only if causal attribution was worth resolving |

No actionable doctrine defect was observed. These probes test instruction-guided
judgment; they do not prove live execution, universal effectiveness or global
optimality. There was no unskilled baseline comparison.

## Verification

- Skill-creator `quick_validate.py skills/run-post-training-experiments`: passed.
- Repository frontmatter, README, isolated marketplace package and version checks:
  40 tests passed using `node --test scripts/skill-frontmatter.test.js
  scripts/readme-tables.test.js scripts/codex-marketplace.test.js
  scripts/version-bump.test.js`.
- Whitespace check and search for superseded names/project-specific remnants:
  passed.
- PR preparation on the default-branch base: `make test` passed all 128 tests;
  skill-creator validation and `node scripts/check-version-bump.js origin/main`
  passed, confirming the 2.3.0 to 2.4.0 release increment.

This Surgical documentation/configuration revision was statically validated,
reviewed and forward-tested as described above, then passed the full repository
gate during PR preparation. No executable helpers or implementation-only tests
were added. Validation performed no live training, resource operations,
installation or publication.

## Tested skill identities

SHA-256, relative to `skills/run-post-training-experiments/`:

| File | SHA-256 |
| --- | --- |
| `SKILL.md` | `ba1ba508a5e3a8b0906490196c64cfb5bc521b5c3253fbaa396f74825a2fda98` |
| `references/decision-design.md` | `e017a166a6d048c5ae57289db5294d6d19fcbd29986a07e4421c5121703539e3` |
| `references/data-quality.md` | `957232295d5080e54a072489efe05ec84f7cd47612574dd11ca67269b93d0d85` |
| `references/evaluation.md` | `e93266a23077453872b2805574fb9f427fbf6929964a885745c2030b6e7befb5` |
| `references/execution-and-recovery.md` | `a838544aee3753ba580568f8815e79e5bdbbdc79e2339d2256477f866565cc57` |
| `references/gpu-lifecycle.md` | `21d6daa0a46aae876cb5336a69c951879204de6bc8491a18ba872dfc791cb1f8` |
| `agents/openai.yaml` | `73faa65949403305ed14a38fea8d9cb37f0d9e724350c348c06179226cb0511e` |
