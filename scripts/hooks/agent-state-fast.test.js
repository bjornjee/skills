#!/usr/bin/env node
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the module under test
const { resolveState, shouldRefreshBranch } = require('./agent-state-fast');

// Import shared packages
const pluginRoot = path.resolve(__dirname, '..', '..');
const { readAgentState, writeState } = require(path.join(pluginRoot, 'packages', 'agent-state'));
const { extractCwdFromCommand } = require(path.join(pluginRoot, 'packages', 'git-status'));

let tmpDir;
let agentsDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fast-hook-test-'));
  agentsDir = path.join(tmpDir, 'agents');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('extractCwdFromCommand', () => {
  it('extracts absolute path from cd /path && cmd', () => {
    assert.equal(extractCwdFromCommand('cd /Users/bjornjee/worktree && git status'), '/Users/bjornjee/worktree');
  });

  it('extracts double-quoted path with spaces', () => {
    assert.equal(extractCwdFromCommand('cd "/path/with spaces" && ls'), '/path/with spaces');
  });

  it('extracts single-quoted absolute path', () => {
    assert.equal(extractCwdFromCommand("cd '/abs/path' && pwd"), '/abs/path');
  });

  it('extracts path with semicolon separator', () => {
    assert.equal(extractCwdFromCommand('cd /some/dir ; echo hello'), '/some/dir');
  });

  it('extracts path with || separator', () => {
    assert.equal(extractCwdFromCommand('cd /some/dir || echo fail'), '/some/dir');
  });

  it('returns null for relative path', () => {
    assert.equal(extractCwdFromCommand('cd relative/path && cmd'), null);
  });

  it('returns null when no cd prefix', () => {
    assert.equal(extractCwdFromCommand('echo hello'), null);
  });

  it('returns null for null input', () => {
    assert.equal(extractCwdFromCommand(null), null);
  });

  it('returns null for empty string', () => {
    assert.equal(extractCwdFromCommand(''), null);
  });

  it('extracts path when cd is the only command', () => {
    assert.equal(extractCwdFromCommand('cd /some/dir'), '/some/dir');
  });
});

describe('resolveState', () => {
  it('returns "input" for PermissionRequest', () => {
    assert.equal(resolveState('PermissionRequest', 'Bash'), 'input');
  });

  it('returns "running" for PreToolUse with normal tools', () => {
    assert.equal(resolveState('PreToolUse', 'Bash'), 'running');
    assert.equal(resolveState('PreToolUse', 'Read'), 'running');
    assert.equal(resolveState('PreToolUse', 'Edit'), 'running');
  });

  it('returns "input" for PreToolUse with AskUserQuestion', () => {
    assert.equal(resolveState('PreToolUse', 'AskUserQuestion'), 'input');
  });

  it('returns "running" for PostToolUse', () => {
    assert.equal(resolveState('PostToolUse', 'Bash'), 'running');
  });

  it('returns "running" for unknown events', () => {
    assert.equal(resolveState('SomeOther', 'Bash'), 'running');
  });
});

describe('fast hook state updates (per-agent files)', () => {
  it('PermissionRequest sets state to input with current_tool', () => {
    writeState('main:1.0', {
      target: 'main:1.0',
      state: 'running',
      current_tool: '',
      permission_mode: 'default',
    }, agentsDir);

    // Simulate PermissionRequest update
    const existing = readAgentState('main:1.0', agentsDir);
    const update = {
      ...existing,
      state: 'input',
      current_tool: 'Edit',
      permission_mode: 'acceptEdits',
      last_hook_event: 'PermissionRequest',
    };
    writeState('main:1.0', update, agentsDir);

    const result = readAgentState('main:1.0', agentsDir);
    assert.equal(result.state, 'input');
    assert.equal(result.current_tool, 'Edit');
    assert.equal(result.permission_mode, 'acceptEdits');
    assert.equal(result.last_hook_event, 'PermissionRequest');
  });

  it('PostToolUse sets state to running and clears current_tool', () => {
    writeState('main:1.0', {
      target: 'main:1.0',
      state: 'input',
      current_tool: 'Edit',
      permission_mode: 'acceptEdits',
      last_hook_event: 'PermissionRequest',
    }, agentsDir);

    const existing = readAgentState('main:1.0', agentsDir);
    const update = {
      ...existing,
      state: 'running',
      current_tool: '',
      last_hook_event: 'PostToolUse',
    };
    writeState('main:1.0', update, agentsDir);

    const result = readAgentState('main:1.0', agentsDir);
    assert.equal(result.state, 'running');
    assert.equal(result.current_tool, '');
    assert.equal(result.last_hook_event, 'PostToolUse');
  });

  it('PreToolUse sets current_tool but keeps state running', () => {
    writeState('main:1.0', {
      target: 'main:1.0',
      state: 'running',
      current_tool: '',
    }, agentsDir);

    const existing = readAgentState('main:1.0', agentsDir);
    const update = {
      ...existing,
      state: 'running',
      current_tool: 'Bash',
      last_hook_event: 'PreToolUse',
    };
    writeState('main:1.0', update, agentsDir);

    const result = readAgentState('main:1.0', agentsDir);
    assert.equal(result.state, 'running');
    assert.equal(result.current_tool, 'Bash');
  });

  it('PostToolUse Bash updates branch in state', () => {
    writeState('main:1.0', {
      target: 'main:1.0',
      state: 'running',
      branch: 'main',
      current_tool: 'Bash',
    }, agentsDir);

    // shouldRefreshBranch returns true only for PostToolUse + Bash
    assert.equal(shouldRefreshBranch('PostToolUse', 'Bash'), true);
    assert.equal(shouldRefreshBranch('PostToolUse', 'Read'), false);
    assert.equal(shouldRefreshBranch('PreToolUse', 'Bash'), false);
    assert.equal(shouldRefreshBranch('PermissionRequest', 'Bash'), false);

    // Simulate fast hook writing branch update after Bash PostToolUse
    const existing = readAgentState('main:1.0', agentsDir);
    writeState('main:1.0', {
      ...existing,
      state: 'running',
      current_tool: '',
      branch: 'feat/new-feature',
      last_hook_event: 'PostToolUse',
    }, agentsDir);

    const result = readAgentState('main:1.0', agentsDir);
    assert.equal(result.branch, 'feat/new-feature');
    assert.equal(result.state, 'running');
  });

  it('preserves existing fields not updated by fast hook', () => {
    writeState('main:1.0', {
      target: 'main:1.0',
      state: 'running',
      branch: 'feat/something',
      model: 'claude-opus-4-6',
      session_id: 'abc123',
      files_changed: ['file1.go', 'file2.go'],
    }, agentsDir);

    // Fast hook only updates state, current_tool, permission_mode, last_hook_event
    const existing = readAgentState('main:1.0', agentsDir);
    const update = {
      ...existing,
      state: 'input',
      current_tool: 'Bash',
      permission_mode: 'default',
      last_hook_event: 'PermissionRequest',
    };
    writeState('main:1.0', update, agentsDir);

    const result = readAgentState('main:1.0', agentsDir);
    // Fast fields updated
    assert.equal(result.state, 'input');
    assert.equal(result.current_tool, 'Bash');
    // Existing fields preserved
    assert.equal(result.branch, 'feat/something');
    assert.equal(result.model, 'claude-opus-4-6');
    assert.equal(result.session_id, 'abc123');
    assert.deepEqual(result.files_changed, ['file1.go', 'file2.go']);
  });
});
