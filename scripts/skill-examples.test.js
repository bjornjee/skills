'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const REPO = path.resolve(__dirname, '..');
function blocks(skill, language) {
  const text = fs.readFileSync(path.join(REPO, 'skills', skill, 'SKILL.md'), 'utf8');
  return [...text.matchAll(new RegExp('```' + language + '\\n([\\s\\S]*?)```', 'g'))].map(match => match[1]);
}
function pythonScenario(scenario) {
  const code = blocks('regex-vs-llm-structured-text', 'python')[0];
  const result = spawnSync('python3', ['-c', code + '\n' + scenario], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
function claudeScenario(setup, assertion) {
  const code = blocks('claude-api', 'python')[0];
  const program = `import json\nfrom types import SimpleNamespace as NS\ntask = 'example'\ntools = []\ncalls = []\ndef dispatch(name, args):\n    calls.append((name, args))\n    return 'result'\ndef response(reason):\n    return NS(stop_reason=reason, content=[NS(type='tool_use', name='read', input={}, id=str(len(calls)))])\n${setup}\nclient = NS(messages=NS(create=lambda **kwargs: responses.pop(0)))\n${assertion.replace('EXAMPLE', JSON.stringify(code))}`;
  const result = spawnSync('python3', ['-c', program], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
it('Claude loop permits rereading changed state with identical tool arguments', () => {
  claudeScenario("responses = [response('tool_use'), response('tool_use'), response('end_turn')]", 'exec(EXAMPLE)\nassert len(calls) == 2');
});
it('Claude loop reports truncated output instead of presenting completion', () => {
  claudeScenario("responses = [response('max_tokens')]", 'try:\n    exec(EXAMPLE)\nexcept RuntimeError:\n    pass\nelse:\n    raise AssertionError("truncation silently accepted")');
});
it('Claude loop reports exhausted execution budget', () => {
  claudeScenario("responses = [response('tool_use') for _ in range(10)]", 'try:\n    exec(EXAMPLE)\nexcept RuntimeError:\n    pass\nelse:\n    raise AssertionError("budget exhaustion silently accepted")');
});
it('parser example accepts an intact record', () => pythonScenario(`
items = parse_structured_text('1. A sufficiently long question?\\nA. first\\nB. second\\nC. third\\nAnswer: B')
assert len(items) == 1 and items[0].answer == 'B'
`));
it('parser example exposes a missing answer instead of dropping the record', () => pythonScenario(`
try:
    parse_structured_text('1. A sufficiently long question?\\nA. first\\nB. second\\nC. third\\n')
except ValueError:
    pass
else:
    raise AssertionError('missing record was silently dropped')
`));
it('parser example cannot merge a malformed record into its neighbor', () => pythonScenario(`
text = '1. A sufficiently long question?\\nA. first\\nB. second\\nC. third\\n2. Another sufficiently long question?\\nA. other\\nB. another\\nC. final\\nAnswer: B'
try:
    parse_structured_text(text)
except ValueError:
    pass
else:
    raise AssertionError('malformed neighbor was accepted')
`));
it('worker-pool example closes results when cancellation interrupts an idle input', () => {
  const code = blocks('golang-patterns', 'go').find(block => block.includes('func run('));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-go-'));
  try {
    fs.writeFileSync(path.join(dir, 'pool_test.go'), `package pool
import ("context"; "sync"; "testing")
type Job int
type Result int
func process(args ...any) Result { return 1 }
${code}
func TestCancelIdle(t *testing.T) {
 ctx, cancel := context.WithCancel(context.Background())
 results := run(ctx, make(chan Job), 1)
 cancel()
 if _, open := <-results; open { t.Fatal("unexpected result") }
}
`);
    const result = spawnSync('go', ['test', '-race', '-timeout=10s', '.'], {
      cwd: dir, encoding: 'utf8', timeout: 60000,
      env: { ...process.env, HOME: dir, GO111MODULE: 'off', GOTOOLCHAIN: 'local', GOCACHE: path.join(REPO, 'tmp', 'go-cache') },
    });
    assert.equal(result.status, 0, result.stdout + result.stderr + (result.error || ''));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
