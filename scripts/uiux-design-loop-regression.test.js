#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO, relativePath), 'utf8');
}

describe('uiux-design-loop regression gates', () => {
  it('requires a preservation contract before redesign edits', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');
    const template = read('skills/uiux-design-loop/templates/preservation-contract.md');

    assert.match(skill, /\.uiux-loop\/preservation-contract\.md/);
    assert.match(skill, /compatibility surface/i);
    assert.match(template, /JS primitives/);
    assert.match(template, /CSS classes/);
  });

  it('requires structural integrity checks after source edits', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');

    assert.match(skill, /balanced braces/i);
    assert.match(skill, /balanced \/\* \*\//i);
    assert.match(skill, /every var\(--\*\) resolves/i);
    assert.match(skill, /every imported symbol exists/i);
    assert.match(skill, /revert the change and try smaller/i);
  });

  it('gives the grader a live URL behavior channel', () => {
    const grader = read('agents/uiux-grader.md');

    assert.match(grader, /live URL/i);
    assert.match(grader, /console_messages/);
    assert.match(grader, /computedStyle/);
    assert.match(grader, /switch tabs/i);
  });

  it('requires behavior evidence for every preservation surface before exit', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');
    const template = read('skills/uiux-design-loop/templates/behavior-check.md');

    assert.match(skill, /\.uiux-loop\/behavior-check\.md/);
    assert.match(skill, /preservation gate is `PASS` or `N\/A`/);
    assert.match(template, /Preservation gate state/);
    assert.match(template, /Pass\/fail/);
    assert.match(template, /Evidence/);
  });

  it('enforces preservation as a binary gate, not a scored dimension', () => {
    const rubric = read('skills/uiux-design-loop/rubric.md');
    const grader = read('agents/uiux-grader.md');

    assert.match(rubric, /## Preservation gate/);
    assert.match(rubric, /PASS \| WARN \| FAIL \| N\/A/);
    assert.match(rubric, /preservation-contract\.md/);
    assert.doesNotMatch(rubric, /## Dimension 7/);
    assert.match(grader, /## Preservation gate/);
    assert.doesNotMatch(grader, /preservation-regression: +<n>/);
  });

  it('emits a structured JSON block alongside the prose verdict', () => {
    const grader = read('agents/uiux-grader.md');

    assert.match(grader, /```json/);
    assert.match(grader, /"preservation_gate"/);
    assert.match(grader, /"critique_brief"/);
    assert.match(grader, /"brief_diff"/);
    assert.match(grader, /"scores"/);
  });

  it('threads the prior verdict into the next grader dispatch', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');
    const grader = read('agents/uiux-grader.md');

    assert.match(skill, /verdict-iter-<n-1>\.md/);
    assert.match(grader, /prior-verdict/i);
    assert.match(grader, /Brief diff/);
  });

  it('lets register.md anchor visual-register-match with reference screenshots', () => {
    const template = read('skills/uiux-design-loop/templates/register.md');
    const grader = read('agents/uiux-grader.md');
    const skill = read('skills/uiux-design-loop/SKILL.md');

    assert.match(template, /Reference screenshots/);
    assert.match(grader, /register-anchor/i);
    assert.match(skill, /register-anchors\//);
  });

  it('runs a hot-reload detection in prerequisites', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');

    assert.match(skill, /Hot.?reload/i);
    assert.match(skill, /make dev|npm run dev|vite/i);
  });

  it('threads optional impeccable integration into Gate 0 and Gate 4 without weakening gates', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');
    const map = read('skills/uiux-design-loop/impeccable-map.md');
    const register = read('skills/uiux-design-loop/templates/register.md');
    const readme = read('skills/uiux-design-loop/README.md');

    assert.match(skill, /impeccable-map\.md/);
    assert.match(skill, /impeccable/i);
    assert.match(skill, /PRODUCT\.md/);

    assert.equal(
      (skill.match(/\*\*HARD-GATE\.\*\*/g) || []).length,
      4,
      'HARD-GATE count must remain 4 — the integration is additive, not subtractive'
    );

    assert.match(map, /Gate 0/);
    assert.match(map, /Gate 4/);
    assert.match(map, /PRODUCT\.md/);
    assert.match(map, /DESIGN\.md/);
    assert.match(map, /\/impeccable polish/);
    assert.match(map, /\/impeccable harden/);
    for (const dim of [
      'user-flow-fidelity',
      'visual-register-match',
      'content-density',
      'affordance-honesty',
      'brand-voice-adherence',
      'cross-locale-consistency',
    ]) {
      assert.match(map, new RegExp(dim), `impeccable-map.md must reference ${dim} verbatim`);
    }
    assert.match(map, /preservation-gate/, 'impeccable-map.md must reference preservation-gate');

    assert.match(register, /impeccable/i);
    assert.match(register, /PRODUCT\.md/);
    assert.match(readme, /impeccable-map\.md/);
  });

  it('keeps plugin.json and marketplace.json versions in lockstep', () => {
    const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
    const marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
    assert.equal(plugin.version, marketplace.plugins[0].version);
  });
});
