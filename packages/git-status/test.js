'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

describe('packages/git-status', () => {
  describe('findMergeBase', () => {
    it('returns merge-base commit hash when main exists', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      cp.spawnSync = (cmd, args) => {
        if (args.includes('merge-base') && args.includes('main')) {
          return { status: 0, stdout: 'abc123\n' };
        }
        return { status: 128, stdout: '' };
      };

      delete require.cache[require.resolve('./index')];
      const { findMergeBase } = require('./index');

      assert.equal(findMergeBase('/some/dir'), 'abc123');

      cp.spawnSync = orig;
      delete require.cache[require.resolve('./index')];
    });

    it('falls back to master when main does not exist', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      cp.spawnSync = (cmd, args) => {
        if (args.includes('merge-base') && args.includes('main')) {
          return { status: 128, stdout: '' };
        }
        if (args.includes('merge-base') && args.includes('master')) {
          return { status: 0, stdout: 'def456\n' };
        }
        return { status: 128, stdout: '' };
      };

      delete require.cache[require.resolve('./index')];
      const { findMergeBase } = require('./index');

      assert.equal(findMergeBase('/some/dir'), 'def456');

      cp.spawnSync = orig;
      delete require.cache[require.resolve('./index')];
    });

    it('returns null when neither main nor master exists', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      cp.spawnSync = () => ({ status: 128, stdout: '' });

      delete require.cache[require.resolve('./index')];
      const { findMergeBase } = require('./index');

      assert.equal(findMergeBase('/some/dir'), null);

      cp.spawnSync = orig;
      delete require.cache[require.resolve('./index')];
    });
  });

  describe('getChangedFiles', () => {
    it('returns empty array for null cwd', () => {
      const { getChangedFiles } = require('./index');
      assert.deepEqual(getChangedFiles(null), []);
      assert.deepEqual(getChangedFiles(''), []);
    });

    it('parses git diff output with correct prefixes', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      const calls = [];
      cp.spawnSync = (cmd, args, opts) => {
        calls.push(args);
        // merge-base call
        if (args.includes('merge-base')) {
          return { status: 0, stdout: 'abc123\n' };
        }
        // diff call
        return {
          status: 0,
          stdout: 'A\tsrc/new.js\nM\tsrc/old.js\nD\tsrc/removed.js\n',
        };
      };

      delete require.cache[require.resolve('./index')];
      const { getChangedFiles } = require('./index');

      const files = getChangedFiles('/some/dir');
      assert.deepEqual(files, ['+src/new.js', '~src/old.js', '-src/removed.js']);

      // Verify diff uses merge-base, not HEAD
      const diffCall = calls.find(a => a.includes('diff'));
      assert.ok(diffCall.includes('abc123'), 'should diff from merge-base commit');

      cp.spawnSync = orig;
      delete require.cache[require.resolve('./index')];
    });

    it('falls back to HEAD when no merge-base found', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      const calls = [];
      cp.spawnSync = (cmd, args) => {
        calls.push(args);
        if (args.includes('merge-base')) {
          return { status: 128, stdout: '' };
        }
        return {
          status: 0,
          stdout: 'M\tfile.js\n',
        };
      };

      delete require.cache[require.resolve('./index')];
      const { getChangedFiles } = require('./index');

      const files = getChangedFiles('/some/dir');
      assert.deepEqual(files, ['~file.js']);

      const diffCall = calls.find(a => a.includes('diff'));
      assert.ok(diffCall.includes('HEAD'), 'should fall back to HEAD');

      cp.spawnSync = orig;
      delete require.cache[require.resolve('./index')];
    });

    it('handles renames', () => {
      const cp = require('child_process');
      const orig = cp.spawnSync;
      cp.spawnSync = (cmd, args) => {
        if (args.includes('merge-base')) {
          return { status: 0, stdout: 'abc123\n' };
        }
        return {
          status: 0,
          stdout: 'R100\told.js\tnew.js\n',
        };
      };

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
