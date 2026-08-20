#!/usr/bin/env node
'use strict';

const { afterEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const MAKEFILE = path.join(REPO, 'Makefile');
const SYNC = path.join(REPO, 'scripts', 'sync-codex.js');
const HOOK = path.join(REPO, 'native-codex', 'hooks', 'warn-destructive.js');
const homes = [];
const CLOUD_SKILLS = [
  'agent-harness-construction',
  'agent-introspection-debugging',
  'agentic-engineering',
  'ai-ml-patterns',
  'api-design',
  'claude-api',
  'codex-cloud-goal',
  'context-management',
  'create-linear-issue',
  'data-modeling',
  'design-presentations',
  'distributed-systems',
  'fastapi-patterns',
  'git-workflow',
  'golang-patterns',
  'golang-testing',
  'incident-response',
  'mcp-server-patterns',
  'observability',
  'ponytail',
  'python-patterns',
  'react-native-patterns',
  'regex-vs-llm-structured-text',
  'security-design',
  'terminal-ops',
  'typescript-patterns',
];
const CLOUD_AGENTS = [
  'go-reviewer-strict',
  'python-reviewer-strict',
  'typescript-reviewer-strict',
];

function tempHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-codex-'));
  homes.push(home);
  return home;
}

function runSync(home, ...args) {
  return runProfile(home, 'local', ...args);
}

function runProfile(home, profile, ...args) {
  return execFileSync(process.execPath, [SYNC, '--profile', profile, ...args], {
    cwd: REPO,
    env: { ...process.env, HOME: home },
    encoding: 'utf8',
  });
}

function runHook(command) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command },
    }),
    encoding: 'utf8',
  });
}

