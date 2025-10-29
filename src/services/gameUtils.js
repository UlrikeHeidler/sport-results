/**
 * Check if a game status is ongoing (live, halftime, overtime, etc.)
 * @param {Object} status - Game status object
 * @returns {boolean} True if the game is ongoing/live
 */
export function isGameOngoing(status) {
  if (!status || !status.type) return false;
  return [
    'STATUS_IN_PROGRESS',
    'STATUS_HALFTIME',
    'STATUS_HALFTIME_ET',
    'STATUS_OVERTIME',
    'STATUS_FIRST_HALF',
    'STATUS_SECOND_HALF',
    'STATUS_END_OF_EXTRATIME',
    'STATUS_EXTRA_TIME',
    'STATUS_PENALTIES',
    'STATUS_SHOOTOUT',
    'STATUS_BREAK',
    'STATUS_INTERMISSION',
    'STATUS_END OF_REGULATION',
    'STATUS_END_PERIOD'
  ].includes(status.type);
}
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
 * Check if a game should be moved to bottom (finished > 2 minutes ago)
 * @param {Object} game - Game object
 * @param {Object} game.status - Game status object
 * @param {Date|string} game.finishedAt - Date/time the game finished
 * @returns {boolean} Whether game should be at bottom
 */
export function shouldMoveToBottom(game) {
  if (!game.status.completed || !game.finishedAt) {
    return false;
  }
  const now = new Date();
  const timeSinceFinished = now - new Date(game.finishedAt);
  const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
  return timeSinceFinished > twoMinutes;
}

/**
 * Sort games with smart ordering
 * @param {Array<Object>} games - Array of game objects
 * @returns {Array<Object>} Sorted games array
 */
export function sortGames(games) {
  return games.sort((a, b) => {
    const aToBottom = shouldMoveToBottom(a);
    const bToBottom = shouldMoveToBottom(b);
    if (aToBottom && !bToBottom) return 1;
    if (!aToBottom && bToBottom) return -1;
    if (!aToBottom && !bToBottom) {
      const aIsLive = isGameOngoing(a.status);
      const bIsLive = isGameOngoing(b.status);
      if (aIsLive && !bIsLive) return -1;
      if (bIsLive && !aIsLive) return 1;
    }
    return new Date(a.date) - new Date(b.date);
  });
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
        var uniqueId = league + team.id;
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
export function getLeagueColors(league) {
  const themes = {
    nfl: {
      primary: '#013369', secondary: '#D50A0A', accent: '#FFB612', background: '#f0f8ff'
    },
    nhl: {
      primary: '#000000', secondary: '#C8102E', accent: '#FCB514', background: '#f0f8ff'
    },
    fcs: {
      primary: '#8B0000', secondary: '#FFD700', accent: '#228B22', background: '#f0f8ff'
    },
    fbs: {
      primary: '#FF8C00', secondary: '#4169E1', accent: '#32CD32', background: '#f0f8ff'
    },
    mlb: {
      primary: '#002D72', secondary: '#D50032', accent: '#FFFFFF', background: '#f0f8ff'
    },
    bundesliga1: {
      primary: '#D20515', secondary: '#000000', accent: '#FFCC02', background: '#f0f8ff'
    },
    bundesliga2: {
      primary: '#005CA9', secondary: '#FFFFFF', accent: '#E30613', background: '#f0f8ff'
    },
    dfb_pokal: {
      primary: '#008751', secondary: '#FFFFFF', accent: '#FFD700', background: '#f0f8ff'
    },
    ucl: {
      primary: '#1B1E3C', secondary: '#FFFFFF', accent: '#FFD700', background: '#f0f8ff'
    },
    nba: {
      primary: '#614304', secondary: '#FFFFFF', accent: '#FFFFFF', background: '#f0f8ff'
    },
    mls: {
      primary: '#D20515', secondary: '#000000', accent: '#FFCC02', background: '#f0f8ff'
    },
    ncaaw: {
      primary: '#614304', secondary: '#FFFFFF', accent: '#E30613', background: '#f0f8ff'
    }
  };
  return themes[league.toLowerCase()] || themes.nfl;
}
