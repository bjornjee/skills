'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { validateState, validateAgent, sortAgentsByPriority, VALID_STATES } = require('./schema');
const { detectState, scoreMessage, scorePaneBuffer } = require('./detect');
const { readAgentState, writeState, readAllState, cleanStale, encodeTarget, decodeTarget } = require('./index');

// Temp dir for per-agent file tests
let tmpDir;
let agentsDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-state-test-'));
  agentsDir = path.join(tmpDir, 'agents');
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

// --- Target encoding ---

describe('encodeTarget', () => {
  it('encodes colons and dots for filesystem safety', () => {
    assert.equal(encodeTarget('main:1.0'), 'main_c_1_d_0');
  });

  it('handles complex targets', () => {
    assert.equal(encodeTarget('my.project:2.3'), 'my_d_project_c_2_d_3');
  });

  it('handles simple names', () => {
    assert.equal(encodeTarget('simple'), 'simple');
  });

  it('encodes forward slashes to prevent path traversal', () => {
    assert.equal(encodeTarget('foo/bar:1.0'), 'foo_s_bar_c_1_d_0');
  });
});

describe('decodeTarget', () => {
  it('decodes back to original target', () => {
    assert.equal(decodeTarget('main_c_1_d_0'), 'main:1.0');
  });

  it('round-trips complex targets including slashes', () => {
    const targets = ['main:0.1', 'my.project:2.3', 'api:1.0', 'simple', 'foo/bar:1.0'];
    for (const t of targets) {
      assert.equal(decodeTarget(encodeTarget(t)), t);
    }
  });
});

// --- Per-agent file I/O ---

describe('readAgentState', () => {
  it('returns null when agent file does not exist', () => {
    const state = readAgentState('nonexistent:0.1', agentsDir);
    assert.equal(state, null);
  });

  it('reads agent state from per-agent file', () => {
    fs.mkdirSync(agentsDir, { recursive: true });
    const encoded = encodeTarget('a:0.1');
    fs.writeFileSync(
      path.join(agentsDir, `${encoded}.json`),
      JSON.stringify({ target: 'a:0.1', state: 'running', branch: 'main' }),
    );

    const state = readAgentState('a:0.1', agentsDir);
    assert.equal(state.target, 'a:0.1');
    assert.equal(state.state, 'running');
    assert.equal(state.branch, 'main');
  });

  it('handles corrupted JSON gracefully', () => {
    fs.mkdirSync(agentsDir, { recursive: true });
    const encoded = encodeTarget('a:0.1');
    fs.writeFileSync(path.join(agentsDir, `${encoded}.json`), 'not json{{{');

    assert.equal(readAgentState('a:0.1', agentsDir), null);
  });
});

describe('writeState', () => {
  it('creates agents directory and file if they do not exist', () => {
    writeState('a:0.1', { target: 'a:0.1', state: 'running' }, agentsDir);

    const state = readAgentState('a:0.1', agentsDir);
    assert.equal(state.state, 'running');
    assert.ok(state.updated_at);
  });

  it('merges updates into existing agent file', () => {
    writeState('a:0.1', { target: 'a:0.1', state: 'running', branch: 'main' }, agentsDir);
    writeState('a:0.1', { state: 'done' }, agentsDir);

    const state = readAgentState('a:0.1', agentsDir);
    assert.equal(state.state, 'done');
    assert.equal(state.branch, 'main');
  });

  it('writes separate files for different agents', () => {
    writeState('a:0.1', { target: 'a:0.1', state: 'running' }, agentsDir);
    writeState('b:0.1', { target: 'b:0.1', state: 'input' }, agentsDir);

    const all = readAllState(agentsDir);
    assert.equal(Object.keys(all.agents).length, 2);
    assert.equal(all.agents['a:0.1'].state, 'running');
    assert.equal(all.agents['b:0.1'].state, 'input');
  });
});

