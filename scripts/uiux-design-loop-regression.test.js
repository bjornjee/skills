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
    // Dimensions 7 (accessibility) and 8 (technical-quality) are legitimate scored
    // dimensions. Preservation must never become a scored dimension — guard against
    // a future Dimension 9 named "preservation" or similar.
    assert.doesNotMatch(rubric, /## Dimension 9/);
    assert.doesNotMatch(rubric, /## Dimension \d+ — `preservation`/);
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

  it('makes impeccable mandatory in Gate 0 and Gate 4 and adds a Gate 0 precondition HARD-GATE', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');
    const map = read('skills/uiux-design-loop/impeccable-map.md');
    const register = read('skills/uiux-design-loop/templates/register.md');
    const readme = read('skills/uiux-design-loop/README.md');

    assert.match(skill, /impeccable-map\.md/);
    assert.match(skill, /impeccable/i);
    assert.match(skill, /PRODUCT\.md/);

    // HARD-GATE count grows by one: a new Gate 0 precondition HARD-GATE refuses to run
    // without impeccable installed, on top of the existing six (Gates 0, 1, 1.5, 2, 3.5, 4).
    assert.equal(
      (skill.match(/\*\*HARD-GATE\.\*\*/g) || []).length,
      7,
      'HARD-GATE count must be 7 — the six gate HARD-GATEs plus a new Gate 0 precondition HARD-GATE that halts when impeccable is not installed.'
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

  it('refuses to start the loop when impeccable is not installed', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');
    const map = read('skills/uiux-design-loop/impeccable-map.md');

    // The Gate 0 precondition must reference the install check and a halt message.
    assert.match(skill, /impeccable is required/i);
    assert.match(skill, /test -f .*impeccable\/SKILL\.md/);
    assert.match(skill, /halt/i);

    // No "standalone" or "degraded" mode left anywhere.
    assert.doesNotMatch(skill, /runs standalone/i);
    assert.doesNotMatch(skill, /standalone flow/i);
    assert.doesNotMatch(map, /runs standalone/i);
    assert.doesNotMatch(map, /optional seam/i);
  });

  it('drops every "when impeccable is installed" conditional from the orchestration files', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');
    const map = read('skills/uiux-design-loop/impeccable-map.md');
    const readme = read('skills/uiux-design-loop/README.md');
    const rubric = read('skills/uiux-design-loop/rubric.md');
    const register = read('skills/uiux-design-loop/templates/register.md');

    for (const file of [skill, map, readme, rubric, register]) {
      assert.doesNotMatch(file, /when impeccable is installed/i);
      assert.doesNotMatch(file, /if impeccable is installed/i);
      assert.doesNotMatch(file, /when impeccable is not installed/i);
      assert.doesNotMatch(file, /if impeccable is not installed/i);
      assert.doesNotMatch(file, /impeccable is absent/i);
    }
  });

  it('keeps plugin.json and marketplace.json versions in lockstep', () => {
    const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
    const marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
    assert.equal(plugin.version, marketplace.plugins[0].version);
  });

  it('wires impeccable context.mjs into Gate 0 pre-flight', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');
    const register = read('skills/uiux-design-loop/templates/register.md');

    assert.match(skill, /context\.mjs/);
    assert.match(skill, /NO_PRODUCT_MD/);
    assert.match(skill, /auto-populate/i);
    assert.match(skill, /\/impeccable init/);
    assert.match(register, /Auto-populated from PRODUCT\.md/i);
  });

  it('runs impeccable audit at Gate 1.5 and Gate 3.5 and gates Overall on P1s', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');
    const rubric = read('skills/uiux-design-loop/rubric.md');
    const map = read('skills/uiux-design-loop/impeccable-map.md');

    assert.match(skill, /### Gate 1\.5/);
    assert.match(skill, /### Gate 3\.5/);
    assert.match(skill, /impeccable audit/);
    assert.match(skill, /P0 or P1|P0\/P1/);
    assert.match(skill, /audit-baseline\.md/);
    assert.match(skill, /audit-iter-<n>\.md/);

    assert.match(rubric, /## Audit gate/);
    // Audit gate states match the canonical four; the same line shows up for the
    // preservation gate too, so we anchor to the Audit gate section.
    const auditBlock = rubric.split('## Audit gate')[1] || '';
    assert.match(auditBlock, /PASS \| WARN \| FAIL \| N\/A/);
    assert.match(auditBlock, /P0|P1/);

    assert.match(map, /Gate 1\.5/);
    assert.match(map, /Gate 3\.5/);
    assert.match(map, /impeccable audit/);
  });

  it('adds accessibility and technical-quality as dimensions 7 and 8', () => {
    const rubric = read('skills/uiux-design-loop/rubric.md');
    const grader = read('agents/uiux-grader.md');

    assert.match(rubric, /## Dimension 7 — `accessibility`/);
    assert.match(rubric, /## Dimension 8 — `technical-quality`/);

    assert.match(grader, /accessibility/);
    assert.match(grader, /technical-quality/);
    assert.match(grader, /"dimension": "accessibility"/);
    assert.match(grader, /"dimension": "technical-quality"/);

    // Per-dimension scores block lists both new names.
    assert.match(grader, /- accessibility:/);
    assert.match(grader, /- technical-quality:/);
  });

  it('forces an impeccable exit-pass at Gate 4 — no Skip option, no standalone branch', () => {
    const skill = read('skills/uiux-design-loop/SKILL.md');

    // The AskUserQuestion mention must land inside Gate 4 specifically, not
    // somewhere else in the file. Split on the Gate 4 heading and check the tail.
    const gate4 = skill.split(/### Gate 4/)[1] || '';
    assert.match(gate4, /AskUserQuestion/);
    assert.match(gate4, /\/impeccable/);
    assert.match(gate4, /default|recommended/i);

    // Skip — ship as-is is gone; impeccable is mandatory so the user cannot bypass
    // the exit-pass via the gate. The only escape is aborting the loop entirely.
    assert.doesNotMatch(gate4, /Skip — ship as-is/);
    assert.doesNotMatch(gate4, /Skip[^\n]*ship as-is/);
    // The "When impeccable is not installed" branch is gone — Gate 0 precondition guarantees it.
    assert.doesNotMatch(gate4, /impeccable is not installed/i);
  });

  it('removes N/A-via-missing-impeccable fallbacks from rubric and grader', () => {
    const rubric = read('skills/uiux-design-loop/rubric.md');
    const grader = read('agents/uiux-grader.md');
    const map = read('skills/uiux-design-loop/impeccable-map.md');

    // The phrase "impeccable not installed" must no longer appear as an evidence string
    // or scoring fallback. Dimensions 7+8 always score from audit-findings.md.
    assert.doesNotMatch(rubric, /impeccable not installed/i);
    assert.doesNotMatch(grader, /impeccable not installed/i);
    assert.doesNotMatch(map, /impeccable not installed/i);

    // The grader description must call audit-findings.md required, not optional.
    assert.doesNotMatch(grader, /optional impeccable audit-findings/i);

    // The rubric must no longer document N/A as the consequence of impeccable absence.
    assert.doesNotMatch(rubric, /typically score `?N\/A`? when impeccable is not installed/i);
    assert.doesNotMatch(rubric, /`N\/A` without impeccable/i);
  });

  it('maps impeccable brand|product register to uiux-loop named registers', () => {
    const map = read('skills/uiux-design-loop/impeccable-map.md');

    assert.match(map, /Register taxonomy/i);
    // Two-column table covering both impeccable registers and at least three
    // loop registers per family.
    assert.match(map, /\| `product` \|/);
    assert.match(map, /\| `brand` \|/);
    assert.match(map, /refined-minimal/);
    assert.match(map, /editorial/);
    assert.match(map, /dramatic/);
  });

  it('extends the grader audit-gate contract', () => {
    const grader = read('agents/uiux-grader.md');

    assert.match(grader, /## Audit gate/);
    assert.match(grader, /audit-findings\.md/);
    assert.match(grader, /"audit_gate"/);
    assert.match(grader, /audit_gate.*state|state.*audit_gate/s);
  });
});
