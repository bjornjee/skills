#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

describe('workflow doctrine', () => {
  it('uses proportional proof instead of blanket TDD/full-suite loops', () => {
    const codex = read('.codex/AGENTS.md');
    const claude = read('.claude/rules/core.md');
    const project = read('AGENTS.md');
    const terminalOps = read('skills/terminal-ops/SKILL.md');

    for (const [label, text] of [
      ['codex', codex],
      ['claude', claude],
      ['project', project],
    ]) {
      assert.match(text, /proportional proof/i, `${label} doctrine must name proportional proof`);
      assert.match(text, /Surgical[\s\S]*Targeted[\s\S]*Full/, `${label} doctrine must define verification profiles`);
      assert.match(text, /smallest relevant|smallest command|scoped commands/, `${label} doctrine must prefer scoped proof`);
    }

    assert.match(terminalOps, /Do not run `make test`, `make fmt`, or equivalent whole-repo commands by reflex/);
    assert.doesNotMatch(project, /TDD\. Write a failing test\. Make it pass\. Clean up\. Run tests after every change\./);
  });

  it('keeps Claude plugin version metadata in sync', () => {
    const plugin = readJson('.claude-plugin/plugin.json');
    const marketplace = readJson('.claude-plugin/marketplace.json');
    const entry = marketplace.plugins.find(item => item.name === 'skills');

    assert.ok(entry, 'marketplace must contain skills plugin');
    assert.equal(entry.version, plugin.version);
  });
});
