#!/usr/bin/env node
'use strict';

const { afterEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const SYNC = path.join(REPO, 'scripts', 'sync-codex.js');
const HOOK_NAMES = ['block-main-commit', 'commit-lint', 'warn-destructive'];
const homes = [];

function hookSource(home) {
  return path.join(
    home,
    'Code',
    'bjornjee',
    'agent-dashboard',
    'adapters',
    'codex',
    'hooks',
  );
}

function tempHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-codex-'));
  homes.push(home);
  const hooks = hookSource(home);
  fs.mkdirSync(hooks, { recursive: true });
  for (const name of HOOK_NAMES) fs.writeFileSync(path.join(hooks, `${name}.js`), '');
  return home;
}

function runSync(home, ...args) {
  return execFileSync(process.execPath, [SYNC, ...args], {
    cwd: REPO,
    env: { ...process.env, HOME: home },
    encoding: 'utf8',
  });
}

afterEach(() => {
  for (const home of homes.splice(0)) {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

describe('sync-codex', () => {
  it('installs skills, rules, hook registrations, and agents', () => {
    const home = tempHome();
    runSync(home);

    assert.ok(fs.existsSync(path.join(home, '.agents', 'skills', 'terminal-ops', 'SKILL.md')));
    assert.equal(
      fs.readFileSync(path.join(home, '.codex', 'AGENTS.md'), 'utf8'),
      fs.readFileSync(path.join(REPO, '.codex', 'AGENTS.md'), 'utf8'),
    );
    assert.ok(fs.existsSync(path.join(home, '.codex', 'agents', 'python-reviewer-strict.toml')));
  });

  it('preserves unrelated global skills and hooks', () => {
    const home = tempHome();
    const unrelatedSkill = path.join(home, '.agents', 'skills', 'local-only', 'SKILL.md');
    fs.mkdirSync(path.dirname(unrelatedSkill), { recursive: true });
    fs.writeFileSync(unrelatedSkill, '# local\n');
    const hooksPath = path.join(home, '.codex', 'hooks.json');
    fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
    fs.writeFileSync(hooksPath, JSON.stringify({
      hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo preserved' }] }] },
    }));

    runSync(home);

    assert.ok(fs.existsSync(unrelatedSkill));
    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
    assert.equal(hooks.hooks.Stop[0].hooks[0].command, 'echo preserved');
  });

  it('registers the canonical agent-dashboard guardrails as PreToolUse hooks', () => {
    const home = tempHome();
    runSync(home);

    const hooks = JSON.parse(fs.readFileSync(path.join(home, '.codex', 'hooks.json'), 'utf8'));
    const commands = hooks.hooks.PreToolUse.flatMap(group => group.hooks)
      .map(hook => hook.command)
      .sort();
    assert.deepEqual(commands, HOOK_NAMES.map(
      name => `node "$HOME/Code/bjornjee/agent-dashboard/adapters/codex/hooks/${name}.js"`,
    ));
  });

  it('removes legacy copied guardrails', () => {
    const home = tempHome();
    const legacyRoot = path.join(home, '.codex', 'hooks');
    fs.mkdirSync(legacyRoot, { recursive: true });
    for (const name of HOOK_NAMES) fs.writeFileSync(path.join(legacyRoot, `${name}.js`), 'copy');

    runSync(home);

    for (const name of HOOK_NAMES) {
      assert.equal(fs.existsSync(path.join(legacyRoot, `${name}.js`)), false);
    }
  });

  it('is idempotent and supports drift checks', () => {
    const home = tempHome();
    runSync(home);
    runSync(home);
    assert.doesNotThrow(() => runSync(home, '--check'));

    fs.appendFileSync(path.join(home, '.codex', 'AGENTS.md'), '\ndrift\n');
    const result = spawnSync(process.execPath, [SYNC, '--check'], {
      cwd: REPO,
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /drift/);
  });

  it('fails when the canonical guardrail source is missing', () => {
    const home = tempHome();
    fs.unlinkSync(path.join(hookSource(home), 'commit-lint.js'));

    const result = spawnSync(process.execPath, [SYNC], {
      cwd: REPO,
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing agent-dashboard hook/);
  });
});
