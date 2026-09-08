---
name: regex-vs-llm-structured-text
description: Decision framework for choosing between regex and LLM when parsing structured text — start with regex, add LLM only for low-confidence edge cases.
---

# Regex vs LLM for Structured Text Parsing

A practical decision framework for parsing structured text (quizzes, forms, invoices, documents). Regex can handle a defined format cheaply and deterministically; measure its coverage and accuracy on representative inputs. Consider LLM calls only for unresolved cases that need them.

## When to Activate

- Parsing structured text with repeating patterns (questions, forms, tables)
- Deciding between regex and LLM for text extraction
- Building hybrid pipelines that combine both approaches
- Optimizing cost/accuracy tradeoffs in text processing

## Decision Framework

```
Is the text format consistent and repeating?
├── Yes → Start with Regex or an existing format parser
│   ├── Meets task acceptance criteria, all records accounted for → Done
│   └── Unresolved cases → Correct/reject explicitly or evaluate bounded LLM repair
└── No → Evaluate an existing parser or LLM against the task acceptance criteria
```

## Architecture Pattern

```
Source Text
    │
    ▼
[Regex Parser] ─── Extracts structure (measured accuracy)
    │
    ▼
[Text Cleaner] ─── Removes noise (markers, page numbers, artifacts)
    │
    ▼
[Confidence Scorer] ─── Flags low-confidence extractions
    │
    ├── Meets calibrated acceptance threshold and source checks → Accept
    │
    └── Otherwise → Correct/reject or bounded LLM repair → Validate before acceptance
```

## Implementation

### A bounded parser with explicit failure

This example accepts numbered, single-line questions with three or four consecutively labeled choices and an answer. It deliberately rejects other formats instead of silently losing records. Work is linear in the selected document length; bound document size at ingestion. Treat this as a format-specific example, not a general document parser.

```python
import re
from dataclasses import dataclass

@dataclass(frozen=True)
class ParsedItem:
    id: str
    text: str
    choices: tuple[str, ...]
    answer: str

def parse_structured_text(content: str) -> list[ParsedItem]:
    records = re.split(r"(?m)(?=^\d+\. )", content.strip())
    items: list[ParsedItem] = []
    seen: set[str] = set()
    for record in records:
        if not record.strip():
            continue
        lines = record.strip().splitlines()
        heading = re.fullmatch(r"(\d+)\. (.+)", lines[0])
        answer = re.fullmatch(r"Answer: ([A-D])", lines[-1])
        choices = [re.fullmatch(r"([A-D])\. (.+)", line) for line in lines[1:-1]]
        if (heading is None or answer is None or len(choices) not in (3, 4)
                or any(choice is None for choice in choices)):
            raise ValueError("Malformed record; preserve source for review")
        labels = "".join(choice[1] for choice in choices if choice is not None)
        if labels != "ABCD"[:len(choices)] or answer[1] not in labels or heading[1] in seen:
            raise ValueError("Invalid choice labels, answer, or duplicate record ID")
        seen.add(heading[1])
        items.append(ParsedItem(heading[1], heading[2], tuple(
            choice[2] for choice in choices if choice is not None
        ), answer[1]))
    return items
```

### Escalation and completeness

On failure, retain the original record and failure reason. Either reject the import for correction or send only the failed record and its local context to an available LLM. Validate the returned structure, ID, choice labels, and answer against the source before accepting it; cap repair attempts and expose unresolved records. Do not resend the whole document once per failed item.

A parser match is not a calibrated confidence score. Measure record recall and field accuracy on a labeled corpus, including unmatched text, duplicate IDs, missing answers, and neighboring malformed records. Never claim a universal accuracy percentage from regex use alone. For formats with multiline content or embedded numbered lists, use an established parser or an explicit record-boundary contract before extraction.
