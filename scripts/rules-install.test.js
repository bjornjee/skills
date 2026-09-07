'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const REPO = path.resolve(__dirname, '..');
it('Claude rules check is read-only when rules are absent', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-check-'));
  try {
    const result = spawnSync('bash', [path.join(REPO, 'scripts/install-rules-symlinks.sh'), '--check'], {
      env: { ...process.env, HOME: home }, encoding: 'utf8',
    });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(fs.existsSync(path.join(home, '.claude')), false);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
it('Claude rules install and recheck succeed from a permanent source checkout', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-source-'));
  const source = path.join(fixture, 'source');
  const home = path.join(fixture, 'home');
  try {
    fs.mkdirSync(path.join(source, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(source, '.claude/rules'), { recursive: true });
    fs.copyFileSync(path.join(REPO, 'scripts/install-rules-symlinks.sh'), path.join(source, 'scripts/install-rules-symlinks.sh'));
    fs.writeFileSync(path.join(source, '.claude/rules/core.md'), '# source');
    const init = spawnSync('git', ['init', source], { encoding: 'utf8' });
    assert.equal(init.status, 0, init.stderr);
    for (const args of [[], ['--check']]) {
      const result = spawnSync('bash', [path.join(source, 'scripts/install-rules-symlinks.sh'), ...args], {
        env: { ...process.env, HOME: home }, encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
    }
    assert.equal(fs.readlinkSync(path.join(home, '.claude/rules/core.md')), path.join(source, '.claude/rules/core.md'));
  } finally { fs.rmSync(fixture, { recursive: true, force: true }); }
});
