#!/usr/bin/env node
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const REPO = path.resolve(__dirname, '..');
const readJson = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));

describe('codex marketplace', () => {
  it('resolves a self-contained repository-root package', () => {
    const marketplace = readJson(path.join(REPO, '.agents/plugins/marketplace.json'));
    const entry = marketplace.plugins.find(plugin => plugin.name === 'skills');
    assert.equal(entry.source.source, 'local');
    assert.equal(entry.source.path, './');
    const root = path.resolve(REPO, entry.source.path);
    const manifest = readJson(path.join(root, '.codex-plugin/plugin.json'));
    assert.equal(manifest.skills, './skills/');
    assert.equal(fs.lstatSync(path.join(root, manifest.skills)).isSymbolicLink(), false);
  });

  it('loads every bundled skill in an isolated package without the source checkout', () => {
    const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-package-'));
    try {
      // Copy exactly the package components, without dereferencing escaping links.
      const root = path.resolve(REPO, readJson(path.join(REPO, '.agents/plugins/marketplace.json')).plugins[0].source.path);
      for (const component of ['.codex-plugin', 'skills']) {
        fs.cpSync(path.join(root, component), path.join(isolated, component), { recursive: true, verbatimSymlinks: true });
      }
      const manifest = readJson(path.join(isolated, '.codex-plugin/plugin.json'));
      const skills = path.join(isolated, manifest.skills);
      for (const name of fs.readdirSync(path.join(REPO, 'skills'))) {
        assert.ok(fs.existsSync(path.join(skills, name, 'SKILL.md')), `missing packaged skill ${name}`);
      }
      function inspect(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const filename = path.join(directory, entry.name);
          assert.equal(entry.isSymbolicLink(), false, `package link: ${filename}`);
          if (entry.isDirectory()) inspect(filename);
        }
      }
      inspect(isolated);
    } finally {
      fs.rmSync(isolated, { recursive: true, force: true });
    }
  });

  it('keeps three manifest versions in lockstep', () => {
    const claude = readJson(path.join(REPO, '.claude-plugin/plugin.json'));
    const marketplace = readJson(path.join(REPO, '.claude-plugin/marketplace.json'));
    const codex = readJson(path.join(REPO, '.codex-plugin/plugin.json'));
    assert.equal(marketplace.plugins.find(entry => entry.name === 'skills').version, claude.version);
    assert.equal(codex.version, claude.version);
    assert.equal(fs.existsSync(path.join(REPO, 'plugins/skills/.codex-plugin/plugin.json')), false);
  });
});
