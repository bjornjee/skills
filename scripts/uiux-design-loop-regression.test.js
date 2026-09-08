'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const REPO = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(REPO, filename), 'utf8');

for (const filename of ['agents/uiux-grader.md', 'skills/uiux-design-loop/templates/critique-brief.md']) {
it(`${filename} provides all eight rubric dimensions and valid score exceptions`, () => {
  const rubric = read('skills/uiux-design-loop/rubric.md');
  const dimensions = [...rubric.matchAll(/## Dimension \d+ — `([^`]+)`/g)].map(match => match[1]);
  const example = JSON.parse(read(filename).match(/```json\n([\s\S]*?)```/)[1]);
  assert.deepEqual(Object.keys(example.scores).sort(), dimensions.sort());
  const nullDimensions = Object.keys(example.scores).filter(key => example.scores[key] === null);
  assert.deepEqual(Object.keys(example.score_exceptions).sort(), nullDimensions.sort());
  for (const [dimension, score] of Object.entries(example.scores)) {
    if (score !== null) {
      assert.ok(Number.isInteger(score) && score >= 1 && score <= 5, dimension);
      continue;
    }
    const exception = example.score_exceptions[dimension];
    assert.ok(['N/A', 'UNVERIFIED'].includes(exception.state), dimension);
    assert.equal(typeof exception.reason, 'string');
    assert.ok(exception.reason.trim(), dimension);
    if (exception.state === 'N/A') {
      assert.ok(['brand-voice-adherence', 'cross-locale-consistency'].includes(dimension), dimension);
    } else {
      assert.ok(example.verification_gaps.some(gap => gap.includes(dimension)), dimension);
      assert.ok(!['PASS', 'ACCEPTED_TRADEOFF'].includes(example.overall));
    }
  }
});

it(`${filename} keeps gates, evidence, independence, and tradeoffs separate from scores`, () => {
  const example = JSON.parse(read(filename).match(/```json\n([\s\S]*?)```/)[1]);
  const contract = JSON.parse(read('agents/uiux-grader.md').match(/```json\n([\s\S]*?)```/)[1]);
  assert.deepEqual(Object.keys(example).sort(), Object.keys(contract).sort());
  assert.equal(typeof example.evidence_revision, 'string');
  assert.equal(typeof example.independent, 'boolean');
  assert.ok(['PASS', 'ITERATE', 'REWORK', 'ACCEPTED_TRADEOFF'].includes(example.overall));
  assert.ok(['PASS', 'WARN', 'FAIL', 'N/A'].includes(example.preservation_gate.state));
  assert.ok(Array.isArray(example.preservation_gate.evidence));
  assert.ok(['PASS', 'WARN', 'FAIL'].includes(example.audit_gate.state));
  for (const key of ['blocking_findings', 'p2_findings', 'p3_findings']) assert.ok(Array.isArray(example.audit_gate[key]), key);
  assert.equal(example.audit_gate.state === 'FAIL', example.audit_gate.blocking_findings.length > 0);
  for (const key of ['critique_brief', 'brief_diff', 'accepted_tradeoffs', 'verification_gaps']) assert.ok(Array.isArray(example[key]), key);
  if (['PASS', 'ACCEPTED_TRADEOFF'].includes(example.overall)) {
    assert.equal(example.independent, true);
    assert.equal(example.audit_gate.state, 'PASS');
    assert.ok(['PASS', 'N/A'].includes(example.preservation_gate.state));
    assert.deepEqual(example.verification_gaps, []);
    if (example.overall === 'PASS') assert.ok(Object.values(example.scores).every(score => score === null || score >= 4));
  }
});
}

it('the workflow bundle resolves its local Markdown references', () => {
  for (const filename of ['SKILL.md', 'README.md', 'impeccable-map.md', 'rubric.md']) {
    const directory = path.join(REPO, 'skills/uiux-design-loop');
    for (const match of fs.readFileSync(path.join(directory, filename), 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
      if (!match[1].includes('://')) assert.ok(fs.existsSync(path.resolve(directory, match[1])), match[1]);
    }
  }
});
