/**
 * Consolidated Game Utilities
 * Centralizes all game-related helper functions to eliminate duplication
 */

import { 
  isGameFinal, 
  getLeagueColors,
  getLeagueInfo 
} from '../config/constants';

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, 4th, etc.)
 * Consolidates duplicate ordinal logic from FootballGameTile
 */
export const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

/**
 * Get down suffix for football (1st, 2nd, 3rd, 4th down)
 * Consolidates duplicate down suffix logic
 */
export const getDownSuffix = (down) => {
  if (down === 1) return 'st';
  if (down === 2) return 'nd';
  if (down === 3) return 'rd';
  return 'th';
};

const isYesterday = (date) => {
  if (!(date instanceof Date)) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
};

/**
 * Canonical display status for game tiles.
 * Returns one of: 'LIVE', 'FINAL', 'FINAL (Pen.)', 'FINAL (Y)', 'FINAL (Pen.) (Y)', 'SCHEDULED'
 */
export const getDisplayStatus = (status, situation, date) => {
  const ongoingTypes = new Set([
    'STATUS_IN_PROGRESS',
    'STATUS_HALFTIME',
    'STATUS_HALFTIME_ET',
    'STATUS_OVERTIME',
    'STATUS_FIRST_HALF',
    'STATUS_END_OF_REGULATION',
    'STATUS_SECOND_HALF',
    'STATUS_EXTRA_TIME',
    'STATUS_PENALTIES',
    'STATUS_BREAK',
    'STATUS_INTERMISSION',
    'STATUS_END_PERIOD'
  ]);

  const isOngoingType = status && ongoingTypes.has(status.type);

  // Some APIs leave status.type as SCHEDULED while situation data signals the game is live
  const situationIndicatesLive = situation && (
    situation.matchTime != null ||
    (situation.period && /half|period|overtime|extra|penalties|first|second/i.test(String(situation.period))) ||
    (status && status.displayClock)
  );

  if (isOngoingType || situationIndicatesLive) return 'LIVE';

  if (status && status.completed) {
    const isPen = status.type === 'STATUS_FINAL_PEN';
    const isYday = isYesterday(date);
    if (isPen && isYday) return 'FINAL (Pen.) (Y)';
    if (isPen) return 'FINAL (Pen.)';
    if (isYday) return 'FINAL (Y)';
    return 'FINAL';
  }

  return 'SCHEDULED';
};

/**
 * Get winner information for completed games
 */
export const getGameWinner = (game) => {
  if (!game.status || !game.status.completed) {
    return { winner: null, isDraw: false };
  }

  const homeScore = Number(game.homeTeam?.score ?? 0);
  const awayScore = Number(game.awayTeam?.score ?? 0);
  
  if (homeScore > awayScore) {
    return { winner: 'home', isDraw: false };
  } else if (awayScore > homeScore) {
    return { winner: 'away', isDraw: false };
  } else {
    return { winner: null, isDraw: true };
  }
};

/**
 * Check if a team is the winner of a game
 */
export const isTeamWinner = (game, isHome) => {
  const { winner } = getGameWinner(game);
  return winner && ((winner === 'home' && isHome) || (winner === 'away' && !isHome));
};

/**
 * Get safe team data with fallbacks for different data structures
 */
export const getSafeTeamData = (game, isHome) => {
  if (isHome) {
    return game?.homeTeam || game?.teams?.home || { 
      id: null, name: '', abbreviation: '', score: 0, logo: '' 
    };
  } else {
    return game?.awayTeam || game?.teams?.away || { 
      id: null, name: '', abbreviation: '', score: 0, logo: '' 
    };
  }
};

/**
 * Check if game should be moved to bottom (completed games)
 */
export const shouldMoveToBottom = (game, delayMinutes = 2) => {
  if (!isGameFinal(game.status)) return false;
  
  if (!game.finishedAt) return false;
  
  const now = new Date();
  const finishedTime = new Date(game.finishedAt);
  const delayMs = delayMinutes * 60 * 1000;
  
  return (now - finishedTime) > delayMs;
};

/**
 * Get sport type from league
 */
export const getSportFromLeague = (league) => {
  const leagueInfo = getLeagueInfo(league);
  return leagueInfo?.sport || 'Unknown';
};

/**
 * Check if league is football
 */
export const isFootballLeague = (league) => {
  const sport = getSportFromLeague(league);
  return sport.toLowerCase() === 'football';
};

/**
 * Check if league is baseball
 */
export const isBaseballLeague = (league) => {
  const sport = getSportFromLeague(league);
  return sport.toLowerCase() === 'baseball';
};

/**
 * Check if league is basketball
 */
export const isBasketballLeague = (league) => {
  const sport = getSportFromLeague(league);
  return sport.toLowerCase() === 'basketball';
};

/**
 * Check if league is hockey
 */
export const isHockeyLeague = (league) => {
  const sport = getSportFromLeague(league);
  return sport.toLowerCase() === 'hockey';
};

/**
 * Check if league is soccer
 */
export const isSoccerLeague = (league) => {
  const sport = getSportFromLeague(league);
  return sport.toLowerCase() === 'soccer';
};

// Re-export utility functions from constants for convenience
export {
  isGameFinal,
  getLeagueColors,
  getLeagueInfo
};

export {
  extractTeams,
  getDateInCurrentUsersTimezone,
  isGameOngoing,
  isGameInBreak,
  isGameScheduled
} from '../services/gameUtils';

export {
  formatGameTimeForGameHelpers as formatGameTime,
  getBreakLabel,
  getStatusClass
} from '../services/gamePresentation';