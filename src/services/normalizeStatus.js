/**
 * Map ESPN live state/status code to a human-readable label
 * @param {string} state - ESPN status type/state (e.g., 'STATUS_OVERTIME')
 * @returns {string} Human-readable label (e.g., 'overtime')
 */
export function getLiveStateLabel(state) {
  if (!state) return '';
  const map = {
    'STATUS_OVERTIME': 'Overtime',
    'STATUS_HALFTIME': 'Halftime',
    'STATUS_HALFTIME_ET': 'Halftime (ET)',
    'STATUS_BREAK': 'Break',
    'STATUS_INTERMISSION': 'Intermission',
    'STATUS_FIRST_HALF': '1st HT',
    'STATUS_SECOND_HALF': '2nd HT',
    'STATUS_END_PERIOD': 'End of period',
    'STATUS_END_OF_REGULATION': 'End of regulation',
    'STATUS_PLAYING': 'Playing',
    'IN_PROGRESS': 'In progress',
    'HALFTIME': 'Halftime',
    'END_PERIOD': 'End of period',
    'STATUS_IN_PROGRESS': 'In progress',
  };
  const key = state.toUpperCase();
  return map[key] || key.replace(/^STATUS_/, '').replace(/_/g, ' ').toLowerCase();
}
/**
 * Normalize ESPN status object to app status
 * @param {Object} status - ESPN status object
 * @param {Object} status.type - Status type object
 * @param {string} [status.type.name] - Status type name
 * @param {string} [status.state] - Status state
 * @param {string} [status.displayClock] - Display clock
 * @param {string} [status.clock] - Clock
 * @param {number} [status.period] - Period number
 * @returns {{type: string, displayClock: string, period: number, completed: boolean}}
 */
export function normalizeStatus(status) {
  // Common live game states in ESPN API
  const liveStates = [
    'STATUS_IN_PROGRESS',
    'STATUS_OVERTIME',
    'STATUS_HALFTIME',
    'STATUS_HALFTIME_ET',
    'STATUS_BREAK',
    'STATUS_INTERMISSION',
    'STATUS_FIRST_HALF',
    'STATUS_SECOND_HALF',
    'STATUS_END_PERIOD',
    'STATUS_END OF_REGULATION',
    'STATUS_PLAYING',
    'IN_PROGRESS',
    'HALFTIME',
    'END_PERIOD'
  ];
  const statusName = status.type.name || status.state;
  const isLive = liveStates.includes(statusName.toUpperCase());
  return {
    //type: isLive ? 'STATUS_IN_PROGRESS' : statusName,
    type: status.type.name,
    displayClock: status.displayClock || status.clock || '',
    period: status.period || 0,
    completed: status.type.completed || status.state === 'post' || false
  };
}
