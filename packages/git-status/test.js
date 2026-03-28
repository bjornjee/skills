'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

describe('packages/git-status', () => {
  describe('getChangedFiles', () => {
    it('returns empty array for null cwd', () => {
      const { getChangedFiles } = require('./index');
      assert.deepEqual(getChangedFiles(null), []);
      assert.deepEqual(getChangedFiles(''), []);
    });

    it('parses git diff output with correct prefixes', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      cp.spawnSync = () => ({
        status: 0,
        stdout: 'A\tsrc/new.js\nM\tsrc/old.js\nD\tsrc/removed.js\n',
      });

      delete require.cache[require.resolve('./index')];
      const { getChangedFiles } = require('./index');

      const files = getChangedFiles('/some/dir');
      assert.deepEqual(files, ['+src/new.js', '~src/old.js', '-src/removed.js']);

      cp.spawnSync = orig;
      delete require.cache[require.resolve('./index')];
    });

    it('handles renames', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      cp.spawnSync = () => ({
        status: 0,
        stdout: 'R100\told.js\tnew.js\n',
      });

      delete require.cache[require.resolve('./index')];
      const { getChangedFiles } = require('./index');

      const files = getChangedFiles('/some/dir');
      assert.deepEqual(files, ['~new.js']);

      cp.spawnSync = orig;
      delete require.cache[require.resolve('./index')];
    });

    it('returns empty array when git fails', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      cp.spawnSync = () => ({ status: 128, stdout: '' });

      delete require.cache[require.resolve('./index')];
      const { getChangedFiles } = require('./index');

      assert.deepEqual(getChangedFiles('/not/a/repo'), []);

      cp.spawnSync = orig;
      delete require.cache[require.resolve('./index')];
    });
  });

  describe('getBranch', () => {
    it('returns null for null cwd', () => {
      const { getBranch } = require('./index');
      assert.equal(getBranch(null), null);
    });

    it('returns branch name', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      cp.spawnSync = () => ({ status: 0, stdout: 'feat/auth\n' });

      delete require.cache[require.resolve('./index')];
      const { getBranch } = require('./index');

      assert.equal(getBranch('/some/dir'), 'feat/auth');

      cp.spawnSync = orig;
      delete require.cache[require.resolve('./index')];
    });

    it('returns null when git fails', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      cp.spawnSync = () => ({ status: 128, stdout: '' });

      delete require.cache[require.resolve('./index')];
      const { getBranch } = require('./index');

      assert.equal(getBranch('/not/a/repo'), null);

      cp.spawnSync = orig;
      delete require.cache[require.resolve('./index')];
    });
  });
});