describe('readAllState', () => {
  it('returns empty state when directory does not exist', () => {
    const state = readAllState(agentsDir);
    assert.deepEqual(state, { agents: {} });
  });

  it('reads all agent files from directory', () => {
    writeState('a:0.1', { target: 'a:0.1', state: 'running' }, agentsDir);
    writeState('b:1.0', { target: 'b:1.0', state: 'input' }, agentsDir);

    const state = readAllState(agentsDir);
    assert.equal(Object.keys(state.agents).length, 2);
    assert.equal(state.agents['a:0.1'].state, 'running');
    assert.equal(state.agents['b:1.0'].state, 'input');
  });

  it('skips non-json files and invalid agents', () => {
    fs.mkdirSync(agentsDir, { recursive: true });
    fs.writeFileSync(path.join(agentsDir, 'readme.txt'), 'not an agent');
    fs.writeFileSync(path.join(agentsDir, 'bad.json'), 'not json');
    writeState('a:0.1', { target: 'a:0.1', state: 'running' }, agentsDir);

    const state = readAllState(agentsDir);
    assert.equal(Object.keys(state.agents).length, 1);
  });
});

describe('writeState concurrent (per-agent files)', () => {
  it('does not lose updates under concurrent multi-process writes', async () => {
    const { execFile } = require('child_process');
    const { promisify } = require('util');
    const execFileP = promisify(execFile);

    const N = 10;
    const script = path.join(tmpDir, '_concurrent-write-helper.js');

    const indexPath = path.join(__dirname, 'index.js');
    fs.writeFileSync(script, `
      const { writeState } = require(${JSON.stringify(indexPath)});
      const [id, branch, dir] = process.argv.slice(2);
      writeState(id, { target: id, state: 'running', branch }, dir);
    `);

    // Launch all N processes simultaneously — each writes its OWN file
    const promises = [];
    for (let i = 0; i < N; i++) {
      const id = `agent:${i}.0`;
      promises.push(execFileP(process.execPath, [script, id, `branch-${i}`, agentsDir]));
    }
    await Promise.all(promises);

    const state = readAllState(agentsDir);
    const agentCount = Object.keys(state.agents).length;
    assert.equal(agentCount, N, `Expected ${N} agents but got ${agentCount}`);

    for (let i = 0; i < N; i++) {
      const id = `agent:${i}.0`;
      assert.ok(state.agents[id], `Agent ${id} missing from state`);
      assert.equal(state.agents[id].branch, `branch-${i}`);
    }
  });
});

describe('cleanStale', () => {
  it('removes agent files older than threshold', () => {
    const old = new Date(Date.now() - 600000).toISOString(); // 10 min ago
    const fresh = new Date().toISOString();

    writeState('old:0.1', { target: 'old:0.1', state: 'done', updated_at: old }, agentsDir);
    writeState('fresh:0.1', { target: 'fresh:0.1', state: 'running', updated_at: fresh }, agentsDir);

    // Force the old agent's updated_at to be old (writeState auto-sets updated_at)
    const oldFile = path.join(agentsDir, encodeTarget('old:0.1') + '.json');
    const oldData = JSON.parse(fs.readFileSync(oldFile, 'utf8'));
    oldData.updated_at = old;
    fs.writeFileSync(oldFile, JSON.stringify(oldData));

    cleanStale(300000, agentsDir); // 5 min threshold

    const state = readAllState(agentsDir);
    assert.equal(Object.keys(state.agents).length, 1);
    assert.ok(state.agents['fresh:0.1']);
    assert.equal(state.agents['old:0.1'], undefined);
  });

  it('no-ops when no stale agents', () => {
    writeState('a:0.1', { target: 'a:0.1', state: 'running' }, agentsDir);

    cleanStale(300000, agentsDir);
    const state = readAllState(agentsDir);
    assert.equal(Object.keys(state.agents).length, 1);
  });

  it('no-ops when directory does not exist', () => {
    // Should not throw
    cleanStale(300000, path.join(tmpDir, 'nonexistent'));
  });
});
