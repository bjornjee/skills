'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');

const SCRIPT = path.resolve(__dirname, '../skills/context-management/suggest-compact.sh');

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'compact-hook-')));
  const home = path.join(root, 'home with spaces');
  fs.mkdirSync(home, { mode: 0o700 });
  const legacyId = randomUUID();
  const legacy = `/tmp/claude-tool-count-${legacyId}`;
  t.after(() => {
    fs.rmSync(legacy, { force: true });
    fs.rmSync(root, { recursive: true, force: true });
  });
  const state = path.join(home, '.local/state/bjornjee-skills/compact');
  function run(session = 'session-A', options = {}) {
    return spawnSync('bash', [SCRIPT], {
      encoding: 'utf8', timeout: 5000,
      input: options.input ?? JSON.stringify({ hook_event_name: 'PreToolUse', session_id: session }),
      env: { ...process.env, HOME: home, XDG_STATE_HOME: '', COMPACT_THRESHOLD: '2', CLAUDE_SESSION_ID: legacyId, ...options.env },
    });
  }
  function counter() {
    const names = fs.readdirSync(state);
    assert.equal(names.length, 1);
    return path.join(state, names[0]);
  }
  return { root, home, state, legacy, run, counter };
}

it('emits documented PreToolUse context only at the reminder threshold', (t) => {
  const f = fixture(t);
  assert.equal(f.run().stdout, '');
  const reminder = f.run();
  assert.equal(reminder.status, 0, reminder.stderr);
  const output = JSON.parse(reminder.stdout);
  assert.equal(output.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.match(output.hookSpecificOutput.additionalContext, /2 .*calls/);
  assert.equal(reminder.stderr, '');
  assert.equal(f.run().stdout, '');
});

it('keeps independent stdin session identities separate', (t) => {
  const f = fixture(t);
  assert.equal(f.run('A').stdout, '');
  assert.equal(f.run('B').stdout, '');
  assert.match(JSON.parse(f.run('A').stdout).hookSpecificOutput.additionalContext, /2 .*calls/);
  assert.match(JSON.parse(f.run('B').stdout).hookSpecificOutput.additionalContext, /2 .*calls/);
  assert.equal(fs.readdirSync(f.state).length, 2);
});

it('does not follow or modify an old shared-temp counter symlink', (t) => {
  const f = fixture(t);
  const target = path.join(f.root, 'owned target');
  fs.writeFileSync(target, '49');
  fs.symlinkSync(target, f.legacy);
  assert.equal(f.run().status, 0);
  assert.equal(fs.readFileSync(target, 'utf8'), '49');
});

for (const input of ['invalid JSON', '{}', 'null', '{"hook_event_name":"PreToolUse","session_id":17}', '{"hook_event_name":"Stop","session_id":"A"}', 'x'.repeat(1024 * 1024 + 1)]) {
  it(`skips invalid hook input without writing state (${input.slice(0, 50)})`, (t) => {
    const f = fixture(t);
    const result = f.run('A', { input });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.equal(fs.existsSync(f.state), false);
    assert.equal(fs.existsSync(f.legacy), false);
  });
}

it('creates private state under an absolute XDG state home', (t) => {
  const f = fixture(t);
  const base = path.join(f.root, 'xdg state');
  const result = f.run('../unsafe/session', { env: { XDG_STATE_HOME: base } });
  assert.equal(result.status, 0, result.stderr);
  const directory = path.join(base, 'bjornjee-skills/compact');
  assert.equal(fs.statSync(directory).mode & 0o777, 0o700);
  const files = fs.readdirSync(directory);
  assert.equal(files.length, 1);
  assert.equal(fs.statSync(path.join(directory, files[0])).mode & 0o777, 0o600);
});

it('refuses a relative state home before any state write', (t) => {
  const f = fixture(t);
  const result = f.run('A', { env: { XDG_STATE_HOME: 'relative-state' } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(fs.existsSync(f.state), false);
  assert.equal(fs.existsSync(f.legacy), false);
});

it('refuses a symlinked state directory without changing the target', (t) => {
  const f = fixture(t);
  const target = path.join(f.root, 'target directory');
  fs.mkdirSync(target, { mode: 0o700 });
  fs.mkdirSync(path.dirname(f.state), { recursive: true });
  fs.symlinkSync(target, f.state);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.deepEqual(fs.readdirSync(target), []);
});

for (const link of ['symlink', 'hardlink']) {
  it(`refuses a ${link} counter without overwriting its target`, (t) => {
    const f = fixture(t);
    f.run();
    const counter = f.counter();
    const target = path.join(f.root, 'protected target');
    fs.writeFileSync(target, '49', { mode: 0o600 });
    fs.unlinkSync(counter);
    if (link === 'symlink') fs.symlinkSync(target, counter);
    else fs.linkSync(target, counter);
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.equal(fs.readFileSync(target, 'utf8'), '49');
  });
}

it('resets corrupt numeric state instead of evaluating shell arithmetic', (t) => {
  const f = fixture(t);
  f.run();
  const counter = f.counter();
  fs.writeFileSync(counter, '1+48');
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(fs.readFileSync(counter, 'utf8').trim(), '1');
});

it('refuses counters with permissions exposing state to other users', (t) => {
  const f = fixture(t);
  f.run();
  const counter = f.counter();
  fs.chmodSync(counter, 0o666);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(fs.readFileSync(counter, 'utf8').trim(), '1');
});

it('rejects invalid threshold configuration without state writes', (t) => {
  const f = fixture(t);
  const result = f.run('A', { env: { COMPACT_THRESHOLD: '1+1' } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(fs.existsSync(f.state), false);
  assert.equal(fs.existsSync(f.legacy), false);
});

it('reminds every 25 calls after a custom threshold', (t) => {
  const f = fixture(t);
  const options = { env: { COMPACT_THRESHOLD: '7' } };
  f.run('A', options);
  const counter = f.counter();
  fs.writeFileSync(counter, '6');
  assert.match(JSON.parse(f.run('A', options).stdout).hookSpecificOutput.additionalContext, /7 selected/);
  fs.writeFileSync(counter, '31');
  assert.match(JSON.parse(f.run('A', options).stdout).hookSpecificOutput.additionalContext, /32 selected/);
  assert.equal(f.run('A', options).stdout, '');
});

it('skips a contended counter without waiting for the other process', { timeout: 10000 }, async (t) => {
  const f = fixture(t);
  f.run();
  const counter = f.counter();
  const holder = spawn('python3', ['-c',
    'import fcntl,sys; f=open(sys.argv[1], "r+"); fcntl.flock(f, fcntl.LOCK_EX); print("locked", flush=True); sys.stdin.read()',
    counter,
  ], { stdio: ['pipe', 'pipe', 'pipe'] });
  t.after(() => holder.kill());
  const [ready] = await once(holder.stdout, 'data');
  assert.match(ready.toString(), /locked/);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Reminder skipped/);
  assert.equal(result.stdout, '');
  assert.equal(fs.readFileSync(counter, 'utf8').trim(), '1');
  const closed = once(holder, 'close');
  holder.stdin.end();
  await closed;
});
