/**
 * Unified Sports API Service
 * Consolidates functionality from sportsApi.js and sportsApi-fixed.js
 * Provides efficient data fetching, parsing, and utilities for sports data
 */

import { debug } from '../utils/logger';
import { handleError } from '../utils/errorHandler';
import { 
  API_ENDPOINTS, 
  STATUS_TYPES, 
  LEAGUE_COLORS, 
  TIMING_CONSTANTS,
  isGameOngoing,
  isGameInBreak,
  isGameFinal,
  getLeagueColors 
} from '../config/constants';
import { normalizeStatus, getLiveStateLabel } from './normalizeStatus';
import { normalizeSituation } from './normalizeSituation';

/**
 * Date utilities for API requests
 */
export const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const getDateRange = (days = 4) => {
  const today = new Date();
  const dates = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(getDateString(date));
  }
  
  return dates;
};

export const getYesterdayDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
};

/**
 * Detect which team has possession from competition data
 * @param {Object} competitionObj - Competition object from API
 * @param {Object} homeTeamObj - Home team object
 * @param {Object} awayTeamObj - Away team object
 * @returns {Object} Possession information
 */
export const detectPossession = (competitionObj, homeTeamObj, awayTeamObj) => {
  if (!competitionObj) return { which: null, label: null };

  const sit = competitionObj.situation || {};
  
  let raw = sit.possession ?? sit.possessionText ?? null;
  if (competitionObj.drives && competitionObj.drives.currentPlay) {
    const cp = competitionObj.drives.currentPlay;
    if (cp.team && (cp.team.id || cp.team.abbreviation || cp.team.displayName)) {
      raw = cp.team.id || cp.team.abbreviation || cp.team.displayName || raw;
    } else if (cp.possessionTeamId) {
      raw = cp.possessionTeamId;
    }
  }

  if (raw && typeof raw === 'object') {
    if (raw.id) raw = String(raw.id);
    else if (raw.abbreviation) raw = String(raw.abbreviation);
    else if (raw.displayName) raw = String(raw.displayName);
  }

  const normalize = v => (v == null ? null : String(v).toLowerCase());
  const rawNorm = normalize(raw);

  const candidates = (team) => [team?.id, team?.abbreviation, team?.name, team?.displayName].map(normalize).filter(Boolean);
  const homeCandidates = new Set(candidates(homeTeamObj));
  const awayCandidates = new Set(candidates(awayTeamObj));

  // Prefer lastPlay.team when available
  if (sit.lastPlay && sit.lastPlay.team) {
    let lp = sit.lastPlay.team;
    let rawLp = lp.id || lp.abbreviation || lp.displayName || lp.name || null;
    if (rawLp) {
      const normalizeLp = (v) => (v == null ? null : String(v).toLowerCase());
      const lpNorm = normalizeLp(rawLp);
      if (lpNorm && homeCandidates.has(lpNorm)) return { which: 'home', label: rawLp };
      if (lpNorm && awayCandidates.has(lpNorm)) return { which: 'away', label: rawLp };
    }
  }

  if (rawNorm && homeCandidates.has(rawNorm)) return { which: 'home', label: raw };
  if (rawNorm && awayCandidates.has(rawNorm)) return { which: 'away', label: raw };

  if (rawNorm === 'home' || rawNorm === 'away') return { which: rawNorm, label: raw };

  if (typeof sit.possessionText === 'string') {
    const txt = sit.possessionText.toLowerCase();
    if (txt.includes('home')) return { which: 'home', label: sit.possessionText };
    if (txt.includes('away')) return { which: 'away', label: sit.possessionText };
  }

  if (sit.possessionTeamId) {
    const pid = normalize(sit.possessionTeamId);
    if (homeCandidates.has(pid)) return { which: 'home', label: sit.possessionTeamId };
    if (awayCandidates.has(pid)) return { which: 'away', label: sit.possessionTeamId };
  }

  return { which: null, label: raw ?? null };
};

/**
 * Fetch games for a specific league
 * @param {string} league - The league to fetch games for
 * @param {string} dateFilter - Optional date filter (YYYYMMDD format)
 * @returns {Promise<Array>} Array of game objects
 */
