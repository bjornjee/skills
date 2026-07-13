#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const HOME = os.homedir();
const CHECK = process.argv.includes('--check');
const unknownArgs = process.argv.slice(2).filter(arg => arg !== '--check');
const drift = [];
const agentDashboardHooks = path.join(
  HOME,
  'Code',
  'bjornjee',
  'agent-dashboard',
  'adapters',
  'codex',
  'hooks',
);
const HOOKS = [
  ['block-main-commit', 'Blocking commits on main'],
  ['commit-lint', 'Validating commit message'],
  ['warn-destructive', 'Checking destructive commands'],
];

if (unknownArgs.length > 0) {
  process.stderr.write('usage: sync-codex.js [--check]\n');
  process.exit(2);
}

function assertNoSymlinks(root) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Codex payload cannot contain symlink: ${entryPath}`);
    }
    if (entry.isDirectory()) assertNoSymlinks(entryPath);
  }
}

function sameFile(source, destination) {
  if (!fs.existsSync(destination) || fs.lstatSync(destination).isSymbolicLink()) return false;
  return fs.readFileSync(source).equals(fs.readFileSync(destination));
}

function copyFile(source, destination, mode) {
  if (CHECK) {
    if (!sameFile(source, destination)) drift.push(destination);
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) {
    fs.unlinkSync(destination);
  }
  fs.copyFileSync(source, destination);
  if (mode !== undefined) fs.chmodSync(destination, mode);
}

function copyTree(source, destination) {
  assertNoSymlinks(source);
  if (CHECK) {
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
      const sourcePath = path.join(source, entry.name);
      const destinationPath = path.join(destination, entry.name);
      if (entry.isDirectory()) copyTree(sourcePath, destinationPath);
      else if (!sameFile(sourcePath, destinationPath)) drift.push(destinationPath);
    }
    return;
  }

  if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) {
    fs.unlinkSync(destination);
  }
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true, dereference: true });
}

function parseAgent(source) {
  const content = fs.readFileSync(source, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`invalid agent frontmatter: ${source}`);

  const metadata = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    metadata[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  if (!metadata.name || !metadata.description) {
    throw new Error(`agent requires name and description: ${source}`);
  }

  const lines = [
    `name = ${JSON.stringify(metadata.name)}`,
    `description = ${JSON.stringify(metadata.description)}`,
    `developer_instructions = ${JSON.stringify(match[2].trim())}`,
  ];
  if (!/(^|,\s*)(Write|Edit)(,|$)/.test(metadata.tools || '')) {
    lines.push('sandbox_mode = "read-only"');
  }
  return `${lines.join('\n')}\n`;
}

function writeGenerated(content, destination) {
  if (CHECK) {
    if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== content) {
      drift.push(destination);
    }
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}

function syncHooks(codexHome) {
  const hooksPath = path.join(codexHome, 'hooks.json');
  let config = { hooks: {} };
  if (fs.existsSync(hooksPath)) config = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
  config.hooks ||= {};

  const managedNames = HOOKS.map(([name]) => `${name}.js`);
  for (const [event, groups] of Object.entries(config.hooks)) {
    config.hooks[event] = groups.map(group => ({
      ...group,
      hooks: (group.hooks || []).filter(hook => (
        !managedNames.some(name => String(hook.command || '').includes(name))
      )),
    })).filter(group => group.hooks.length > 0);
  }

  config.hooks.PreToolUse ||= [];
  config.hooks.PreToolUse.push({
    matcher: '^Bash$',
    hooks: HOOKS.map(([name, statusMessage]) => ({
      type: 'command',
      command: `node "$HOME/Code/bjornjee/agent-dashboard/adapters/codex/hooks/${name}.js"`,
      timeout: 5,
      statusMessage,
    })),
  });

  writeGenerated(`${JSON.stringify(config, null, 2)}\n`, hooksPath);
}

const skillsSource = path.join(REPO, 'skills');
const skillsDestination = path.join(HOME, '.agents', 'skills');
const skillNames = fs.readdirSync(skillsSource)
  .filter(name => fs.existsSync(path.join(skillsSource, name, 'SKILL.md')))
  .sort();
for (const name of skillNames) {
  copyTree(path.join(skillsSource, name), path.join(skillsDestination, name));
}

const codexHome = path.join(HOME, '.codex');
copyFile(path.join(REPO, '.codex', 'AGENTS.md'), path.join(codexHome, 'AGENTS.md'));
for (const [name] of HOOKS) {
  const source = path.join(agentDashboardHooks, `${name}.js`);
  if (!fs.existsSync(source)) throw new Error(`missing agent-dashboard hook: ${source}`);

  const legacyCopy = path.join(codexHome, 'hooks', `${name}.js`);
  if (CHECK) {
    if (fs.existsSync(legacyCopy)) drift.push(legacyCopy);
  } else if (fs.existsSync(legacyCopy)) {
    fs.unlinkSync(legacyCopy);
  }
}
syncHooks(codexHome);

const agentsSource = path.join(REPO, 'agents');
for (const filename of fs.readdirSync(agentsSource).filter(name => name.endsWith('.md')).sort()) {
  const source = path.join(agentsSource, filename);
  const agent = parseAgent(source);
  const name = path.basename(filename, '.md');
  writeGenerated(agent, path.join(codexHome, 'agents', `${name}.toml`));
}

if (CHECK && drift.length > 0) {
  process.stderr.write(`Codex drift:\n${drift.map(file => `- ${file}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(
  CHECK
    ? `ok: ${skillNames.length} skills, rules, 3 guardrail hooks, and agents are synced\n`
    : `synced: ${skillNames.length} skills, rules, 3 guardrail hooks, and agents\n`,
);
