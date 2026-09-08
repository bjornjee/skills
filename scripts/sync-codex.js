#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const { createHash, randomUUID } = require('node:crypto');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const HOME = os.homedir();
const CHECK = process.argv.includes('--check');
const unknownArgs = process.argv.slice(2).filter(arg => arg !== '--check');
const drift = [];
const MANIFEST_VERSION = 2;
const HOOK_COMMAND = 'node "${CODEX_HOME:-$HOME/.codex}/hooks/warn-destructive.js"';
// Migration-only commands written by earlier releases; none are installed.
const LEGACY_HOOK_COMMANDS = new Set([
  'warn-destructive',
].map(name => `node "$HOME/Code/bjornjee/agent-dashboard/adapters/codex/hooks/${name}.js"`));
LEGACY_HOOK_COMMANDS.add('node "$HOME/.codex/hooks/warn-destructive.js"');

if (unknownArgs.length > 0) {
  process.stderr.write('usage: sync-codex.js [--check]\n');
  process.exit(2);
}
if (process.env.CODEX_HOME && !path.isAbsolute(process.env.CODEX_HOME)) {
  process.stderr.write('CODEX_HOME must be an absolute path; unset it to use ~/.codex\n');
  process.exit(2);
}

function assertDirectory(directory) {
  const stat = fs.lstatSync(directory);
  if (stat.isSymbolicLink()) {
    throw new Error(`Codex payload cannot contain symlink: ${directory}`);
  }
  if (!stat.isDirectory()) throw new Error(`Codex payload requires directory: ${directory}`);
}

function assertRegularFile(filename) {
  const stat = fs.lstatSync(filename);
  if (stat.isSymbolicLink()) {
    throw new Error(`Codex payload cannot contain symlink: ${filename}`);
  }
  if (!stat.isFile()) throw new Error(`Codex payload requires regular file: ${filename}`);
}

