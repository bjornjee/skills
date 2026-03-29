#!/usr/bin/env node
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the module under test (will be created next)
const { resolveState } = require('./agent-state-fast');

// Import shared package for state I/O
const pluginRoot = path.resolve(__dirname, '..', '..');
const { readState, writeState } = require(path.join(pluginRoot, 'packages', 'agent-state'));

let tmpDir;
let stateFile;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fast-hook-test-'));
  stateFile = path.join(tmpDir, 'state.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
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

describe('fast hook state updates', () => {
  it('PermissionRequest sets state to input with current_tool', () => {
    // Seed existing agent
    writeState('main:1.0', {
      target: 'main:1.0',
      state: 'running',
      current_tool: '',
      permission_mode: 'default',
    }, stateFile);

    // Simulate PermissionRequest update
    const existing = readState(stateFile).agents['main:1.0'];
    const update = {
      ...existing,
      state: 'input',
      current_tool: 'Edit',
      permission_mode: 'acceptEdits',
      last_hook_event: 'PermissionRequest',
    };
    writeState('main:1.0', update, stateFile);

    const result = readState(stateFile).agents['main:1.0'];
    assert.equal(result.state, 'input');
    assert.equal(result.current_tool, 'Edit');
    assert.equal(result.permission_mode, 'acceptEdits');
    assert.equal(result.last_hook_event, 'PermissionRequest');
  });

  it('PostToolUse sets state to running and clears current_tool', () => {
    // Seed agent in input state
    writeState('main:1.0', {
      target: 'main:1.0',
      state: 'input',
      current_tool: 'Edit',
      permission_mode: 'acceptEdits',
      last_hook_event: 'PermissionRequest',
    }, stateFile);

    // Simulate PostToolUse update
    const existing = readState(stateFile).agents['main:1.0'];
    const update = {
      ...existing,
      state: 'running',
      current_tool: '',
      last_hook_event: 'PostToolUse',
    };
    writeState('main:1.0', update, stateFile);

    const result = readState(stateFile).agents['main:1.0'];
    assert.equal(result.state, 'running');
    assert.equal(result.current_tool, '');
    assert.equal(result.last_hook_event, 'PostToolUse');
  });

  it('PreToolUse sets current_tool but keeps state running', () => {
    writeState('main:1.0', {
      target: 'main:1.0',
      state: 'running',
      current_tool: '',
    }, stateFile);

    const existing = readState(stateFile).agents['main:1.0'];
    const update = {
      ...existing,
      state: 'running',
      current_tool: 'Bash',
      last_hook_event: 'PreToolUse',
    };
    writeState('main:1.0', update, stateFile);

    const result = readState(stateFile).agents['main:1.0'];
    assert.equal(result.state, 'running');
    assert.equal(result.current_tool, 'Bash');
  });

  it('preserves existing fields not updated by fast hook', () => {
    writeState('main:1.0', {
      target: 'main:1.0',
      state: 'running',
      branch: 'feat/something',
      model: 'claude-opus-4-6',
      session_id: 'abc123',
      files_changed: ['file1.go', 'file2.go'],
    }, stateFile);

    // Fast hook only updates state, current_tool, permission_mode, last_hook_event
    const existing = readState(stateFile).agents['main:1.0'];
    const update = {
      ...existing,
      state: 'input',
      current_tool: 'Bash',
      permission_mode: 'default',
      last_hook_event: 'PermissionRequest',
    };
    writeState('main:1.0', update, stateFile);

    const result = readState(stateFile).agents['main:1.0'];
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
