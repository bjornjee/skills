'use strict';

const QUESTION_PATTERNS = [
  /\?\s*$/m,
  /which\s+(one|should|do|would)/i,
  /should\s+i/i,
  /do\s+you\s+(want|prefer|need)/i,
  /would\s+you\s+(like|prefer)/i,
  /please\s+(choose|select|pick|confirm|decide)/i,
  /let\s+me\s+know/i,
  /waiting\s+for\s+(your|input|response)/i,
];

const PROMPT_INDICATORS = [
  /^>\s*$/m,
  /^\$\s*$/m,
  /\u276f\s*$/m,  // ❯ prompt character
  /^human:/im,
];

/**
 * Detect whether an agent is waiting for input, done, or running.
 * Uses a layered heuristic: message content + tmux pane buffer.
 *
 * @param {string|null} lastMessage - The agent's last assistant message
 * @param {string[]} paneBuffer - Lines from tmux capture-pane
 * @returns {'input'|'done'|'running'}
 */
function detectState(lastMessage, paneBuffer) {
  const messageScore = scoreMessage(lastMessage);
  const paneScore = scorePaneBuffer(paneBuffer);

  // Both signals agree → high confidence
  if (messageScore > 0 && paneScore > 0) return 'input';

  // Only message suggests a question but pane doesn't show prompt
  // Could be Claude asking a rhetorical question while still working
  if (messageScore > 0) return 'input';

  // Pane shows a prompt but message doesn't look like a question
  // Agent is done and idle at the prompt
  if (paneScore > 0) return 'done';

  // Neither signal → assume done (Stop hook fired, so Claude finished)
  return 'done';
}

function scoreMessage(message) {
  if (!message || typeof message !== 'string') return 0;

  let score = 0;
  for (const pattern of QUESTION_PATTERNS) {
    if (pattern.test(message)) score++;
  }
  return score;
}

function scorePaneBuffer(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return 0;

  // Check last 3 lines for prompt indicators
  const tail = lines.slice(-3);
  let score = 0;
  for (const line of tail) {
    for (const pattern of PROMPT_INDICATORS) {
      if (pattern.test(line)) score++;
    }
  }
  return score;
}

module.exports = { detectState, scoreMessage, scorePaneBuffer, QUESTION_PATTERNS, PROMPT_INDICATORS };
