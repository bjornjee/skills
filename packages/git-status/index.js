'use strict';

const { spawnSync } = require('child_process');

const TIMEOUT = 2000;

/**
 * Get files changed in the working tree (unstaged + staged).
 * Returns array of strings with prefix: '+' added, '~' modified, '-' deleted.
 * @param {string} cwd - working directory
 * @returns {string[]}
 */
function getChangedFiles(cwd) {
  if (!cwd) return [];

  const result = spawnSync('git', ['diff', '--name-status', 'HEAD'], {
    encoding: 'utf8',
    timeout: TIMEOUT,
    cwd,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  if (result.status !== 0 || !result.stdout) return [];

  const prefixMap = { A: '+', M: '~', D: '-', R: '~', C: '~' };

  return result.stdout.trim().split('\n').map(line => {
    const [status, ...fileParts] = line.split('\t');
    const file = fileParts[fileParts.length - 1]; // handle renames (R100\told\tnew)
    const prefix = prefixMap[status?.[0]] || '~';
    return `${prefix}${file}`;
  }).filter(Boolean);
}

/**
 * Get the current git branch name.
 * @param {string} cwd - working directory
 * @returns {string|null}
 */
function getBranch(cwd) {
  if (!cwd) return null;

  const result = spawnSync('git', ['branch', '--show-current'], {
    encoding: 'utf8',
    timeout: TIMEOUT,
    cwd,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  if (result.status !== 0 || !result.stdout) return null;
  return result.stdout.trim() || null;
}

/**
 * Extract the effective working directory from a Bash command string.
 * Handles the worktree pattern: cd /absolute/path && ...
 * @param {string} command
 * @returns {string|null} absolute path or null
 */
function extractCwdFromCommand(command) {
  if (!command) return null;
  const match = command.match(/^\s*cd\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s*(?:&&|;|\|\||$)/);
  if (!match) return null;
  const dir = match[1] || match[2] || match[3];
  if (!dir || !dir.startsWith('/')) return null;
  return dir;
}

module.exports = { getChangedFiles, getBranch, extractCwdFromCommand };
