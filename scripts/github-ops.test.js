const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const REPO = path.resolve(__dirname, '..');
const skill = fs.readFileSync(path.join(REPO, 'skills', 'github-ops', 'SKILL.md'), 'utf8');
const codexDoctrine = fs.readFileSync(path.join(REPO, '.codex', 'AGENTS.md'), 'utf8');
const claudeDoctrine = fs.readFileSync(path.join(REPO, '.claude', 'rules', 'core.md'), 'utf8');

describe('github-ops publication boundary', () => {
  it('preserves the existing local gh workflow', () => {
    const localSkill = skill.replace(/## Codex Cloud PR publication\n[\s\S]*?\n(?=## Issue triage)/, '');
    const digest = crypto.createHash('sha256').update(localSkill).digest('hex');
    assert.equal(digest, '7db80c3c2696e0547a65536449bc1c516f11d5cee46be9ec4c5b83b7f92c691a');
  });

  it('routes only Cloud PR publication outside the worker', () => {
    const section = skill.match(/## Codex Cloud PR publication\n([\s\S]*?)\n## Issue triage/);
    assert.ok(section);
    assert.match(section[1], /configured\nCodex–GitHub capability outside the worker/);
    assert.match(section[1], /record its PR URL/);
    for (const forbidden of ['`gh`', 'direct GitHub credentials', 'repository\nsecrets', '`git push`', '`/opt/codex`']) {
      assert.ok(section[1].includes(forbidden), forbidden);
    }
    assert.match(section[1], /separate explicit authorization/);
  });

  it('keeps the Cloud boundary identical in both doctrine files', () => {
    const rule = '**Codex Cloud PR publication.** The worker prepares the verified diff and PR title/body, but must not use `gh`, direct GitHub credentials, repository secrets, `git push`, or `/opt/codex` publication helpers. Use the configured Codex–GitHub capability outside the worker and record the resulting PR URL. Merging remains separately authorized.';
    assert.ok(codexDoctrine.includes(rule));
    assert.ok(claudeDoctrine.includes(rule));
  });
});
