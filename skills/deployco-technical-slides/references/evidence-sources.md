# Proven evidence and source routing

Use this reference to avoid repeating the broad artifact search performed when this
skill was created. It distills evidence from a completed editable release-confidence
deck, its Google Slides and PPTX generation sources, its versioned technical diagrams,
a real PPTX render, and a final live Google Slides inspection.

Treat every source as authoritative only for the question it can prove. These proven
patterns do not replace the current approved DeployCo master or current-deck evidence.

## Route questions to the narrowest authority

| Question | Highest-confidence source | Trust it for | Do not infer |
| --- | --- | --- | --- |
| What are the current brand colors, fonts, backgrounds, margins, and layouts? | The current approved DeployCo Slide Template Master or a deck proven to contain it | Theme and layout decisions | Brand values from screenshots, remembered hex values, or an exported generic PPTX theme |
| What actually appears in the final Google Slides deck? | The live editable deck and slideshow view | Current layout mapping, text flow, crop, bounds, and presentation behavior | PPTX fidelity or object editability without inspection |
| What actually appears in the final PPTX? | A fresh PDF/PNG render of that PPTX | Visible output, page count, aspect ratio, clipping, and distortion | Master provenance or editability from pixels alone |
| Is narrative content editable? | The live editor object model or PPTX slide XML/object inspection | Whether titles, text, values, shapes, and connectors remain native | Editability from a screenshot or PDF |
| What story, text, and geometry were intended? | The deck-generation source plus the resulting editable deck | Exact copy, coordinates, title consistency, and slide order | Brand authority when the generator defines its own theme or blank layouts |
| Which diagram version actually shipped? | The slide’s selected asset/relationship and final render | The asset embedded in the deliverable | The newest filename in an asset directory or an older generator’s output name |
| How should diagrams be regenerated? | The diagram source plus the currently selected versioned asset | Logical structure, labels, aspect ratio, icon family, and version lineage | That source and shipped asset are synchronized until verified |
| Did Google Slides/PPTX round-tripping preserve fidelity? | The post-import live deck and post-export render | The observed round-trip result | Fidelity from a successful export command or source diff |

## Reuse these established conclusions

Do not re-derive the following unless the current template or deck contradicts them:

- Start with a conclusion-and-evidence story spine, then choose layouts.
- Use the completed reference deck’s narrative pattern: outcome, context, system loop,
  prevent, discover/reuse, candidate proof, routing, promotion/rollback, continuous
  assurance, and compounding team value.
- Keep ordinary content titles consistent. Treat cover and closing slides as explicit
  exceptions, not precedents for content-slide sizing.
- Use light native DeployCo layouts, editable narrative text, native simple shapes,
  and proportionally fitted raster diagrams only where they add technical value.
- Make architecture diagrams prove a state transition, authority boundary, failure
  path, exact candidate graph, rollback, or feedback loop.
- Centralize logical diagram names in one asset mapping. Version replacements
  non-destructively and verify that the selected asset matches the source.
- Treat the live Google Slides deck as stronger layout/master evidence than a
  separately regenerated PPTX. A PPTX created by a generic renderer may preserve
  the visual composition while carrying a generic Office theme or minimal master.
- Treat generation sources as implementation evidence, not reusable templates. The
  inspected reference sources contained fixed deck identifiers, absolute workstation
  paths, custom blank-slide construction, and presentation-specific copy.
- Render with an isolated LibreOffice user profile, then inspect PNGs. This avoids
  shared-profile initialization failures and makes the visual proof reproducible.
- Finish with a live Google Slides review because local PPTX rendering cannot prove
  theme mapping, editability, or slideshow behavior in Google Slides.

## Stop searching when evidence is sufficient

- Never search the web for DeployCo colors, templates, or brand rules. Request the
  approved master when it is missing.
- Do not scan unrelated decks, repositories, asset histories, or user folders for a
  “close enough” template or diagram.
- Inspect only the artifact needed for the current question. Do not open every source
  file when the live deck or selected asset already provides the answer.
- For visual QA, inspect the cover, closing, one representative content slide, the
  densest slide, every diagram-heavy slide, and slides changed by reset/import.
- Stop reverse-engineering OOXML once the concrete master, editability, relationship,
  or fidelity question is answered. Do not inventory every package part by default.
- When source and shipped output disagree, record the discrepancy. Trust the final
  selected asset/render for what shipped and the source for intended construction;
  reconcile before editing or regenerating.
- Prefer one authoritative observation over repeated confirmation from weaker
  surfaces. Escalate only when sources directly contradict each other.

## Record compact provenance

Capture each material decision in this form so later agents can reuse it:

```text
Question: <what needed proof>
Source: <master, live deck, editable PPTX, generator, selected asset, or render>
Scope: <deck/version/slide or asset>
Observation: <what the source proves>
Confidence: <high or bounded, with reason>
Limit: <what this source cannot prove>
```

Do not copy private URLs, deck identifiers, absolute paths, credentials, customer
names, or confidential code into reusable skill resources. Keep those pointers in the
task-local provenance record only.
