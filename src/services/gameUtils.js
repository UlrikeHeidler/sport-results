// Re-export utility functions from centralized constants
export {
  isGameOngoing,
  isGameInBreak,
  isGameFinal,
  isGameScheduled,
  getLeagueColors,
  getLeagueInfo
} from '../config/constants';
// Utility functions for game data

/**
 * Get a date object in the current user's timezone
 * @param {string} dateStr - A date string saved in a specific timezone
 * @param {string} serverTimezone - The timezone the dateStr is in
 * @returns {Date} A date object, adjusted to user's timezone
 */
export function getDateInCurrentUsersTimezone(dateStr, serverTimezone) {
  let nowAsStringInServerTimezone = new Date().toLocaleString('en-US', { timeZone: serverTimezone });
  let serverTimestamp = new Date(nowAsStringInServerTimezone).getTime();
  let userTimestamp = Date.now();
  let offset = userTimestamp - serverTimestamp;
  let adjustedTimestamp = new Date(dateStr).getTime() + offset;
  return new Date(adjustedTimestamp);
}


/**
 * Extract all unique teams from games data
 * @param {Object} gamesData - Games data grouped by league
 * @returns {Array<{id: string, name: string, abbreviation: string, league: string}>} Array of team objects
 */
export function extractTeams(gamesData) {
  const teams = [];
  const teamIds = new Set();
  Object.entries(gamesData).forEach(([league, games]) => {
    games.forEach(game => {
      [game.homeTeam, game.awayTeam].forEach(team => {
        const uniqueId = league + team.id;
        if (!teamIds.has(uniqueId)) {
          teamIds.add(uniqueId);
          teams.push({
            id: uniqueId,
            name: team.name,
            abbreviation: team.abbreviation,
            league: league.toUpperCase()
          });
        }
      });
    });
  });
  return teams.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get league color theme
 * @param {string} league - League identifier
 * @returns {{primary: string, secondary: string, accent: string, background: string}} Color theme object
 */
// League colors now imported from constants
