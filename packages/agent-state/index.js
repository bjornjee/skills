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
 * @param {string} agentId - unique agent identifier (target)
 * @param {Object} update - fields to merge into the agent entry
 * @param {string} [filePath] - path to state file
 */
function writeState(agentId, update, filePath = DEFAULT_STATE_FILE) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const current = readState(filePath);
  const existing = current.agents[agentId] || {};

  current.agents[agentId] = {
    ...existing,
    ...update,
    updated_at: new Date().toISOString(),
  };

  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(current, null, 2));
  fs.renameSync(tmp, filePath);
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
    const tmp = filePath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, filePath);
  }
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