function listFiles(root) {
  assertDirectory(root);
  const files = [];

  function visit(directory, relative) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name))) {
      const source = path.join(directory, entry.name);
      const childRelative = path.join(relative, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Codex payload cannot contain symlink: ${source}`);
      }
      if (entry.isDirectory()) visit(source, childRelative);
      else if (entry.isFile()) files.push(childRelative);
      else throw new Error(`Codex payload requires regular file: ${source}`);
    }
  }

  visit(root, '');
  return files;
}

function lstatOrNull(filename) {
  try {
    return fs.lstatSync(filename);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function parseAgent(source) {
  const content = fs.readFileSync(source, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`invalid agent frontmatter: ${source}`);

  const metadata = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const value = line.slice(separator + 1).trim();
    // Canonical agent metadata uses plain or JSON-compatible quoted scalars.
    metadata[line.slice(0, separator).trim()] = value.startsWith('"') ? JSON.parse(value) : value;
  }
  if (typeof metadata.name !== 'string' || !metadata.name
    || typeof metadata.description !== 'string' || !metadata.description
    || (metadata.tools !== undefined && typeof metadata.tools !== 'string')) {
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

function readManifest(manifestPath) {
  const stat = lstatOrNull(manifestPath);
  if (!stat) {
    return { version: MANIFEST_VERSION, skills: [], agents: [], files: {} };
  }
  if (stat.isSymbolicLink()) {
    throw new Error(`refusing symlinked Codex sync manifest: ${manifestPath}`);
  }
  if (!stat.isFile()) throw new Error('invalid Codex sync manifest: must be a file');

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`invalid Codex sync manifest: ${error.message}`);
  }
  if (!manifest || Array.isArray(manifest) || typeof manifest !== 'object'
    || ![1, MANIFEST_VERSION].includes(manifest.version)
    || !Array.isArray(manifest.skills)
    || !Array.isArray(manifest.agents)) {
    throw new Error('invalid Codex sync manifest: unsupported schema');
  }

  for (const [key, names] of [['skills', manifest.skills], ['agents', manifest.agents]]) {
    if (new Set(names).size !== names.length
      || names.some(name => typeof name !== 'string'
        || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name))) {
      throw new Error(`invalid Codex sync manifest: unsafe ${key} name`);
    }
  }
  if (manifest.version === 1) manifest.files = {}; // Directory ownership cannot authorize file deletion.
  if (!manifest.files || Array.isArray(manifest.files) || typeof manifest.files !== 'object') {
    throw new Error('invalid Codex sync manifest: files must be an object');
  }
  for (const [key, value] of Object.entries(manifest.files)) {
    if (!/^(skills|codex)\//.test(key) || key.split('/').some(part => !part || part === '.' || part === '..')
      || key.includes('\\') || !value || !/^[a-f0-9]{64}$/.test(value.sha256)
      || !Number.isInteger(value.mode) || value.mode < 0 || value.mode > 0o777
      || (key.startsWith('skills/') ? key.split('/').length < 3
        : !(key === 'codex/AGENTS.md' || key === 'codex/hooks/warn-destructive.js'
          || /^codex\/agents\/[A-Za-z0-9][A-Za-z0-9._-]*\.toml$/.test(key)))) {
      throw new Error('invalid Codex sync manifest: unsafe managed file');
    }
  }
  return manifest;
}

function desiredHooks(hooksPath) {
  let config = { hooks: {} };
  const stat = lstatOrNull(hooksPath);
  if (stat) {
    if (stat.isSymbolicLink()) {
      throw new Error(`refusing symlinked Codex hooks config: ${hooksPath}`);
    }
    if (!stat.isFile()) throw new Error('invalid Codex hooks config: must be a file');
    try {
      config = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
    } catch (error) {
      throw new Error(`invalid Codex hooks config: ${error.message}`);
    }
  }
  if (!config || Array.isArray(config) || typeof config !== 'object') {
    throw new Error('invalid Codex hooks config: root must be an object');
  }
  if (config.hooks === undefined) config.hooks = {};
  if (!config.hooks || Array.isArray(config.hooks) || typeof config.hooks !== 'object') {
    throw new Error('invalid Codex hooks config: hooks must be an object');
  }

  for (const [event, groups] of Object.entries(config.hooks)) {
    if (!Array.isArray(groups)) {
      throw new Error(`invalid Codex hooks config: ${event} must be an array`);
    }
    config.hooks[event] = groups.map((group, index) => {
      if (!group || Array.isArray(group) || typeof group !== 'object'
        || !Array.isArray(group.hooks)) {
        throw new Error(`invalid Codex hooks config: ${event}[${index}].hooks must be an array`);
      }
      return {
        ...group,
        hooks: group.hooks.filter(hook => {
          const command = String(hook && typeof hook === 'object' ? hook.command || '' : '');
          return command !== HOOK_COMMAND && !LEGACY_HOOK_COMMANDS.has(command);
        }),
      };
    }).filter(group => group.hooks.length > 0);
  }

  config.hooks.PreToolUse ||= [];
  config.hooks.PreToolUse.push({
    matcher: '^Bash$',
    hooks: [{
      type: 'command',
      command: HOOK_COMMAND,
      timeout: 5,
      statusMessage: 'Checking destructive commands',
    }],
  });
  return `${JSON.stringify(config, null, 2)}\n`;
}

const skillsSource = path.join(REPO, 'skills');
const agentsSource = path.join(REPO, 'agents');
const globalRulesSource = path.join(REPO, '.codex', 'AGENTS.md');
const hookSource = path.join(REPO, 'native-codex', 'hooks', 'warn-destructive.js');

// Preflight the complete managed source payload before writing anything.
assertDirectory(skillsSource);
const allSkillEntries = fs.readdirSync(skillsSource, { withFileTypes: true })
  .sort((left, right) => left.name.localeCompare(right.name));
for (const entry of allSkillEntries) {
  if (entry.isSymbolicLink()) {
    throw new Error(`Codex payload cannot contain symlink: ${path.join(skillsSource, entry.name)}`);
  }
}
const skillPayloads = allSkillEntries
  .filter(entry => entry.isDirectory())
  .map(entry => {
    const source = path.join(skillsSource, entry.name);
    return { name: entry.name, source, files: listFiles(source) };
  })
  .filter(payload => payload.files.includes('SKILL.md'));
const skillNames = skillPayloads.map(payload => payload.name);

assertDirectory(path.join(REPO, '.codex'));
assertRegularFile(globalRulesSource);
assertDirectory(path.join(REPO, 'native-codex'));
assertDirectory(path.join(REPO, 'native-codex', 'hooks'));
assertRegularFile(hookSource);
const agentFiles = listFiles(agentsSource)
  .filter(filename => path.extname(filename) === '.md');
const agents = agentFiles.map(filename => {
  const source = path.join(agentsSource, filename);
  return {
    name: path.basename(filename, '.md'),
    content: parseAgent(source),
  };
});

const codexHome = path.resolve(process.env.CODEX_HOME || path.join(HOME, '.codex'));
const skillsDestination = path.join(HOME, '.agents', 'skills');
const hooksPath = path.join(codexHome, 'hooks.json');
const manifestPath = path.join(codexHome, 'bjornjee-skills-manifest.json');
const lockPath = path.join(codexHome, '.bjornjee-skills-sync');

function assertParents(filename) {
  let current = path.dirname(filename);
  while (current !== path.dirname(current)) {
    const stat = lstatOrNull(current);
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) {
      throw new Error(`unsafe destination parent: ${current}`);
    }
    current = path.dirname(current);
  }
}

function snapshot(filename) {
  assertParents(filename);
  const stat = lstatOrNull(filename);
  if (!stat) return null;
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`unsafe destination: ${filename}`);
  return { content: fs.readFileSync(filename), mode: stat.mode & 0o777 };
}

function fingerprint(value) {
  return { sha256: createHash('sha256').update(value.content).digest('hex'), mode: value.mode };
}

function equal(left, right) {
  return left === null || right === null ? left === right
    : left.mode === right.mode && left.content.equals(right.content);
}

function destination(key) {
  const [root, ...parts] = key.split('/');
  return path.join(root === 'skills' ? skillsDestination : codexHome, ...parts);
}

function sourceFile(filename, mode) {
  return { content: fs.readFileSync(filename), mode: mode ?? (fs.statSync(filename).mode & 0o777) };
}

// Only the finite source payload and previously recorded files are inspected.
// Unowned siblings are never scanned or removed.
const desired = new Map();
for (const payload of skillPayloads) {
  for (const relative of payload.files) {
    desired.set(`skills/${payload.name}/${relative.split(path.sep).join('/')}`,
      sourceFile(path.join(payload.source, relative)));
  }
}
desired.set('codex/AGENTS.md', sourceFile(globalRulesSource));
desired.set('codex/hooks/warn-destructive.js', sourceFile(hookSource, 0o755));
for (const agent of agents) {
  desired.set(`codex/agents/${agent.name}.toml`, { content: Buffer.from(agent.content), mode: 0o644 });
}

assertParents(manifestPath);
assertParents(hooksPath);
if (lstatOrNull(lockPath)) throw new Error(`sync already active or interrupted; inspect recovery journal: ${lockPath}`);
const previousManifest = readManifest(manifestPath);
const changes = [];
const files = {};
for (const key of new Set([...desired.keys(), ...Object.keys(previousManifest.files)])) {
  const target = destination(key);
  const before = snapshot(target);
  const after = desired.get(key) || null;
  const owned = previousManifest.files[key];
  if (after) files[key] = fingerprint(after);
  if (equal(before, after)) continue;
  if (CHECK) {
    drift.push(target);
    continue;
  }
  if (before && (!owned || JSON.stringify(fingerprint(before)) !== JSON.stringify(owned))) {
    throw new Error(`sync conflict: ${target}; preserve/reconcile this file before retrying`);
  }
  changes.push({ target, before, after });
}

// Shared hook config is merged, never treated as exclusively owned.
const hooksBefore = snapshot(hooksPath);
const hooksAfter = { content: Buffer.from(desiredHooks(hooksPath)), mode: hooksBefore?.mode ?? 0o600 };
const manifestBefore = snapshot(manifestPath);
const manifestAfter = {
  content: Buffer.from(`${JSON.stringify({
    version: MANIFEST_VERSION,
    source: { path: REPO, payload_sha256: createHash('sha256').update(JSON.stringify(files)).digest('hex') },
    skills: skillNames,
    agents: agents.map(agent => agent.name),
    files,
  }, null, 2)}\n`),
  mode: 0o600,
};
for (const change of [
  { target: hooksPath, before: hooksBefore, after: hooksAfter },
  { target: manifestPath, before: manifestBefore, after: manifestAfter },
]) {
  if (!equal(change.before, change.after)) {
    if (CHECK) drift.push(change.target);
    else changes.push(change);
  }
}

if (CHECK) {
  if (drift.length) {
    process.stderr.write(`Codex drift:\n${drift.sort().map(file => `- ${file}`).join('\n')}\n`);
    process.exitCode = 1;
  } else process.stdout.write(`ok: ${skillNames.length} skills, rules, safety hook, and agents are synced\n`);
} else if (changes.length) {
  // A persistent exclusive directory also stops a later run after process death.
  fs.mkdirSync(codexHome, { recursive: true });
  fs.mkdirSync(lockPath, { mode: 0o700 });
  const applied = [];
  let recovered = false;
  function replace(target, value) {
    if (value === null) {
      fs.unlinkSync(target);
      return;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const staged = `${target}.sync-${randomUUID()}`;
    try {
      fs.writeFileSync(staged, value.content, { mode: 0o600, flag: 'wx' });
      fs.chmodSync(staged, value.mode);
      fs.renameSync(staged, target);
    } finally {
      if (lstatOrNull(staged)) fs.unlinkSync(staged);
    }
  }
  try {
    // Recheck under the lock: no destination may have changed since preflight.
    for (const change of changes) {
      if (!equal(snapshot(change.target), change.before)) throw new Error(`destination changed: ${change.target}`);
    }
    fs.writeFileSync(path.join(lockPath, 'recovery.json'), JSON.stringify(changes.map(change => ({
      target: change.target,
      before: change.before && { content_base64: change.before.content.toString('base64'), mode: change.before.mode },
    }))), { mode: 0o600 });
    for (const change of changes) {
      replace(change.target, change.after);
      applied.push(change);
    }
    recovered = true;
  } catch (error) {
    for (const change of applied.reverse()) replace(change.target, change.before);
    recovered = true;
    throw error;
  } finally {
    if (recovered) fs.rmSync(lockPath, { recursive: true });
  }
  process.stdout.write(`synced: ${skillNames.length} skills, rules, safety hook, and agents\n`);
} else process.stdout.write('ok: no changes needed\n');
