'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { validateState, validateAgent, sortAgentsByPriority, VALID_STATES } = require('./schema');
const { detectState, scoreMessage, scorePaneBuffer } = require('./detect');
const { readState, writeState, cleanStale } = require('./index');

// Temp dir for state file tests
let tmpDir;
let stateFile;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-state-test-'));
  stateFile = path.join(tmpDir, 'state.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// --- Schema ---

describe('schema/validateAgent', () => {
  it('rejects null and non-objects', () => {
    assert.equal(validateAgent(null), false);
    assert.equal(validateAgent('string'), false);
    assert.equal(validateAgent(42), false);
  });

  it('rejects missing target', () => {
    assert.equal(validateAgent({ state: 'running' }), false);
  });

  it('rejects invalid state', () => {
    assert.equal(validateAgent({ target: 'a:0.1', state: 'unknown' }), false);
  });

  it('accepts valid agent', () => {
    for (const state of VALID_STATES) {
      assert.equal(validateAgent({ target: 'a:0.1', state }), true);
    }
  });
});

describe('schema/validateState', () => {
  it('returns empty state for null input', () => {
    assert.deepEqual(validateState(null), { agents: {} });
  });

  it('filters out invalid agents', () => {
    const result = validateState({
      agents: {
        good: { target: 'a:0.1', state: 'running' },
        bad: { state: 'invalid' },
      },
    });
    assert.equal(Object.keys(result.agents).length, 1);
    assert.ok(result.agents.good);
  });
});

describe('schema/sortAgentsByPriority', () => {
  it('sorts input first, then error, running, idle, done', () => {
    const agents = [
      { state: 'done', target: 'a' },
      { state: 'input', target: 'b' },
      { state: 'running', target: 'c' },
      { state: 'error', target: 'd' },
      { state: 'idle', target: 'e' },
    ];
    const sorted = sortAgentsByPriority(agents);
    assert.deepEqual(sorted.map(a => a.state), ['input', 'error', 'running', 'idle', 'done']);
  });
});

// --- Detect ---

describe('detect/scoreMessage', () => {
  it('returns 0 for null/empty', () => {
    assert.equal(scoreMessage(null), 0);
    assert.equal(scoreMessage(''), 0);
  });

  it('scores questions ending with ?', () => {
    assert.ok(scoreMessage('Which provider should I use?') > 0);
  });

  it('scores question patterns', () => {
    assert.ok(scoreMessage('Should I use Firebase?') > 0);
    assert.ok(scoreMessage('Do you want me to proceed?') > 0);
    assert.ok(scoreMessage('Please choose one') > 0);
  });

  it('returns 0 for non-question statements', () => {
    assert.equal(scoreMessage('I have completed the task.'), 0);
    assert.equal(scoreMessage('All tests pass.'), 0);
  });
});

describe('detect/scorePaneBuffer', () => {
  it('returns 0 for empty buffer', () => {
    assert.equal(scorePaneBuffer([]), 0);
    assert.equal(scorePaneBuffer(null), 0);
  });

  it('detects > prompt', () => {
    assert.ok(scorePaneBuffer(['some output', '>']) > 0);
  });

  it('detects $ prompt', () => {
    assert.ok(scorePaneBuffer(['output', '$']) > 0);
  });

  it('returns 0 for normal output lines', () => {
    assert.equal(scorePaneBuffer(['Running tests...', 'All 5 passed']), 0);
  });

  it('detects plan approval menu with ❯ selector', () => {
    const planApprovalPane = [
      'Claude has written up a plan and is ready to execute. Would you like to proceed?',
      '',
      ' \u276f 1. Yes, and bypass permissions',
      '   2. Yes, manually approve edits',
      '   3. Tell Claude what to change',
    ];
    assert.ok(scorePaneBuffer(planApprovalPane) > 0);
  });

  it('detects ❯ anywhere in line, not just at end', () => {
    assert.ok(scorePaneBuffer(['some text', '\u276f 1. Option A']) > 0);
  });

  it('detects human: prompt', () => {
    assert.ok(scorePaneBuffer(['output', 'human:']) > 0);
    assert.ok(scorePaneBuffer(['output', 'Human: type here']) > 0);
  });
});

describe('detect/detectState', () => {
  it('returns input when message has question and pane has prompt', () => {
    assert.equal(detectState('Which one?', ['output', '>']), 'input');
  });

  it('returns input when only message has question', () => {
    assert.equal(detectState('Which one?', ['still running...']), 'input');
  });

  it('returns input when pane shows prompt even without question', () => {
    // Prompt visible = agent is waiting for user, regardless of message content
    assert.equal(detectState('Task complete.', ['$']), 'input');
    assert.equal(detectState('Here is my plan.', ['\u276f']), 'input');
  });

  it('returns input when pane shows plan approval menu', () => {
    const planPane = [
      'Here is my implementation plan.',
      '',
      ' \u276f 1. Yes, and bypass permissions',
      '   2. Yes, manually approve edits',
    ];
    assert.equal(detectState('Here is my implementation plan.', planPane), 'input');
  });

  it('returns done when no signals', () => {
    assert.equal(detectState('All done.', ['output line']), 'done');
  });
});

// --- State File I/O ---

describe('readState', () => {
  it('returns empty state when file does not exist', () => {
    const state = readState(stateFile);
    assert.deepEqual(state, { agents: {} });
  });

  it('reads and validates state file', () => {
    fs.writeFileSync(stateFile, JSON.stringify({
      agents: { 'a:0.1': { target: 'a:0.1', state: 'running' } },
    }));
    const state = readState(stateFile);
    assert.equal(Object.keys(state.agents).length, 1);
    assert.equal(state.agents['a:0.1'].state, 'running');
  });

  it('handles corrupted JSON gracefully', () => {
    fs.writeFileSync(stateFile, 'not json{{{');
    assert.deepEqual(readState(stateFile), { agents: {} });
  });
});

describe('writeState', () => {
  it('creates state file if it does not exist', () => {
    writeState('a:0.1', { target: 'a:0.1', state: 'running' }, stateFile);
    const state = readState(stateFile);
    assert.equal(state.agents['a:0.1'].state, 'running');
    assert.ok(state.agents['a:0.1'].updated_at);
  });

  it('merges updates into existing agent', () => {
    writeState('a:0.1', { target: 'a:0.1', state: 'running', branch: 'main' }, stateFile);
    writeState('a:0.1', { state: 'done' }, stateFile);

    const state = readState(stateFile);
    assert.equal(state.agents['a:0.1'].state, 'done');
    assert.equal(state.agents['a:0.1'].branch, 'main');
  });

  it('preserves other agents when updating one', () => {
    writeState('a:0.1', { target: 'a:0.1', state: 'running' }, stateFile);
    writeState('b:0.1', { target: 'b:0.1', state: 'input' }, stateFile);

    const state = readState(stateFile);
    assert.equal(Object.keys(state.agents).length, 2);
  });
});

describe('writeState concurrent', () => {
  it('does not lose updates under concurrent multi-process writes', async () => {
    // The real race happens between separate hook processes, not Promise-based
    // concurrency (writeState is synchronous, Node.js is single-threaded).
    // Spawn N child processes that each write a different agent concurrently.
    const { execFile } = require('child_process');
    const { promisify } = require('util');
    const execFileP = promisify(execFile);

    const N = 10;
    const script = path.join(tmpDir, '_concurrent-write-helper.js');

    // Write the helper script that each child process will execute
    const indexPath = path.join(__dirname, 'index.js');
    fs.writeFileSync(script, `
      const { writeState } = require(${JSON.stringify(indexPath)});
      const [id, branch, file] = process.argv.slice(2);
      writeState(id, { target: id, state: 'running', branch }, file);
    `);

    // Launch all N processes simultaneously
    const promises = [];
    for (let i = 0; i < N; i++) {
      const id = `agent:${i}.0`;
      promises.push(execFileP(process.execPath, [script, id, `branch-${i}`, stateFile]));
    }
    await Promise.all(promises);

    const state = readState(stateFile);
    const agentCount = Object.keys(state.agents).length;
    assert.equal(agentCount, N, `Expected ${N} agents but got ${agentCount} — concurrent writes lost updates`);

    for (let i = 0; i < N; i++) {
      const id = `agent:${i}.0`;
      assert.ok(state.agents[id], `Agent ${id} missing from state`);
      assert.equal(state.agents[id].branch, `branch-${i}`);
    }
  });
});

describe('cleanStale', () => {
  it('removes agents older than threshold', () => {
    const old = new Date(Date.now() - 600000).toISOString(); // 10 min ago
    const fresh = new Date().toISOString();

    fs.writeFileSync(stateFile, JSON.stringify({
      agents: {
        old: { target: 'old:0.1', state: 'done', updated_at: old },
        fresh: { target: 'fresh:0.1', state: 'running', updated_at: fresh },
      },
    }));

    cleanStale(300000, stateFile); // 5 min threshold

    const state = readState(stateFile);
    assert.equal(Object.keys(state.agents).length, 1);
    assert.ok(state.agents.fresh);
  });

  it('no-ops when no stale agents', () => {
    const fresh = new Date().toISOString();
    fs.writeFileSync(stateFile, JSON.stringify({
      agents: { a: { target: 'a:0.1', state: 'running', updated_at: fresh } },
    }));

    cleanStale(300000, stateFile);
    const state = readState(stateFile);
    assert.equal(Object.keys(state.agents).length, 1);
  });
});
