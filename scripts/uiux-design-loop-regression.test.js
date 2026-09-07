'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const REPO = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(REPO, filename), 'utf8');

it('the grader output example provides all eight rubric dimensions as raw scores', () => {
  const rubric = read('skills/uiux-design-loop/rubric.md');
  const dimensions = [...rubric.matchAll(/## Dimension \d+ — `([^`]+)`/g)].map(match => match[1]);
  const grader = read('agents/uiux-grader.md');
  const example = JSON.parse(grader.match(/```json\n([\s\S]*?)```/)[1]);
  assert.deepEqual(Object.keys(example.scores).sort(), dimensions.sort());
  assert.ok(Object.values(example.scores).every(score => Number.isInteger(score) && score >= 1 && score <= 5));
});

it('the grader output keeps gates, evidence, independence, and tradeoffs separate from scores', () => {
  const example = JSON.parse(read('agents/uiux-grader.md').match(/```json\n([\s\S]*?)```/)[1]);
  assert.equal(typeof example.evidence_revision, 'string');
  assert.equal(typeof example.independent, 'boolean');
  assert.ok(['PASS', 'WARN', 'FAIL', 'N/A'].includes(example.preservation_gate.state));
  assert.ok(['PASS', 'WARN', 'FAIL'].includes(example.audit_gate.state));
  for (const key of ['critique_brief', 'brief_diff', 'accepted_tradeoffs', 'verification_gaps']) assert.ok(Array.isArray(example[key]), key);
});

it('the workflow bundle resolves its local Markdown references', () => {
  for (const filename of ['SKILL.md', 'README.md', 'impeccable-map.md', 'rubric.md']) {
    const directory = path.join(REPO, 'skills/uiux-design-loop');
    for (const match of fs.readFileSync(path.join(directory, filename), 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
      if (!match[1].includes('://')) assert.ok(fs.existsSync(path.resolve(directory, match[1])), match[1]);
    }
  }
});
