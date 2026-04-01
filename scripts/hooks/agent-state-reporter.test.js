#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { buildReportEntry } = require('./agent-state-reporter');

const BASE_INPUT = {
  session_id: 'abc-123',
  hook_event_name: 'SessionStart',
  cwd: '/Users/bjornjee/Code/bjornjee/skills',
  permission_mode: 'default',
  model: 'claude-opus-4-6',
};

const BASE_PARSED = { session: 'main', window: 1, pane: 0 };

describe('buildReportEntry', () => {
  it('sets branch on SessionStart', () => {
    const { entry } = buildReportEntry({
      input: BASE_INPUT,
      existing: {},
      target: 'main:1.0',
      tmuxPane: '%0',
      state: 'running',
      filesChanged: [],
      branch: 'feat/new-feature',
      parsed: BASE_PARSED,
    });

    assert.equal(entry.branch, 'feat/new-feature');
    assert.equal(entry.state, 'running');
    assert.equal(entry.model, 'claude-opus-4-6');
  });

  it('sets branch on Stop event (not just SessionStart)', () => {
    const { entry } = buildReportEntry({
      input: { ...BASE_INPUT, hook_event_name: 'Stop' },
      existing: { state: 'running', branch: 'main' },
      target: 'main:1.0',
      tmuxPane: '%0',
      state: 'done',
      filesChanged: [],
      branch: 'feat/switched-branch',
      parsed: BASE_PARSED,
    });

    assert.equal(entry.branch, 'feat/switched-branch');
    assert.equal(entry.state, 'done');
  });

  it('detects branch change in debounce logic', () => {
    const { changed } = buildReportEntry({
      input: { ...BASE_INPUT, hook_event_name: 'Stop' },
      existing: { state: 'done', branch: 'main', subagent_count: 0, files_changed: [] },
      target: 'main:1.0',
      tmuxPane: '%0',
      state: 'done',
      filesChanged: [],
      branch: 'feat/new-branch',
      parsed: BASE_PARSED,
    });

    assert.equal(changed, true);
  });

  it('skips write when nothing changed', () => {
    const { changed } = buildReportEntry({
      input: { ...BASE_INPUT, hook_event_name: 'SubagentStop' },
      existing: {
        state: 'running',
        branch: 'main',
        subagent_count: 0,
        last_message_preview: null,
        permission_mode: 'default',
        files_changed: [],
      },
      target: 'main:1.0',
      tmuxPane: '%0',
      state: 'running',
      filesChanged: [],
      branch: 'main',
      parsed: BASE_PARSED,
    });

    assert.equal(changed, false);
  });

  it('increments subagent count on SubagentStart', () => {
    const { entry } = buildReportEntry({
      input: { ...BASE_INPUT, hook_event_name: 'SubagentStart' },
      existing: { subagent_count: 2 },
      target: 'main:1.0',
      tmuxPane: '%0',
      state: 'running',
      filesChanged: [],
      branch: 'main',
      parsed: BASE_PARSED,
    });

    assert.equal(entry.subagent_count, 3);
  });

  it('decrements subagent count on SubagentStop (floor 0)', () => {
    const { entry } = buildReportEntry({
      input: { ...BASE_INPUT, hook_event_name: 'SubagentStop' },
      existing: { subagent_count: 0 },
      target: 'main:1.0',
      tmuxPane: '%0',
      state: 'running',
      filesChanged: [],
      branch: 'main',
      parsed: BASE_PARSED,
    });

    assert.equal(entry.subagent_count, 0);
  });

  it('preserves model from existing on non-SessionStart events', () => {
    const { entry } = buildReportEntry({
      input: { ...BASE_INPUT, hook_event_name: 'Stop', model: 'claude-haiku-4-5' },
      existing: { model: 'claude-opus-4-6' },
      target: 'main:1.0',
      tmuxPane: '%0',
      state: 'done',
      filesChanged: [],
      branch: 'main',
      parsed: BASE_PARSED,
    });

    assert.equal(entry.model, 'claude-opus-4-6');
  });

  it('always reports changed when existing has no state (first write)', () => {
    const { changed } = buildReportEntry({
      input: BASE_INPUT,
      existing: {},
      target: 'main:1.0',
      tmuxPane: '%0',
      state: 'running',
      filesChanged: [],
      branch: 'main',
      parsed: BASE_PARSED,
    });

    assert.equal(changed, true);
  });
});
