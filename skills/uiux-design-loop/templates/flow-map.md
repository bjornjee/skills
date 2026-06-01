# User flow — <feature or page name>

> Fill this in **before** Gate 1 of `/skills:uiux-design-loop`. The grader will read this verbatim and score the renders against the goals you declare here.

## Visitor profile

Who is the visitor at this flow? One sentence.

> Example: "Returning practitioner who has done Reiki 1 and is deciding whether to book Reiki 2 with this practitioner."

## Primary visitor goal at this flow

One sentence. What does the visitor want to *accomplish* by working through this flow?

> Example: "Decide whether to book a Reiki 2 attunement session, and if yes, take a next step (contact / book / signup)."

## Flow steps

Numbered. One screenshot per step × per viewport (desktop + mobile by default). For each step, declare the visitor's sub-goal and the affordance that step is meant to provide.

1. **Step name** · URL or page-state · visitor sub-goal · expected affordance
2. **…**
3. **…**

> Example:
> 1. **Land on /cn/healing** · `/cn/healing` · sub-goal: understand what a healing session is and whether it fits · expected affordance: scroll cue to session-details section, primary CTA to "contact us / book"
> 2. **Read session details** · scrolled to mid-page · sub-goal: confirm session length, format, price, who runs it · expected affordance: clear price + contact path
> 3. **Decide and act** · footer / contact section · sub-goal: send a contact message or copy contact info · expected affordance: working contact form or copyable info

## Decision points

Where does the visitor branch? What signals each branch?

> Example:
> - At step 2: visitor decides "Reiki 1 first" vs "Reiki 2 with this practitioner" vs "healing session only" — page needs to make all three paths visible.
> - At step 3: visitor decides "book now" vs "save for later" — both should be supported (CTA + sharable URL).

## Failure / exit states

What counts as the visitor giving up? Be specific — the grader uses this to score `user-flow-fidelity`.

> Example:
> - Lands, scrolls once, sees no next-step affordance, closes tab.
> - Reads to mid-page, no price visible, assumes too expensive or too vague, closes tab.
> - Reaches contact section, contact form fails to submit, leaves and doesn't return.

## Invariants across viewports

What must stay true on every viewport? Note where intentional divergence is allowed.

> Example:
> - Primary CTA visible above the fold on desktop AND mobile.
> - Headline word-order identical across viewports (CN-specific: vertical typography pattern allowed on mobile).

## Locales covered by this flow

If multi-locale, list which locales this flow-map applies to and where divergences live.

> Example: "EN + CN. Divergence: CN replaces the partner-attribution block with a centre-name block (per `project-rules.md`)."
