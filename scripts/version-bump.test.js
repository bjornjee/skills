'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const CHECK = path.join(__dirname, 'check-version-bump.js');
function scenario(nextVersion) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'version-bump-'));
  try {
    const git = args => execFileSync('git', ['-C', dir, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', ...args], { stdio: 'pipe', env: { ...process.env, HOME: dir } });
    git(['init']);
    fs.mkdirSync(path.join(dir, '.claude-plugin'));
    fs.mkdirSync(path.join(dir, 'skills/example'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-plugin/plugin.json'), JSON.stringify({ version: '1.3.1' }));
    fs.writeFileSync(path.join(dir, 'skills/example/SKILL.md'), 'before');
    git(['add', '.']);
    git(['commit', '-m', 'test: initial fixture']);
    const base = git(['rev-parse', 'HEAD']).toString().trim();
    fs.writeFileSync(path.join(dir, 'skills/example/SKILL.md'), 'after');
    fs.writeFileSync(path.join(dir, '.claude-plugin/plugin.json'), JSON.stringify({ version: nextVersion }));
    return spawnSync(process.execPath, [CHECK, base], { cwd: dir, encoding: 'utf8' });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
it('requires a newer version when a skill changes against the base revision', () => {
  const result = scenario('1.3.1');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /version must increase/);
});
it('accepts a newer version for a changed skill', () => {
  const result = scenario('2.0.0');
  assert.equal(result.status, 0, result.stderr);
});
