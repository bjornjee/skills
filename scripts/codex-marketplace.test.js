#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function skillNames(root) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function relativeFiles(root) {
  const entries = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        entries.push(path.relative(root, fullPath));
      }
    }
  }

  walk(root);
  return entries.sort();
}

describe('codex marketplace', () => {
  it('uses a non-root plugin source path with a Codex manifest', () => {
    const marketplace = readJson(path.join(REPO, '.agents/plugins/marketplace.json'));
    const plugin = marketplace.plugins.find(entry => entry.name === 'skills');
    assert.ok(plugin, 'skills plugin entry should exist');
    assert.equal(plugin.source.source, 'local');
    assert.equal(plugin.source.path, './plugins/skills');

    const pluginRoot = path.join(REPO, plugin.source.path);
    assert.equal(fs.existsSync(path.join(pluginRoot, '.codex-plugin/plugin.json')), true);
  });

  it('packages skills inside the Codex plugin root', () => {
    const manifest = readJson(path.join(REPO, 'plugins/skills/.codex-plugin/plugin.json'));
    assert.equal(manifest.name, 'skills');
    assert.equal(manifest.skills, './skills/');
    assert.equal(manifest.skills.includes('..'), false);

    const skillsRoot = path.resolve(REPO, 'plugins/skills', manifest.skills);
    assert.equal(fs.existsSync(path.join(skillsRoot, 'search-first/SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(skillsRoot, 'terminal-ops/SKILL.md')), true);
  });

  it('keeps the packaged Codex skills in sync with the top-level skills', () => {
    const packagedSkills = path.join(REPO, 'plugins/skills/skills');
    const topLevelSkills = path.join(REPO, 'skills');

    assert.deepEqual(
      skillNames(packagedSkills),
      skillNames(topLevelSkills),
    );

    for (const relativeFile of relativeFiles(topLevelSkills)) {
      assert.equal(
        fs.readFileSync(path.join(packagedSkills, relativeFile), 'utf8'),
        fs.readFileSync(path.join(topLevelSkills, relativeFile), 'utf8'),
        `${relativeFile} should match the top-level skill copy`,
      );
    }
  });

  it('uses a single Codex manifest under the packaged plugin root', () => {
    assert.equal(fs.existsSync(path.join(REPO, '.codex-plugin/plugin.json')), false);
  });

  it('has an idempotent sync check for the packaged Codex skills', () => {
    childProcess.execFileSync(
      path.join(REPO, 'scripts/sync-codex-plugin.sh'),
      ['--check'],
      { stdio: 'pipe' },
    );
  });
});
