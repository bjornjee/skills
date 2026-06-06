# Visual register — <feature or page name>

> Fill this in **before** Gate 1 of `/skills:uiux-design-loop`. Without a declared register, the grader will REJECT — by design. Polish is not a register; it is what you do once a register has been chosen.

> **Auto-populated from PRODUCT.md** when impeccable is installed and `PRODUCT.md` exists. At Gate 0 pre-flight, the loop runs `node "$HOME/.claude/skills/impeccable/scripts/context.mjs"` and fills `Chosen register`, `Why this register`, and `Reference mockups / sources` from PRODUCT.md's `register:` field, theme scene sentence, and named anchors, mapped through the register-taxonomy table in `skills/uiux-design-loop/impeccable-map.md`. Confirm or override the auto-fill before proceeding; the artifact still has to exist on disk — sourcing does not skip Gate 0.

## Auto-populated from PRODUCT.md (Gate 0 pre-flight, when applicable)

The orchestrator fills the block below from `context.mjs` output. If you are filling this template by hand (impeccable not installed, or PRODUCT.md missing), delete this section and complete the manual blocks below.

- Source: `PRODUCT.md` `register:` → `<impeccable family: brand | product>`
- Mapped via impeccable-map.md taxonomy → `<loop register member>`
- Theme scene sentence (verbatim from PRODUCT.md): `<paste>`
- Named anchors (from PRODUCT.md / DESIGN.md): `<list>`
- User confirmed at Gate 0: `<yes | overridden to: …>`

## Chosen register

Pick one. If your project's register is not in the list, name your own — but commit.

- `editorial` — magazine-grade: distinctive typography hierarchy, generous measure, image-led blocks, strong eyebrow / headline / lede pattern.
- `dramatic` — high contrast, bold scale shifts, hero takes commanding space, restrained colour palette with one strong accent.
- `spacious` — generous whitespace by intent, low-density compositions that breathe; not "we ran out of content."
- `refined-minimal` — small set of typographic moves, precise spacing scale, every element has a reason; one decorative gesture max per viewport.
- `brutalist` — raw type, deliberately unrefined grids, exposed structure, no apologies.
- `organic` — soft curves, natural references, looser grid, photography-led.
- `retro` — period-specific (90s web, 70s editorial, etc.); commit to era.
- `luxury` — restraint + materials cues + serif type + spacing; quietly expensive.
- `playful` — micro-interactions and personality everywhere; characterful type, friendly motion.
- `industrial` — utilitarian, monospace, dense tables and small type, function-forward.
- `<custom>` — name it; describe what it commits to.

**Chosen:** `<paste one here>`

## Why this register

One or two sentences. What about the visitor, the goal, or the project makes this the right register?

> Example: "Visitors arrive feeling overwhelmed; the page should feel like an exhalation, not a sales push. Refined-minimal serves the practitioner's voice better than dramatic, which would feel like marketing."

## Reference mockups / sources

Paste links, file paths, or short descriptions of 1–3 references the chosen register draws from. The grader does not browse the references but the implementer needs them.

> Example:
> - `references/healing-page-mockup-v3.png`
> - A Working Library (typography rhythm, ledes-with-pull-quotes)
> - Aesop product pages (refined-minimal applied to body type)
> - `DESIGN.md` color tokens + named anchors (if the project uses `impeccable`)

## Reference screenshots (optional but recommended)

Drop concrete screenshots of designs whose register you want this one to anchor against. Place files under `.uiux-loop/register-anchors/` and list them here. The grader will include these in its dispatch bundle and anchor `visual-register-match` against them — without anchors it falls back to its training-data prior, which generalises poorly for committed registers and tends to misread intentional negative space as "icons floating mid-row."

> Example:
> - `.uiux-loop/register-anchors/codex-mobile-chat-header.png` — flush-right icon group, 20px edge padding, intentional negative space.
> - `.uiux-loop/register-anchors/arc-browser-sidebar.png` — same register class on a different surface.

## Out-of-bounds

What does this register specifically reject? The grader uses this to catch drift toward generic defaults.

> Example:
> - No purple-on-white SaaS gradients.
> - No "card with arrow only" cross-link patterns — they read anaemic in this register.
> - No generic body sans-serifs (Inter, Roboto). Body uses the chosen serif.
> - No micro-animations on hover beyond colour transitions.

## How this register interacts with the rubric

Optional. If your register is unusual (e.g. `spacious`), note how the grader should recalibrate:

- `content-density` — what reads as "too sparse" in `editorial` is correct in `spacious`. Score 3 → 5 if the sparseness is composed.
- `affordance-honesty` — what reads as "subtle" in `refined-minimal` would be "buried" in `dramatic`. Calibrate to the register.

> Example: "Register is `refined-minimal`. Treat compositions with one element per viewport as a 5 if the typographic rhythm carries; do not penalise as low content-density."