export const fetchGames = async (league, dateFilter = null) => {
  let url;

  try {
    const baseEndpoint = API_ENDPOINTS[league.toLowerCase()];
    if (!baseEndpoint) {
      throw new Error(`Unsupported league: ${league}`);
    }

    // Use provided date filter or today's date
    url = baseEndpoint;
    if (dateFilter) {
      const separator = baseEndpoint.includes('?') ? '&' : '?';
      url = `${baseEndpoint}${separator}dates=${dateFilter}`;
    } else {
      // Default to today's games
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${today.getFullYear()}${month}${day}`;
      const separator = baseEndpoint.includes('?') ? '&' : '?';
      url = `${baseEndpoint}${separator}dates=${dateStr}`;
    }
    
    // debug(`Fetching ${league} games from:`, url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // debug(`${league} API response:`, data);
    return parseGamesData(data, league);
  } catch (error) {
    handleError(error, `fetchGames (${league})`);
    
    // Return empty array with error context for better debugging
    console.warn(`Failed to fetch ${league} games:`, {
      error: error.message,
      url,
      timestamp: new Date().toISOString()
    });
    
    return []; // Return empty array instead of throwing
  }
};

/**
 * Parse the ESPN API response into a standardized format
 * @param {Object} data - Raw API response
 * @param {string} league - League identifier
 * @returns {Array} Parsed games array
 */
const parseGamesData = (data, league) => {
  if (!data.events || !Array.isArray(data.events)) {
    debug(`No events found for ${league}`);
    return [];
  }

  // debug(`Parsing ${data.events.length} events for ${league}`);

  return data.events.map(event => {
    let competition = null;
    let competitors = null;

    try {
      competition = event.competitions?.[0] || null;
      competitors = competition?.competitors || [];
      
      // Find home and away teams
      const homeTeam = competitors.find(comp => comp.homeAway === 'home');
      const awayTeam = competitors.find(comp => comp.homeAway === 'away');

      if (!homeTeam || !awayTeam) {
        console.warn(`Missing team data for event ${event.id}:`, {
          eventId: event.id,
          competitors: competitors.length || 0,
          homeTeam: !!homeTeam,
          awayTeam: !!awayTeam,
          league
        });
        return null;
      }

      // Extract situation data
      const situation = competition.situation || {};
  

      return {
        id: event.id,
        league: league.toUpperCase(),
        status: normalizeStatus(competition.status),
        broadcast: competition.broadcast ? competition.broadcast : null,
        homeTeam: {
          id: homeTeam.id,
          name: homeTeam.team.displayName || homeTeam.team.name,
          abbreviation: homeTeam.team.abbreviation,
          ranking: competition.competitors[0]?.curatedRank?.current || null,
          score: homeTeam.score || '0',
          logo: homeTeam.team.logo || '',
          winner: homeTeam.winner ?? false,
          shootoutScore: homeTeam.shootoutScore ?? null,
          hits: homeTeam.hits ?? null,
          errors: homeTeam.errors ?? null
        },
        awayTeam: {
          id: awayTeam.id,
          name: awayTeam.team.displayName || awayTeam.team.name,
          abbreviation: awayTeam.team.abbreviation,
          ranking: competition.competitors[1]?.curatedRank?.current || null,
          score: awayTeam.score || '0',
          logo: awayTeam.team.logo || '',
          winner: awayTeam.winner ?? false,
          shootoutScore: awayTeam.shootoutScore ?? null,
          hits: awayTeam.hits ?? null,
          errors: awayTeam.errors ?? null
        },
        situation: normalizeSituation(league, situation, competition, homeTeam, awayTeam),
        linescores: (() => {
          const h = homeTeam.linescores?.map(l => l.value ?? '-') ?? [];
          const a = awayTeam.linescores?.map(l => l.value ?? '-') ?? [];
          return (h.length > 0 || a.length > 0) ? { home: h, away: a } : null;
        })(),
        date: new Date(event.date),
        venue: competition.venue ? competition.venue.fullName : 'TBD',
        finishedAt: competition.status.type.completed ? new Date() : null
      };
    } catch (error) {
      console.warn(`Failed to parse game data for event ${event?.id || 'unknown'}:`, {
        eventId: event?.id || null,
        league,
        error: error.message,
        hasCompetition: !!competition,
        hasCompetitors: Array.isArray(competitors) ? competitors.length : 0
      });
      return null;
    }
  }).filter(game => game !== null);
};

/**
 * Get games for all supported leagues
 * @param {Array} selectedLeagues - Array of league names to fetch
 * @param {boolean} includeMultipleDays - Whether to fetch multiple days of games
 * @returns {Promise<Object>} Object with games grouped by league
 */
export const fetchAllGames = async (selectedLeagues = [], includeMultipleDays = false) => {
  try {
    // Only fetch leagues that are actually enabled
    const enabledLeagues = Array.isArray(selectedLeagues)
      ? [...new Set(selectedLeagues.filter(l => typeof l === 'string' && l.trim()))]
      : [];
    
    console.log('Fetching games for leagues:', enabledLeagues);

    if (!enabledLeagues.length) {
      debug('No leagues enabled, skipping all fetches.');
      return {};
    }

    let promises;
    
    if (includeMultipleDays) {
      // Fetch multiple days (legacy behavior)
      const dateRange = getDateRange();
      const allPromises = [];

      enabledLeagues.forEach(league => {
        dateRange.forEach(date => {
          allPromises.push(
            fetchGames(league, date).then(games => ({ league, games, date }))
          );
        });
      });

      const results = await Promise.allSettled(allPromises);
      const gamesData = {};

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { league, games } = result.value;
          if (!gamesData[league]) {
            gamesData[league] = [];
          }
          gamesData[league].push(...games);
        } else {
          handleError(result.reason, 'fetchAllGames (Promise.allSettled)');
        }
      });

      // Remove duplicates and filter by date range
      Object.keys(gamesData).forEach(league => {
        const uniqueGames = gamesData[league].filter((game, index, self) =>
          index === self.findIndex(g => g.id === game.id)
        );
        
        // Filter to only include today + next 3 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + 3);
        
        gamesData[league] = uniqueGames.filter(game => {
          const gameDate = new Date(game.date);
          gameDate.setHours(0, 0, 0, 0);
          return gameDate >= today && gameDate <= maxDate;
        });
      });

      return gamesData;
    } else {
      // Fetch yesterday's and today's games so late-night events crossing midnight are preserved.
      const dateFilters = [getYesterdayDateString(), getDateString(new Date())];
      const allPromises = [];

      enabledLeagues.forEach(league => {
        dateFilters.forEach(date => {
          allPromises.push(
            fetchGames(league, date).then(games => ({ league, games, date }))
          );
        });
      });

      const results = await Promise.allSettled(allPromises);
      const gamesData = {};

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { league, games, date } = result.value;
          if (!gamesData[league]) {
            gamesData[league] = [];
          }
          const annotatedGames = games.map(game => ({ ...game, _requestedDate: date }));
          gamesData[league].push(...annotatedGames);
        } else {
          handleError(result.reason, 'fetchAllGames (Promise.allSettled)');
        }
      });


      const today = getDateString(new Date());
      const yesterday = getYesterdayDateString();

      Object.keys(gamesData).forEach(league => {
        const uniqueGames = gamesData[league].filter((game, index, self) =>
          index === self.findIndex(g => g.id === game.id)
        );

        gamesData[league] = uniqueGames
          .filter(game => {
            if (game._requestedDate === today) {
              return true;
            }
            if (game._requestedDate === yesterday) {
              return isGameOngoing(game.status) || isGameFinal(game.status);
            }
            return false;
          })
          .map(({ _requestedDate, ...game }) => game);
      });

      return gamesData;
    }
  } catch (error) {
    handleError(error, 'fetchAllGames', true);
    return {};
  }
};

/**
 * Format game time for display
 * @param {Date} date - Game date
 * @param {Object} status - Game status
 * @param {string} league - League identifier
 * @returns {string} Formatted time string
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
      return getLiveStateLabel(status);
    }

    if (isGameOngoing(status)) {
      if (status.type === 'STATUS_PENALTIES' || status.type === 'STATUS_SHOOTOUT') {
        return 'Penalty Shootout';
      }
      const clock = `${status.displayClock || ''}`.trim();
      if (!clock) return 'Live';
      const periodLabel = status.type === 'STATUS_EXTRA_TIME' || status.type === 'STATUS_OVERTIME'
        ? 'ET'
        : `Period ${status.period}`;
      return `${clock} - ${periodLabel}`;
    }

    if (status && status.type === STATUS_TYPES.SCHEDULED) {
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
 * Get status class for styling
 * @param {Object} status - Game status
 * @returns {string} CSS class name
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
 * Extract all unique teams from games data
 * @param {Object} gamesData - Games data grouped by league
 * @returns {Array} Array of team objects
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
 * Fetch per-game summary/boxscore for a specific event
 * @param {string} league - League identifier
 * @param {string} eventId - Event ID
 * @returns {Promise<Object|null>} Game summary data
 */
export const fetchGameSummary = async (league, eventId) => {
  try {
    const baseEndpoint = API_ENDPOINTS[league.toLowerCase()];
    if (!baseEndpoint) {
      handleError(`Unsupported league: ${league}`, 'fetchGameSummary');
      return null;
    }

    // Replace /scoreboard with /summary and append event id param
    const summaryEndpoint = baseEndpoint.includes('/scoreboard')
      ? baseEndpoint.replace('/scoreboard', `/summary?event=${encodeURIComponent(eventId)}`)
      : `${baseEndpoint}/summary?event=${encodeURIComponent(eventId)}`;

    const res = await fetch(summaryEndpoint);
    if (!res.ok) {
      handleError(`fetchGameSummary failed: ${res.status}`, 'fetchGameSummary');
      return null;
    }
    
    const data = await res.json();
    // debug('fetchGameSummary success:', { league, eventId, data });
    return data;
  } catch (err) {
    handleError(err, 'fetchGameSummary');
    return null;
  }
};

/**
 * Normalize a raw game summary/boxscore payload
 * @param {Object} raw - Raw summary data
 * @returns {Object|null} Normalized summary data
 */
export const normalizeGameSummary = (raw) => {
  if (!raw) return null;

  const src = raw.boxscore || raw.gamepackageJSON?.boxscore || raw.boxScore || raw;
  const teamsArr = src?.teams || (Array.isArray(src) ? src : null);

  const normalizeTeam = (tRaw) => {
    if (!tRaw) return null;

    const goalies = tRaw.goalies || 
      (tRaw.players ? tRaw.players.filter(p => p.position && p.position.abbreviation === 'G') : null) || 
      [];
    const goalie = goalies[0] || tRaw.goalie || null;

    const name = goalie?.person?.fullName || goalie?.name || goalie?.playerName || goalie?.person?.displayName || null;
    const saves = goalie?.stats?.saves ?? goalie?.saves ?? goalie?.statistics?.saves ?? null;
    const shots = goalie?.stats?.shotsAgainst ?? goalie?.shotsAgainst ?? goalie?.statistics?.shotsAgainst ?? goalie?.statistics?.shots ?? null;

    const emptyNet = !!tRaw.emptyNet || !!tRaw.isEmptyNet || !!tRaw.goaliePulled || false;

    return {
      id: tRaw.team?.id || tRaw.teamId || tRaw.id || null,
      name: tRaw.team?.displayName || tRaw.team?.name || tRaw.team?.shortName || null,
      goalie: name ? { name, saves, shots } : null,
      emptyNet
    };
  };

  // Handle different response formats
  if (Array.isArray(teamsArr) && teamsArr.length >= 2) {
    return {
      teams: {
        home: normalizeTeam(teamsArr[0]),
        away: normalizeTeam(teamsArr[1])
      }
    };
  }

  if (src && src.teams && (src.teams.home || src.teams.away)) {
    return {
      teams: {
        home: normalizeTeam(src.teams.home),
        away: normalizeTeam(src.teams.away)
      }
    };
  }

  if (src && src.teamsById) {
    const ids = Object.keys(src.teamsById);
    return {
      teams: {
        home: normalizeTeam(src.teamsById[ids[0]]),
        away: normalizeTeam(src.teamsById[ids[1]])
      }
    };
  }

  return null;
};

// Export utility functions from constants for backward compatibility
export { getLeagueColors, isGameOngoing };