afterEach(() => {
  for (const home of homes.splice(0)) {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

describe('sync-codex', () => {
  it('exposes distinct local and Cloud sync/check targets', () => {
    const makefile = fs.readFileSync(MAKEFILE, 'utf8');
    for (const target of [
      'sync-codex-local',
      'check-codex-local',
      'sync-codex-cloud',
      'check-codex-cloud',
    ]) {
      assert.match(makefile, new RegExp(`^${target}:`, 'm'));
    }
    assert.match(makefile, /sync-codex-local:[\s\S]*--profile local/m);
    assert.match(makefile, /check-codex-local:[\s\S]*--profile local --check/m);
    assert.match(makefile, /sync-codex-cloud:[\s\S]*--profile cloud/m);
    assert.match(makefile, /check-codex-cloud:[\s\S]*--profile cloud --check/m);
    assert.match(makefile, /^sync-codex:[\s\S]*--profile local \$\(ARGS\)/m);
  });

  it('installs skills, global rules, the owned guardrail, and compatible agents', () => {
    const home = tempHome();
    runSync(home);

    assert.ok(fs.existsSync(path.join(home, '.agents', 'skills', 'terminal-ops', 'SKILL.md')));
    assert.ok(fs.existsSync(
      path.join(home, '.agents', 'skills', 'create-linear-issue', 'SKILL.md'),
    ));
    assert.ok(fs.existsSync(
      path.join(home, '.agents', 'skills', 'create-linear-issue', 'agents', 'openai.yaml'),
    ));
    assert.equal(
      fs.readFileSync(path.join(home, '.codex', 'AGENTS.md'), 'utf8'),
      fs.readFileSync(path.join(REPO, '.codex', 'AGENTS.md'), 'utf8'),
    );
    assert.equal(
      fs.readFileSync(path.join(home, '.codex', 'hooks', 'warn-destructive.js'), 'utf8'),
      fs.readFileSync(HOOK, 'utf8'),
    );
    assert.equal(
      fs.statSync(path.join(home, '.codex', 'hooks', 'warn-destructive.js')).mode & 0o777,
      0o755,
    );

    const reviewer = fs.readFileSync(
      path.join(home, '.codex', 'agents', 'python-reviewer-strict.toml'),
      'utf8',
    );
    assert.match(reviewer, /^name = "python-reviewer-strict"/m);
    assert.match(reviewer, /^description = /m);
    assert.match(reviewer, /^developer_instructions = /m);
    assert.match(reviewer, /^sandbox_mode = "read-only"/m);
    assert.doesNotMatch(reviewer, /model = "sonnet"/);
  });

  it('installs the explicit Cloud payload without local-only skills or hooks', () => {
    const home = tempHome();
    runProfile(home, 'cloud');

    assert.ok(fs.existsSync(
      path.join(home, '.agents', 'skills', 'codex-cloud-goal', 'SKILL.md'),
    ));
    assert.ok(fs.existsSync(
      path.join(home, '.codex', 'agents', 'python-reviewer-strict.toml'),
    ));
    assert.equal(
      fs.readFileSync(path.join(home, '.codex', 'AGENTS.md'), 'utf8'),
      fs.readFileSync(path.join(REPO, '.codex', 'AGENTS.md'), 'utf8'),
    );
    for (const excluded of [
      'codex-delegate',
      'github-ops',
      'hookify-rules',
      'codegraph-audit',
      'search-first',
      'uiux-design-loop',
    ]) {
      assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', excluded)), false);
    }
    assert.equal(fs.existsSync(path.join(home, '.codex', 'hooks.json')), false);
    assert.equal(fs.existsSync(path.join(home, '.codex', 'hooks')), false);
    const installedSkills = fs.readdirSync(path.join(home, '.agents', 'skills')).sort();
    const installedAgents = fs.readdirSync(path.join(home, '.codex', 'agents'))
      .map(name => name.replace(/\.toml$/, ''))
      .sort();
    assert.deepEqual(installedSkills, CLOUD_SKILLS);
    assert.deepEqual(installedAgents, CLOUD_AGENTS);
    assert.doesNotThrow(() => runProfile(home, 'cloud', '--check'));
  });

  it('keeps local CLI and desktop prerequisites out of Cloud skill entrypoints', () => {
    const forbidden = /\bcodex exec\b|AskUserQuestion|~\/\.claude\/skills\/impeccable/;
    for (const name of CLOUD_SKILLS) {
      const content = fs.readFileSync(path.join(REPO, 'skills', name, 'SKILL.md'), 'utf8');
      assert.doesNotMatch(content, forbidden, name);
    }
  });

  it('keeps local and Cloud ownership manifests separate in a shared home', () => {
    const home = tempHome();
    runSync(home);
    runProfile(home, 'cloud');

    const cloudManifestPath = path.join(
      home,
      '.codex',
      'bjornjee-skills-cloud-manifest.json',
    );
    const cloudManifest = JSON.parse(fs.readFileSync(cloudManifestPath, 'utf8'));
    cloudManifest.skills.push('codex-delegate');
    cloudManifest.agents.push('performance-optimizer');
    fs.writeFileSync(cloudManifestPath, `${JSON.stringify(cloudManifest, null, 2)}\n`);
    runProfile(home, 'cloud');

    assert.ok(fs.existsSync(path.join(home, '.agents', 'skills', 'codex-delegate')));
    assert.ok(fs.existsSync(path.join(home, '.agents', 'skills', 'github-ops')));
    assert.ok(fs.existsSync(
      path.join(home, '.codex', 'agents', 'performance-optimizer.toml'),
    ));
    assert.ok(fs.existsSync(path.join(home, '.codex', 'hooks', 'warn-destructive.js')));
    assert.ok(fs.existsSync(
      path.join(home, '.codex', 'bjornjee-skills-local-manifest.json'),
    ));
    assert.ok(fs.existsSync(
      cloudManifestPath,
    ));
    assert.doesNotThrow(() => runSync(home, '--check'));
    assert.doesNotThrow(() => runProfile(home, 'cloud', '--check'));
  });

  it('detects and repairs Cloud drift while preserving unrelated peers', () => {
    const home = tempHome();
    runProfile(home, 'cloud');
    const cloudGoal = path.join(home, '.agents', 'skills', 'codex-cloud-goal');
    fs.appendFileSync(path.join(cloudGoal, 'SKILL.md'), '\ndrift\n');
    const unrelated = path.join(home, '.agents', 'skills', 'peer-skill', 'SKILL.md');
    fs.mkdirSync(path.dirname(unrelated), { recursive: true });
    fs.writeFileSync(unrelated, '# peer\n');

    const manifestPath = path.join(
      home,
      '.codex',
      'bjornjee-skills-cloud-manifest.json',
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.skills.push('retired-cloud-skill');
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const retired = path.join(home, '.agents', 'skills', 'retired-cloud-skill', 'SKILL.md');
    fs.mkdirSync(path.dirname(retired), { recursive: true });
    fs.writeFileSync(retired, '# retired\n');

    const check = spawnSync(
      process.execPath,
      [SYNC, '--profile', 'cloud', '--check'],
      { cwd: REPO, env: { ...process.env, HOME: home }, encoding: 'utf8' },
    );
    assert.equal(check.status, 1);
    assert.match(check.stderr, /codex-cloud-goal/);
    assert.match(check.stderr, /retired-cloud-skill/);

    runProfile(home, 'cloud');
    assert.doesNotThrow(() => runProfile(home, 'cloud', '--check'));
    assert.equal(fs.existsSync(path.dirname(retired)), false);
    assert.equal(fs.readFileSync(unrelated, 'utf8'), '# peer\n');
  });

  it('fails closed when a required Cloud skill is missing', () => {
    const home = tempHome();
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-codex-cloud-payload-'));
    homes.push(fixture);
    fs.mkdirSync(path.join(fixture, 'scripts'), { recursive: true });
    fs.copyFileSync(SYNC, path.join(fixture, 'scripts', 'sync-codex.js'));
    fs.mkdirSync(path.join(fixture, 'skills'), { recursive: true });

    const result = spawnSync(process.execPath, [
      path.join(fixture, 'scripts', 'sync-codex.js'),
      '--profile',
      'cloud',
    ], {
      cwd: fixture,
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /required Cloud skill missing/);
    assert.equal(fs.existsSync(path.join(home, '.codex')), false);
    assert.equal(fs.existsSync(path.join(home, '.agents')), false);
  });

  it('does not inspect excluded local-only payloads during Cloud sync', () => {
    const home = tempHome();
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-codex-cloud-allowlist-'));
    homes.push(fixture);
    fs.mkdirSync(path.join(fixture, 'scripts'), { recursive: true });
    fs.copyFileSync(SYNC, path.join(fixture, 'scripts', 'sync-codex.js'));
    fs.mkdirSync(path.join(fixture, '.codex'), { recursive: true });
    fs.copyFileSync(
      path.join(REPO, '.codex', 'AGENTS.md'),
      path.join(fixture, '.codex', 'AGENTS.md'),
    );
    fs.mkdirSync(path.join(fixture, 'skills'), { recursive: true });
    for (const name of CLOUD_SKILLS) {
      fs.cpSync(
        path.join(REPO, 'skills', name),
        path.join(fixture, 'skills', name),
        { recursive: true },
      );
    }
    fs.symlinkSync('/excluded/local-cli-skill', path.join(fixture, 'skills', 'codex-delegate'));
    fs.mkdirSync(path.join(fixture, 'agents'), { recursive: true });
    for (const name of CLOUD_AGENTS) {
      fs.copyFileSync(
        path.join(REPO, 'agents', `${name}.md`),
        path.join(fixture, 'agents', `${name}.md`),
      );
    }
    fs.symlinkSync(
      '/excluded/local-agent.md',
      path.join(fixture, 'agents', 'performance-optimizer.md'),
    );

    assert.doesNotThrow(() => execFileSync(process.execPath, [
      path.join(fixture, 'scripts', 'sync-codex.js'),
      '--profile',
      'cloud',
    ], {
      cwd: fixture,
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    }));
    assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'codex-delegate')), false);
    assert.equal(fs.existsSync(
      path.join(home, '.codex', 'agents', 'performance-optimizer.toml'),
    ), false);
  });

  it('preserves unrelated peer skills, agents, and hooks', () => {
    const home = tempHome();
    const unrelatedSkill = path.join(home, '.agents', 'skills', 'local-only', 'SKILL.md');
    fs.mkdirSync(path.dirname(unrelatedSkill), { recursive: true });
    fs.writeFileSync(unrelatedSkill, '# local\n');

    const unrelatedAgent = path.join(home, '.codex', 'agents', 'local-only.toml');
    fs.mkdirSync(path.dirname(unrelatedAgent), { recursive: true });
    fs.writeFileSync(unrelatedAgent, 'name = "local-only"\n');

    const hooksPath = path.join(home, '.codex', 'hooks.json');
    fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
    fs.writeFileSync(hooksPath, JSON.stringify({
      hooks: {
        Stop: [{ hooks: [{ type: 'command', command: 'echo preserved' }] }],
        PreToolUse: [{
          matcher: '^Bash$',
          hooks: [{
            type: 'command',
            command: 'node "/opt/local/warn-destructive.js"',
          }],
        }],
      },
    }));

    runSync(home);

    assert.ok(fs.existsSync(unrelatedSkill));
    assert.ok(fs.existsSync(unrelatedAgent));
    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
    assert.equal(hooks.hooks.Stop[0].hooks[0].command, 'echo preserved');
    assert.ok(hooks.hooks.PreToolUse.flatMap(group => group.hooks)
      .some(hook => hook.command === 'node "/opt/local/warn-destructive.js"'));
  });

  it('registers only the self-contained guardrail and removes exact legacy registrations', () => {
    const home = tempHome();
    const hooksPath = path.join(home, '.codex', 'hooks.json');
    fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
    fs.writeFileSync(hooksPath, JSON.stringify({
      hooks: {
        PreToolUse: [{
          matcher: '^Bash$',
          hooks: [
            'block-main-commit',
            'commit-lint',
            'warn-destructive',
          ].map(name => ({
            type: 'command',
            command: `node "$HOME/Code/bjornjee/agent-dashboard/adapters/codex/hooks/${name}.js"`,
          })),
        }],
      },
    }));

    runSync(home);

    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
    const commands = hooks.hooks.PreToolUse.flatMap(group => group.hooks)
      .map(hook => hook.command);
    assert.deepEqual(commands, ['node "$HOME/.codex/hooks/warn-destructive.js"']);
    assert.doesNotMatch(JSON.stringify(hooks), /agent-dashboard|block-main-commit|commit-lint/);
  });

  it('is idempotent and detects content or stale-file drift', () => {
    const home = tempHome();
    runSync(home);
    runSync(home);
    assert.doesNotThrow(() => runSync(home, '--check'));

    fs.appendFileSync(path.join(home, '.codex', 'AGENTS.md'), '\ndrift\n');
    const skill = path.join(home, '.agents', 'skills', 'terminal-ops');
    fs.writeFileSync(path.join(skill, 'stale.md'), 'stale\n');
    fs.chmodSync(path.join(home, '.codex', 'hooks', 'warn-destructive.js'), 0o644);

    const result = spawnSync(process.execPath, [SYNC, '--profile', 'local', '--check'], {
      cwd: REPO,
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /AGENTS\.md/);
    assert.match(result.stderr, /terminal-ops/);
    assert.match(result.stderr, /warn-destructive\.js/);
  });

  it('removes only stale payloads recorded in the ownership manifest', () => {
    const home = tempHome();
    runSync(home);

    const manifestPath = path.join(home, '.codex', 'bjornjee-skills-local-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.skills.push('retired-skill');
    manifest.agents.push('retired-agent');
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const retiredSkill = path.join(home, '.agents', 'skills', 'retired-skill');
    fs.mkdirSync(retiredSkill, { recursive: true });
    fs.writeFileSync(path.join(retiredSkill, 'SKILL.md'), '# retired\n');
    const retiredAgent = path.join(home, '.codex', 'agents', 'retired-agent.toml');
    fs.writeFileSync(retiredAgent, 'name = "retired-agent"\n');
    const unrelatedAgent = path.join(home, '.codex', 'agents', 'local-only.toml');
    fs.writeFileSync(unrelatedAgent, 'name = "local-only"\n');

    const check = spawnSync(process.execPath, [SYNC, '--profile', 'local', '--check'], {
      cwd: REPO,
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    });
    assert.equal(check.status, 1);
    assert.match(check.stderr, /retired-skill/);
    assert.match(check.stderr, /retired-agent/);

    runSync(home);
    assert.equal(fs.existsSync(retiredSkill), false);
    assert.equal(fs.existsSync(retiredAgent), false);
    assert.equal(fs.existsSync(unrelatedAgent), true);
    assert.doesNotThrow(() => runSync(home, '--check'));
  });

  it('rejects symlinks in the source payload before changing the destination', () => {
    const home = tempHome();
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-codex-payload-'));
    homes.push(fixture);
    fs.mkdirSync(path.join(fixture, 'scripts'), { recursive: true });
    fs.copyFileSync(SYNC, path.join(fixture, 'scripts', 'sync-codex.js'));
    fs.mkdirSync(path.join(fixture, 'skills', 'example'), { recursive: true });
    fs.writeFileSync(path.join(fixture, 'skills', 'example', 'SKILL.md'), '# example\n');
    fs.symlinkSync('SKILL.md', path.join(fixture, 'skills', 'example', 'linked.md'));
    fs.mkdirSync(path.join(fixture, '.codex'), { recursive: true });
    fs.writeFileSync(path.join(fixture, '.codex', 'AGENTS.md'), '# global\n');
    fs.mkdirSync(path.join(fixture, 'native-codex', 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(fixture, 'native-codex', 'hooks', 'warn-destructive.js'), '');
    fs.mkdirSync(path.join(fixture, 'agents'), { recursive: true });
    fs.writeFileSync(path.join(fixture, 'agents', 'reader.md'), [
      '---',
      'name: reader',
      'description: Reads files.',
      'tools: Read',
      '---',
      'Read files.',
      '',
    ].join('\n'));

    const result = spawnSync(process.execPath, [
      path.join(fixture, 'scripts', 'sync-codex.js'),
      '--profile',
      'local',
    ], {
      cwd: fixture,
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /payload cannot contain symlink/);
    assert.equal(fs.existsSync(path.join(home, '.codex')), false);
    assert.equal(fs.existsSync(path.join(home, '.agents')), false);
  });

  it('fails closed on an invalid existing hooks config before changing the destination', () => {
    const home = tempHome();
    const hooksPath = path.join(home, '.codex', 'hooks.json');
    fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
    fs.writeFileSync(hooksPath, '{not-json');

    const result = spawnSync(process.execPath, [SYNC, '--profile', 'local'], {
      cwd: REPO,
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /invalid Codex hooks config/);
    assert.equal(fs.existsSync(path.join(home, '.agents')), false);
    assert.equal(fs.existsSync(path.join(home, '.codex', 'AGENTS.md')), false);
    assert.equal(fs.readFileSync(hooksPath, 'utf8'), '{not-json');
  });

  it('rejects unsafe ownership manifest paths before changing the destination', () => {
    const home = tempHome();
    const manifestPath = path.join(home, '.codex', 'bjornjee-skills-manifest.json');
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify({
      version: 1,
      skills: ['../outside'],
      agents: [],
    }));

    const result = spawnSync(process.execPath, [SYNC, '--profile', 'local'], {
      cwd: REPO,
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unsafe skills name/);
    assert.equal(fs.existsSync(path.join(home, '.agents')), false);
    assert.equal(fs.existsSync(path.join(home, '.codex', 'AGENTS.md')), false);
  });

  it('rejects unknown arguments without changing the destination', () => {
    const home = tempHome();
    const result = spawnSync(process.execPath, [SYNC, '--profile', 'local', '--force'], {
      cwd: REPO,
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    });

    assert.equal(result.status, 2);
    assert.match(result.stderr, /usage: sync-codex\.js --profile <local\|cloud> \[--check\]/);
    assert.equal(fs.existsSync(path.join(home, '.codex')), false);
    assert.equal(fs.existsSync(path.join(home, '.agents')), false);
  });
});

describe('warn-destructive hook', () => {
  it('allows safe commands and force-with-lease', () => {
    for (const command of ['git status', 'git push --force-with-lease']) {
      const result = runHook(command);
      assert.equal(result.status, 0, result.stderr);
    }
  });

  it('blocks destructive commands, including long rm flags', () => {
    for (const command of [
      'rm -rf build',
      'rm --recursive --force build',
      'git reset --hard HEAD~1',
      'git push --force origin main',
      'DROP TABLE users',
    ]) {
      const result = runHook(command);
      assert.equal(result.status, 2, command);
      assert.match(result.stderr, /Blocked:/);
    }
  });

  it('fails closed on malformed hook input', () => {
    const result = spawnSync(process.execPath, [HOOK], {
      input: '{not-json',
      encoding: 'utf8',
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /invalid hook input/i);
  });
});
