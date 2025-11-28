/**
 * Consolidated Game Utilities
 * Centralizes all game-related helper functions to eliminate duplication
 */

import { 
  isGameOngoing, 
  isGameInBreak, 
  isGameFinal, 
  isGameScheduled,
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

/**
 * Get display status for games with enhanced logic
 * Consolidates status display logic from multiple components
 */
export const getDisplayStatus = (status, situation) => {
  // Known ongoing status types
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

  // Heuristic: some APIs may leave status.type as 'SCHEDULED' while providing
  // situation data (matchTime / period / displayClock). Treat those as live.
  const situationIndicatesLive = situation && (
    situation.matchTime != null ||
    (situation.period && /half|period|overtime|extra|penalties|first|second/i.test(String(situation.period))) ||
    (status && status.displayClock)
  );

  if (isOngoingType || situationIndicatesLive) {
    return 'LIVE';
  }

  if (status && status.completed) return 'FINAL';
  return 'SCHEDULED';
};

/**
 * Extract all unique teams from games data
 * Consolidates duplicate extractTeams functions from sportsApi.js and gameUtils.js
 */
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
 * Format game time for display with sport-specific logic
 */
export const formatGameTime = (date, status = {}, league = '') => {
  try {
    // For MLB, don't show time during live games
    if (league && String(league).toLowerCase() === 'mlb') {
      if (isGameOngoing(status) || isGameFinal(status)) {
        return '';
      }
      if (date instanceof Date) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      return String(date);
    }

    if (isGameFinal(status)) {
      return 'Final';
    }
    
    if (isGameInBreak(status)) {
      return getBreakLabel(status);
    }

    if (isGameOngoing(status)) {
      return `${status.displayClock || ''}`.trim() ? 
        `${status.displayClock} - Period ${status.period}` : 
        'Live';
    }

    if (isGameScheduled(status)) {
      if (date instanceof Date) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      return String(date);
    }

    return status && status.type ? 
      String(status.type).replace('STATUS_', '').replace('_', ' ') : 
      '';
  } catch (e) {
    console.error('formatGameTime error', e, date, status, league);
    return '';
  }
};

/**
 * Get break/intermission label
 */
export const getBreakLabel = (status) => {
  if (!status || !status.type) return 'Break';
  
  const breakLabels = {
    'STATUS_HALFTIME': 'Halftime',
    'STATUS_HALFTIME_ET': 'Halftime (ET)',
    'STATUS_END_OF_REGULATION': 'End of Regulation',
    'STATUS_END_PERIOD': 'End of Period',
    'STATUS_BREAK': 'Break',
    'STATUS_INTERMISSION': 'Intermission'
  };
  
  return breakLabels[status.type] || 'Break';
};

/**
 * Get CSS class for game status
 */
export const getStatusClass = (status) => {
  if (isGameFinal(status)) {
    return 'final';
  }
  
  if (isGameOngoing(status)) {
    return 'live';
  }
  
  return 'scheduled';
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

/**
 * Get date in current user's timezone
 * Utility function for timezone handling
 */
export const getDateInCurrentUsersTimezone = (dateStr, serverTimezone) => {
  let nowAsStringInServerTimezone = new Date().toLocaleString('en-US', { timeZone: serverTimezone });
  let serverTimestamp = new Date(nowAsStringInServerTimezone).getTime();
  let userTimestamp = Date.now();
  let offset = userTimestamp - serverTimestamp;
  let adjustedTimestamp = new Date(dateStr).getTime() + offset;
  return new Date(adjustedTimestamp);
};

// Re-export utility functions from constants for convenience
export {
  isGameOngoing,
  isGameInBreak,
  isGameFinal,
  isGameScheduled,
  getLeagueColors,
  getLeagueInfo
};