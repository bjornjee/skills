# Impeccable integration contract

Resolve Impeccable through the current runtime's skill catalog. Read its actual entrypoint and command reference; do not execute a guessed CLI or hardcode `~/.claude/skills`. If its capabilities or schema differ, adapt explicitly before work rather than pretending a file-existence check proves compatibility.

## Gate 0 — Context and surface strategy

Use `PRODUCT.md` for durable users, jobs, voice, constraints, and confirmed brand commitments. Use `DESIGN.md` for established tokens and components. With current Impeccable, select Persuade, Operate, Read, or Experience from the requested surface and keep that strategy in the surface brief/register, not PRODUCT.md.

There is no product-level `brand` versus `product` whitelist. A tool's landing page can be editorial; its settings page can be operational. Preserve user-specified visual direction and evidence anchors. If useful context is missing, infer it from the request/repository or use `/impeccable init` when genuinely needed; do not force initialization as an approval gate.

## Gate 1.5 / Gate 3.5 — Audit contract

Invoke Impeccable's documented audit workflow on explicit files. At baseline use files rendering declared surfaces; afterward use the full change since baseline, including committed and untracked work. Audit completes **before** the corresponding grader pass.

The parent writes `audit-findings.md` (using iteration-specific filenames on disk) with:

- Source revision/content fingerprint and capture time.
- Exact audited files and excluded or unverified surfaces.
- Stable finding ID, P0–P2 severity, file/line, observed behavior, impact, and concrete repair.
- An explicit empty findings list when a completed audit found nothing; missing audit output is never an empty audit.

Map the installed audit's severity vocabulary to this contract explicitly. Do not lower severity to pass. P0/P1 findings block completion; P2 findings may remain disclosed. Stale/incomplete audit evidence is WARN, not PASS.

## Ownership and verification budget

The parent owns screenshots, browser actions, computed-style checks, keyboard traversal, and console evidence. The grader reads that evidence; supplying a live URL does not grant it a browser tool. Use the default initial-plus-confirmation verification budget for the whole cycle. Do not nest a six-pass design loop around Impeccable's two-round ceiling.

Dimension priorities choose what to repair: user-flow-fidelity, visual-register-match, content-density, affordance-honesty, brand-voice-adherence, and cross-locale-consistency remain raw quality scores. Accessibility and technical-quality additionally use audit and behavior evidence. The preservation-gate protects the explicit compatibility contract.

## Gate 4 — Completion

Grade only after final evidence exists for the same source revision. Reuse that grade as final if nothing relevant changed. PASS ends the workflow without a mandatory question or extra pass.

Optional suggestions such as `/impeccable polish` or `/impeccable harden` must have a concrete remaining purpose. They are not required exit steps. A declined suggestion does not revoke an existing PASS. Required P0/P1 repairs stay required; do not reframe them as optional polish.
