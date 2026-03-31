'use strict';

const VALID_STATES = ['input', 'running', 'done', 'error', 'idle'];

const STATE_PRIORITY = {
  input: 1,
  error: 2,
  running: 3,
  idle: 4,
  done: 5,
};

function validateAgent(agent) {
  if (!agent || typeof agent !== 'object') return false;
  if (!agent.target || typeof agent.target !== 'string') return false;
  if (!agent.session_id || typeof agent.session_id !== 'string') return false;
  if (!VALID_STATES.includes(agent.state)) return false;
  return true;
}

function validateState(state) {
  if (!state || typeof state !== 'object') return { agents: {} };
  if (!state.agents || typeof state.agents !== 'object') return { agents: {} };

  const valid = { agents: {} };
  for (const [id, agent] of Object.entries(state.agents)) {
    if (validateAgent(agent)) {
      valid.agents[id] = agent;
    }
  }
  return valid;
}

function sortAgentsByPriority(agents) {
  return [...agents].sort((a, b) => {
    const pa = STATE_PRIORITY[a.state] || 99;
    const pb = STATE_PRIORITY[b.state] || 99;
    if (pa !== pb) return pa - pb;
    return (a.updated_at || '').localeCompare(b.updated_at || '');
  });
}

module.exports = { VALID_STATES, STATE_PRIORITY, validateAgent, validateState, sortAgentsByPriority };
