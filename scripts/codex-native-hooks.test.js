#!/usr/bin/env node
'use strict';

const { afterEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const BLOCK_MAIN = path.join(REPO, 'native-codex', 'hooks', 'block-main-commit.js');
const COMMIT_LINT = path.join(REPO, 'native-codex', 'hooks', 'commit-lint.js');
const repos = [];

function initRepo(branch) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-native-hook-'));
  repos.push(dir);
  spawnSync('git', ['init', '-q', '-b', branch], { cwd: dir });
  return dir;
}

function runHook(hook, command, cwd) {
  return spawnSync(process.execPath, [hook], {
    input: JSON.stringify({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command },
      cwd,
    }),
    encoding: 'utf8',
  });
}

afterEach(() => {
  for (const repo of repos.splice(0)) fs.rmSync(repo, { recursive: true, force: true });
});

describe('block-main-commit hook', () => {
  it('blocks git commit on main', () => {
    const result = runHook(BLOCK_MAIN, 'git commit -m "chore: test"', initRepo('main'));
    assert.equal(result.status, 2);
    assert.match(result.stderr, /commit on main\/master/);
  });

  it('allows git commit on a feature branch', () => {
    const result = runHook(
      BLOCK_MAIN,
      'git commit -m "chore: test"',
      initRepo('chore/test'),
    );
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '{}\n');
  });

  it('uses an absolute cd prefix as the effective repository', () => {
    const repo = initRepo('main');
    const result = runHook(
      BLOCK_MAIN,
      `cd "${repo}" && git commit -m "chore: test"`,
      initRepo('chore/test'),
    );
    assert.equal(result.status, 2);
  });
});

describe('commit-lint hook', () => {
  it('blocks a non-conventional commit message before execution', () => {
    const result = runHook(COMMIT_LINT, 'git commit -m "bad message"');
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Expected: <type>: <description>/);
  });

  it('blocks a non-conventional message passed with combined short flags', () => {
    const result = runHook(COMMIT_LINT, 'git commit -am "bad message"');
    assert.equal(result.status, 2);
  });

  it('blocks a non-conventional message passed with --message', () => {
    const result = runHook(COMMIT_LINT, 'git commit --message="bad message"');
    assert.equal(result.status, 2);
  });

  it('blocks an unquoted non-conventional message', () => {
    const result = runHook(COMMIT_LINT, 'git commit -m bad-message');
    assert.equal(result.status, 2);
  });

  it('allows every configured conventional commit type', () => {
    for (const type of ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'ci']) {
      const result = runHook(COMMIT_LINT, `git commit -m "${type}: valid message"`);
      assert.equal(result.status, 0, `${type}: ${result.stderr}`);
    }
  });

  it('allows commit commands without an inline message', () => {
    const result = runHook(COMMIT_LINT, 'git commit --amend');
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '{}\n');
  });
});
