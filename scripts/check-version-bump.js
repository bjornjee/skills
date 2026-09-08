#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const base = process.argv[2];
if (!base || process.argv.length !== 3) {
  process.stderr.write('usage: check-version-bump.js <base-revision>\n');
  process.exit(2);
}
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
const revision = git(['rev-parse', '--verify', '--end-of-options', `${base}^{commit}`]);
const paths = [git(['diff', '--name-only', revision, '--']), git(['ls-files', '--others', '--exclude-standard'])].join('\n');
if (paths.split('\n').some(filename => /^(skills\/|agents\/|native-codex\/|\.claude\/rules\/|\.codex\/AGENTS\.md$|\.codex-plugin\/|\.agents\/plugins\/|scripts\/sync-codex\.js$)/.test(filename))) {
  const previous = JSON.parse(git(['show', `${revision}:.claude-plugin/plugin.json`])).version;
  const current = JSON.parse(fs.readFileSync('.claude-plugin/plugin.json', 'utf8')).version;
  if (![previous, current].every(version => typeof version === 'string' && /^\d+\.\d+\.\d+$/.test(version))) throw new Error('invalid plugin semver');
  const before = previous.split('.').map(Number);
  const after = current.split('.').map(Number);
  const difference = after.findIndex((part, index) => part !== before[index]);
  if (difference === -1 || after[difference] < before[difference]) {
    process.stderr.write(`version must increase for changed skills/rules/plugin: ${previous} -> ${current}\n`);
    process.exitCode = 1;
  } else process.stdout.write(`ok: plugin version ${previous} -> ${current}\n`);
} else process.stdout.write('ok: no versioned payload changes\n');
