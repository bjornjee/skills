'use strict';

const fs = require('fs');
const path = require('path');
const { validateState } = require('./schema');
const { detectState } = require('./detect');

const DEFAULT_STATE_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '/tmp',
  '.claude',
  'agent-dashboard',
);
const DEFAULT_STATE_FILE = path.join(DEFAULT_STATE_DIR, 'state.json');

const crypto = require('crypto');

/**
 * Execute fn while holding an exclusive lockfile.
 * Uses O_CREAT|O_EXCL to atomically create a .lock file as a mutex.
 * Retries with short busy-wait on contention; breaks stale locks after 2s.
 * Falls back to unlocked execution if lock cannot be acquired.
 */
function withLock(filePath, fn) {
  const lockPath = filePath + '.lock';
  const maxRetries = 50;
  const retryMs = 2;
  let acquired = false;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const fd = fs.openSync(lockPath, 'wx');
      fs.closeSync(fd);
      acquired = true;
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      // Check for stale locks (>2s old)
      try {
        const stat = fs.statSync(lockPath);
        if (Date.now() - stat.mtimeMs > 2000) {
          try { fs.unlinkSync(lockPath); } catch { /* race with another unlink */ }
          continue;
        }
      } catch { /* lock was just released */ continue; }
      // Busy-wait
      const end = Date.now() + retryMs;
      while (Date.now() < end) { /* spin */ }
    }
  }

  if (!acquired) {
    // Lock contention exceeded 100ms — skip the write rather than race.
    return;
  }

  try {
    return fn();
  } finally {
    try { fs.unlinkSync(lockPath); } catch { /* already removed */ }
  }
}

/**
 * Read and validate the agent state file.
 * @param {string} [filePath] - path to state file
 * @returns {{agents: Object}}
 */
function readState(filePath = DEFAULT_STATE_FILE) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return validateState(JSON.parse(raw));
  } catch {
    return { agents: {} };
  }
}

/**
 * Write/merge an agent update into the state file (atomic).
 * Uses file locking to prevent concurrent hook processes from losing updates.
 * @param {string} agentId - unique agent identifier (target)
 * @param {Object} update - fields to merge into the agent entry
 * @param {string} [filePath] - path to state file
 */
function writeState(agentId, update, filePath = DEFAULT_STATE_FILE) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  withLock(filePath, () => {
    const current = readState(filePath);
    const existing = current.agents[agentId] || {};

    current.agents[agentId] = {
      ...existing,
      ...update,
      updated_at: new Date().toISOString(),
    };

    // Use a unique tmp file per process to avoid ENOENT when concurrent
    // processes rename each other's tmp files.
    const tmp = filePath + `.tmp.${process.pid}.${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(tmp, JSON.stringify(current, null, 2));
    fs.renameSync(tmp, filePath);
  });
}

/**
 * Watch the state file for changes with debounce.
 * @param {function} callback - called with validated state on change
 * @param {string} [filePath] - path to state file
 * @param {number} [debounceMs=300] - debounce interval
 * @returns {function} stop - call to stop watching
 */
function watchState(callback, filePath = DEFAULT_STATE_FILE, debounceMs = 300) {
  let timer = null;
  let watcher = null;

  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  // Ensure file exists
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ agents: {} }));
  }

  try {
    watcher = fs.watch(filePath, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        callback(readState(filePath));
      }, debounceMs);
    });
  } catch {
    // Fallback to polling if fs.watch isn't available
    const interval = setInterval(() => {
      callback(readState(filePath));
    }, 1000);
    return () => clearInterval(interval);
  }

  return () => {
    if (timer) clearTimeout(timer);
    if (watcher) watcher.close();
  };
}

/**
 * Remove stale agents that haven't been updated within the threshold.
 * @param {number} [maxAgeMs=300000] - max age in ms (default 5 min)
 * @param {string} [filePath] - path to state file
 */
function cleanStale(maxAgeMs = 300000, filePath = DEFAULT_STATE_FILE) {
  withLock(filePath, () => {
    const state = readState(filePath);
    const now = Date.now();
    let changed = false;

    for (const [id, agent] of Object.entries(state.agents)) {
      const age = now - new Date(agent.updated_at || 0).getTime();
      if (age > maxAgeMs) {
        delete state.agents[id];
        changed = true;
      }
    }

    if (changed) {
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      const tmp = filePath + `.tmp.${process.pid}.${crypto.randomBytes(4).toString('hex')}`;
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
      fs.renameSync(tmp, filePath);
    }
  });
}

module.exports = {
  readState,
  writeState,
  watchState,
  cleanStale,
  detectState,
  DEFAULT_STATE_FILE,
  DEFAULT_STATE_DIR,
};
