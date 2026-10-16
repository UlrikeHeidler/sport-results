// Re-export utility functions from centralized constants.
export {
  isGameOngoing,
  isGameInBreak,
  isGameFinal,
  isGameScheduled,
  getLeagueColors,
  getLeagueInfo
} from '../config/constants';

import { isGameFinal } from '../config/constants';

export const extractTeams = (gamesData) => {
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
};

export const getDateInCurrentUsersTimezone = (dateStr, serverTimezone) => {
  const nowAsStringInServerTimezone = new Date().toLocaleString('en-US', { timeZone: serverTimezone });
  const serverTimestamp = new Date(nowAsStringInServerTimezone).getTime();
  const userTimestamp = Date.now();
  const offset = userTimestamp - serverTimestamp;
  const adjustedTimestamp = new Date(dateStr).getTime() + offset;
  return new Date(adjustedTimestamp);
};
