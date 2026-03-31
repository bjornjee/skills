'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateAgent } = require('./schema');
const { detectState } = require('./detect');

const DEFAULT_AGENTS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '/tmp',
  '.claude',
  'agent-dashboard',
  'agents',
);

/**
 * Encode a tmux target string for use as a filename.
 * Replaces '/' with '_s_', ':' with '_c_', and '.' with '_d_' to avoid
 * filesystem path traversal and naming issues.
 * @param {string} target - e.g. 'main:1.0'
 * @returns {string} - e.g. 'main_c_1_d_0'
 */
function encodeTarget(target) {
  return target.replace(/\//g, '_s_').replace(/:/g, '_c_').replace(/\./g, '_d_');
}

/**
 * Decode a filename back to a tmux target string.
 * @param {string} encoded - e.g. 'main_c_1_d_0'
 * @returns {string} - e.g. 'main:1.0'
 */
function decodeTarget(encoded) {
  return encoded.replace(/_s_/g, '/').replace(/_c_/g, ':').replace(/_d_/g, '.');
}

/**
 * Get the file path for a specific agent.
 * @param {string} agentId - tmux target string
 * @param {string} [agentsDir] - directory containing per-agent files
 * @returns {string}
 */
function agentFilePath(agentId, agentsDir = DEFAULT_AGENTS_DIR) {
  return path.join(agentsDir, `${encodeTarget(agentId)}.json`);
}

/**
 * Read a single agent's state from its per-agent file.
 * @param {string} agentId - tmux target string
 * @param {string} [agentsDir] - directory containing per-agent files
 * @returns {Object|null} - agent state or null if not found/invalid
 */
function readAgentState(agentId, agentsDir = DEFAULT_AGENTS_DIR) {
  try {
    const raw = fs.readFileSync(agentFilePath(agentId, agentsDir), 'utf8');
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Read all agent state files from the agents directory.
 * @param {string} [agentsDir] - directory containing per-agent files
 * @returns {{agents: Object}} - state object with all agents
 */
function readAllState(agentsDir = DEFAULT_AGENTS_DIR) {
  const result = { agents: {} };

  try {
    const files = fs.readdirSync(agentsDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const raw = fs.readFileSync(path.join(agentsDir, file), 'utf8');
        const agent = JSON.parse(raw);
        // Validate agent and ensure target matches filename to prevent mismatched entries
        const derivedTarget = decodeTarget(file.slice(0, -5)); // strip .json
        if (validateAgent(agent) && agent.target === derivedTarget) {
          result.agents[agent.target] = agent;
        }
      } catch {
        // Skip corrupted files
      }
    }
  } catch {
    // Directory doesn't exist yet
  }

  return result;
}

/**
 * Write/merge an agent update into its per-agent file (atomic).
 * No cross-agent locking needed — each agent writes only its own file.
 * Same-agent concurrent writes use last-write-wins semantics, which is
 * acceptable because hooks for a single pane are effectively sequential
 * (tool calls take 1-10s, hooks complete in 10-100ms).
 * @param {string} agentId - tmux target string
 * @param {Object} update - fields to merge into the agent entry
 * @param {string} [agentsDir] - directory containing per-agent files
 */
function writeState(agentId, update, agentsDir = DEFAULT_AGENTS_DIR) {
  fs.mkdirSync(agentsDir, { recursive: true });

  const filePath = agentFilePath(agentId, agentsDir);
  const existing = readAgentState(agentId, agentsDir) || {};

  const merged = {
    ...existing,
    ...update,
    updated_at: new Date().toISOString(),
  };

  // Atomic write via tmp file + rename. Clean up tmp on failure.
  const tmp = filePath + `.tmp.${process.pid}.${crypto.randomBytes(4).toString('hex')}`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(merged, null, 2));
    fs.renameSync(tmp, filePath);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw err;
  }
}

/**
 * Watch the agents directory for changes with debounce.
 * @param {function} callback - called with all agents state on change
 * @param {string} [agentsDir] - directory containing per-agent files
 * @param {number} [debounceMs=300] - debounce interval
 * @returns {function} stop - call to stop watching
 */
function watchState(callback, agentsDir = DEFAULT_AGENTS_DIR, debounceMs = 300) {
  let timer = null;
  let watcher = null;

  fs.mkdirSync(agentsDir, { recursive: true });

  try {
    watcher = fs.watch(agentsDir, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        callback(readAllState(agentsDir));
      }, debounceMs);
    });
  } catch {
    // Fallback to polling if fs.watch isn't available
    const interval = setInterval(() => {
      callback(readAllState(agentsDir));
    }, 1000);
    return () => clearInterval(interval);
  }

  return () => {
    if (timer) clearTimeout(timer);
    if (watcher) watcher.close();
  };
}

/**
 * Remove stale agent files that haven't been updated within the threshold.
 * Also cleans orphaned tmp files older than 60s.
 * @param {number} [maxAgeMs=300000] - max age in ms (default 5 min)
 * @param {string} [agentsDir] - directory containing per-agent files
 */
function cleanStale(maxAgeMs = 300000, agentsDir = DEFAULT_AGENTS_DIR) {
  let files;
  try {
    files = fs.readdirSync(agentsDir);
  } catch {
    return; // Directory doesn't exist
  }

  const now = Date.now();

  for (const file of files) {
    const filePath = path.join(agentsDir, file);

    // Clean up orphaned tmp files older than 60s
    if (file.includes('.tmp.')) {
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > 60000) {
          fs.unlinkSync(filePath);
        }
      } catch { /* ignore */ }
      continue;
    }

    if (!file.endsWith('.json')) continue;

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const agent = JSON.parse(raw);
      const age = now - new Date(agent.updated_at || 0).getTime();
      if (age > maxAgeMs) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Skip files we can't read
    }
  }
}

/**
 * Remove a specific agent's state file.
 * @param {string} agentId - tmux target string
 * @param {string} [agentsDir] - directory containing per-agent files
 */
function removeAgent(agentId, agentsDir = DEFAULT_AGENTS_DIR) {
  try {
    fs.unlinkSync(agentFilePath(agentId, agentsDir));
  } catch {
    // File already removed or never existed
  }
}

module.exports = {
  readAgentState,
  readAllState,
  writeState,
  watchState,
  cleanStale,
  removeAgent,
  detectState,
  encodeTarget,
  decodeTarget,
  DEFAULT_AGENTS_DIR,
};
