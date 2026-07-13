#!/usr/bin/env node
'use strict';

const { afterEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const SYNC = path.join(REPO, 'scripts', 'sync-codex-native.js');
const HOOK = path.join(REPO, 'native-codex', 'hooks', 'warn-destructive.js');
const HOOK_NAMES = ['block-main-commit', 'commit-lint', 'warn-destructive'];
const homes = [];

function tempHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-codex-native-'));
  homes.push(home);
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

describe('sync-codex-native', () => {
  it('installs native skills, rules, hook, and agents without removing unrelated files', () => {
    const home = tempHome();
    const unrelated = path.join(home, '.agents', 'skills', 'local-only');
    fs.mkdirSync(unrelated, { recursive: true });
    fs.writeFileSync(path.join(unrelated, 'SKILL.md'), '# local\n');

    const codexHome = path.join(home, '.codex');
    fs.mkdirSync(codexHome, { recursive: true });
    fs.writeFileSync(path.join(codexHome, 'hooks.json'), JSON.stringify({
      hooks: {
        Stop: [{ hooks: [{ type: 'command', command: 'echo preserved' }] }],
        PostToolUse: [{
          matcher: '^Bash$',
          hooks: [{
            type: 'command',
            command: 'node "$HOME/.codex/hooks/commit-lint.js"',
          }],
        }],
      },
    }));

    runSync(home);

    assert.ok(fs.existsSync(path.join(home, '.agents', 'skills', 'terminal-ops', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(unrelated, 'SKILL.md')));
    assert.equal(
      fs.readFileSync(path.join(codexHome, 'AGENTS.md'), 'utf8'),
      fs.readFileSync(path.join(REPO, '.codex', 'AGENTS.md'), 'utf8'),
    );
    for (const name of HOOK_NAMES) {
      assert.ok(fs.existsSync(path.join(codexHome, 'hooks', `${name}.js`)));
    }

    const hooks = JSON.parse(fs.readFileSync(path.join(codexHome, 'hooks.json'), 'utf8'));
    assert.equal(hooks.hooks.Stop[0].hooks[0].command, 'echo preserved');
    const preToolCommands = hooks.hooks.PreToolUse.flatMap(group => group.hooks)
      .map(hook => hook.command)
      .filter(command => HOOK_NAMES.some(name => command.includes(`${name}.js`)))
      .sort();
    assert.deepEqual(preToolCommands, HOOK_NAMES.map(
      name => `node "$HOME/.codex/hooks/${name}.js"`,
    ));
    const stalePostToolLint = (hooks.hooks.PostToolUse || []).flatMap(group => group.hooks)
      .find(hook => hook.command.includes('commit-lint.js'));
    assert.equal(stalePostToolLint, undefined);

    const reviewer = fs.readFileSync(
      path.join(codexHome, 'agents', 'python-reviewer-strict.toml'),
      'utf8',
    );
    assert.match(reviewer, /^name = "python-reviewer-strict"/m);
    assert.match(reviewer, /^description = /m);
    assert.match(reviewer, /^developer_instructions = /m);
    assert.match(reviewer, /^sandbox_mode = "read-only"/m);
    assert.doesNotMatch(reviewer, /model = "sonnet"/);
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
});

describe('warn-destructive hook', () => {
  function run(command) {
    return spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify({
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command },
      }),
      encoding: 'utf8',
    });
  }

  it('allows safe commands', () => {
    const result = run('git status');
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {});
  });

  it('blocks destructive commands', () => {
    const result = run('git reset --hard HEAD~1');
    assert.equal(result.status, 2);
    assert.match(result.stderr, /git reset --hard/);
  });
});
