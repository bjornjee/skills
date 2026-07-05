#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const README = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8');

// README tables were hand-edited 11+ times in history and drifted repeatedly
// (4 skills and 2 agents missing at the last audit). Set-equality against the
// filesystem turns table maintenance into a red test instead of review toil.

function tableNames(regex) {
  const names = new Set();
  for (const match of README.matchAll(regex)) names.add(match[1]);
  return names;
}

function diskNames(entries) {
  return new Set(entries);
}

function assertSetEqual(actual, expected, label) {
  const missing = [...expected].filter(n => !actual.has(n));
  const ghosts = [...actual].filter(n => !expected.has(n));
  assert.deepEqual(
    { missing, ghosts },
    { missing: [], ghosts: [] },
    `${label}: README table out of sync with disk (missing = on disk but not in README; ghosts = in README but not on disk)`,
  );
}

describe('README tables match the filesystem', () => {
  it('skills table lists exactly the skills/ directories', () => {
    const inReadme = tableNames(/^\| `\/([a-z0-9-]+)` \|/gm);
    const onDisk = diskNames(
      fs.readdirSync(path.join(REPO, 'skills'), { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name),
    );
    assertSetEqual(inReadme, onDisk, 'skills');
  });

  it('agents table lists exactly the agents/*.md files', () => {
    // Agent rows use backticked names without a leading slash; scope to the
    // Agents section to avoid matching rule rows.
    const section = README.split('## Agents')[1].split('## Rules')[0];
    const inReadme = new Set([...section.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map(m => m[1]));
    const onDisk = diskNames(
      fs.readdirSync(path.join(REPO, 'agents'))
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace(/\.md$/, '')),
    );
    assertSetEqual(inReadme, onDisk, 'agents');
  });

  it('rules table lists exactly the .claude/rules/*.md files', () => {
    const section = README.split('## Rules')[1].split('## Codex Setup')[0];
    const inReadme = new Set([...section.matchAll(/^\| `([a-z0-9.-]+\.md)` \|/gm)].map(m => m[1]));
    const onDisk = diskNames(
      fs.readdirSync(path.join(REPO, '.claude/rules'))
        .filter(f => f.endsWith('.md')),
    );
    assertSetEqual(inReadme, onDisk, 'rules');
  });
});
