#!/usr/bin/env node
// instructions-loaded-trace.js
//
// Temporary verification hook for the rules-restructure plan.
// Logs every CLAUDE.md / .claude/rules/*.md file Claude Code loads, with
// timestamp, parent PID, and session/transcript info, to:
//
//     ~/.claude/rules-load.log
//
// Wire it via hooks.json under the `InstructionsLoaded` event:
//
//   "InstructionsLoaded": [
//     {
//       "matcher": "*",
//       "hooks": [
//         {
//           "type": "command",
//           "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/instructions-loaded-trace.js\"",
//           "async": true,
//           "timeout": 3
//         }
//       ],
//       "description": "TEMP: trace which CLAUDE.md and .claude/rules files load"
//     }
//   ]
//
// REMOVE this hook (and delete this file) once Phase 3 verification is complete.

const fs = require("fs");
const os = require("os");
const path = require("path");

const LOG_PATH = path.join(os.homedir(), ".claude", "rules-load.log");

let payload = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  payload += chunk;
});
process.stdin.on("end", () => {
  let parsed = {};
  try {
    parsed = JSON.parse(payload);
  } catch (_) {
    parsed = { raw: payload.slice(0, 500) };
  }

  const entry = {
    ts: new Date().toISOString(),
    ppid: process.ppid,
    pid: process.pid,
    cwd: process.cwd(),
    session_id: parsed.session_id || null,
    transcript: parsed.transcript_path || null,
    file_path: parsed.file_path || parsed.path || null,
    file_kind: parsed.file_kind || null, // "claude_md" | "rule" | etc, if Claude Code provides it
    matched_paths: parsed.matched_paths || null, // for path-gated rules
    parent_kind: parsed.subagent_type ? "subagent" : "main",
    subagent_type: parsed.subagent_type || null,
    raw_keys: Object.keys(parsed),
  };

  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n");
  } catch (err) {
    // Hook must never fail loud — silently swallow disk errors.
  }

  process.exit(0);
});
