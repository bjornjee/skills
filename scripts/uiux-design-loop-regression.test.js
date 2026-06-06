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
    assert.match(skill, /every preservation surface passes/i);
    assert.match(template, /Pass\/fail/);
    assert.match(template, /Evidence/);
  });

  it('scores preserved surfaces as a first-class regression dimension', () => {
    const rubric = read('skills/uiux-design-loop/rubric.md');

    assert.match(rubric, /preservation-regression/);
    assert.match(rubric, /preservation-contract\.md/);
    assert.match(rubric, /no visible change vs\. before the redesign/i);
    assert.match(rubric, /weakest weighted score across BOTH in-scope and preservation surfaces/i);
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
      'preservation-regression',
    ]) {
      assert.match(map, new RegExp(dim), `impeccable-map.md must reference ${dim} verbatim`);
    }

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
