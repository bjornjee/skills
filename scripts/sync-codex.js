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
const MANIFEST_VERSION = 1;
const HOOK_COMMAND = 'node "$HOME/.codex/hooks/warn-destructive.js"';
// Migration-only commands written by earlier releases; none are installed.
const LEGACY_HOOK_COMMANDS = new Set([
  'block-main-commit',
  'commit-lint',
  'warn-destructive',
].map(name => `node "$HOME/Code/bjornjee/agent-dashboard/adapters/codex/hooks/${name}.js"`));

if (unknownArgs.length > 0) {
  process.stderr.write('usage: sync-codex.js [--check]\n');
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

function sameFile(source, destination, mode) {
  const stat = lstatOrNull(destination);
  if (!stat) return false;
  if (!stat.isFile() || stat.isSymbolicLink()) return false;
  if (mode !== undefined && (stat.mode & 0o777) !== mode) return false;
  return fs.readFileSync(source).equals(fs.readFileSync(destination));
}

function sameTree(source, destination, sourceFiles) {
  if (!lstatOrNull(destination)) return false;
  try {
    const destinationFiles = listFiles(destination);
    if (sourceFiles.length !== destinationFiles.length) return false;
    return sourceFiles.every((relative, index) => (
      relative === destinationFiles[index]
      && sameFile(path.join(source, relative), path.join(destination, relative))
    ));
  } catch {
    return false;
  }
}

function copyFile(source, destination, mode) {
  if (CHECK) {
    if (!sameFile(source, destination, mode)) drift.push(destination);
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const stat = lstatOrNull(destination);
  if (stat && (!stat.isFile() || stat.isSymbolicLink())) {
    fs.rmSync(destination, { recursive: true, force: true });
  }
  fs.copyFileSync(source, destination);
  if (mode !== undefined) fs.chmodSync(destination, mode);
}

function copyTree(source, destination, sourceFiles) {
  if (CHECK) {
    if (!sameTree(source, destination, sourceFiles)) drift.push(destination);
    return;
  }

  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  for (const relative of sourceFiles) {
    const sourceFile = path.join(source, relative);
    const destinationFile = path.join(destination, relative);
    fs.mkdirSync(path.dirname(destinationFile), { recursive: true });
    fs.copyFileSync(sourceFile, destinationFile);
    fs.chmodSync(destinationFile, fs.statSync(sourceFile).mode & 0o777);
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
    const stat = lstatOrNull(destination);
    if (!stat
      || !stat.isFile()
      || stat.isSymbolicLink()
      || fs.readFileSync(destination, 'utf8') !== content) {
      drift.push(destination);
    }
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const stat = lstatOrNull(destination);
  if (stat && (!stat.isFile() || stat.isSymbolicLink())) {
    fs.rmSync(destination, { recursive: true, force: true });
  }
  fs.writeFileSync(destination, content);
}

function readManifest(manifestPath) {
  const stat = lstatOrNull(manifestPath);
  if (!stat) {
    return { version: MANIFEST_VERSION, skills: [], agents: [] };
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
    || manifest.version !== MANIFEST_VERSION
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

const codexHome = path.join(HOME, '.codex');
const hooksPath = path.join(codexHome, 'hooks.json');
const manifestPath = path.join(codexHome, 'bjornjee-skills-manifest.json');
const hooksContent = desiredHooks(hooksPath);
const previousManifest = readManifest(manifestPath);
const agentNames = agents.map(agent => agent.name);
const manifestContent = `${JSON.stringify({
  version: MANIFEST_VERSION,
  skills: skillNames,
  agents: agentNames,
}, null, 2)}\n`;

const skillsDestination = path.join(HOME, '.agents', 'skills');
const staleSkills = previousManifest.skills.filter(name => !skillNames.includes(name));
const staleAgents = previousManifest.agents.filter(name => !agentNames.includes(name));
for (const name of staleSkills) {
  const destination = path.join(skillsDestination, name);
  if (CHECK) {
    if (lstatOrNull(destination)) drift.push(destination);
  } else {
    fs.rmSync(destination, { recursive: true, force: true });
  }
}
for (const name of staleAgents) {
  const destination = path.join(codexHome, 'agents', `${name}.toml`);
  if (CHECK) {
    if (lstatOrNull(destination)) drift.push(destination);
  } else {
    fs.rmSync(destination, { recursive: true, force: true });
  }
}
for (const payload of skillPayloads) {
  copyTree(payload.source, path.join(skillsDestination, payload.name), payload.files);
}

copyFile(globalRulesSource, path.join(codexHome, 'AGENTS.md'));
copyFile(hookSource, path.join(codexHome, 'hooks', 'warn-destructive.js'), 0o755);
writeGenerated(hooksContent, hooksPath);
for (const agent of agents) {
  writeGenerated(agent.content, path.join(codexHome, 'agents', `${agent.name}.toml`));
}
writeGenerated(manifestContent, manifestPath);

if (CHECK && drift.length > 0) {
  drift.sort();
  process.stderr.write(`Codex drift:\n${drift.map(file => `- ${file}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(
  CHECK
    ? `ok: ${skillNames.length} skills, rules, safety hook, and agents are synced\n`
    : `synced: ${skillNames.length} skills, rules, safety hook, and agents\n`,
);
