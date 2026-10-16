/** ESPN transport, date aggregation, and summary request caching. */

import { debug } from '../utils/logger';
import { handleError } from '../utils/errorHandler';
import { 
  API_ENDPOINTS, 
  isGameOngoing,
  isGameFinal
} from '../config/constants';
import { normalizeScoreboard } from './normalizeScoreboard';

const GAME_SUMMARY_CACHE_TTL_MS = 4000;
const gameSummaryCache = new Map();
const pendingGameSummaryRequests = new Map();

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
    return normalizeScoreboard(data, league);
  } catch (error) {
    handleError(error, `fetchGames (${league})`);
    throw error;
  }
};

const fetchGamesByLeagueAndDates = async (leagues, dates) => {
  const results = await Promise.all(
    leagues.flatMap(league =>
      dates.map(date =>
        fetchGames(league, date).then(games => ({ league, games, date }))
      )
    )
  );

  return results.reduce((gamesByLeague, { league, games, date }) => {
    if (!gamesByLeague[league]) gamesByLeague[league] = [];
    gamesByLeague[league].push(...games.map(game => ({ ...game, _requestedDate: date })));
    return gamesByLeague;
  }, {});
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

    if (includeMultipleDays) {
      // Fetch multiple days (legacy behavior)
      const dateRange = getDateRange();
      const gamesData = await fetchGamesByLeagueAndDates(enabledLeagues, dateRange);

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
        
        gamesData[league] = uniqueGames
          .filter(game => {
            const gameDate = new Date(game.date);
            gameDate.setHours(0, 0, 0, 0);
            return gameDate >= today && gameDate <= maxDate;
          })
          .map(({ _requestedDate, ...game }) => game);
      });

      return gamesData;
    } else {
      // Fetch yesterday's and today's games so late-night events crossing midnight are preserved.
      const dateFilters = [getYesterdayDateString(), getDateString(new Date())];
      const gamesData = await fetchGamesByLeagueAndDates(enabledLeagues, dateFilters);

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
    handleError(error, 'fetchAllGames');
    throw error;
  }
};

/**
 * Fetch per-game summary/boxscore for a specific event
 * @param {string} league - League identifier
 * @param {string} eventId - Event ID
 * @returns {Promise<Object|null>} Game summary data
 */
export const fetchGameSummary = async (league, eventId) => {
  const cacheKey = `${league.toLowerCase()}:${eventId}`;
  const now = Date.now();
  for (const [key, entry] of gameSummaryCache) {
    if (now - entry.fetchedAt >= GAME_SUMMARY_CACHE_TTL_MS) gameSummaryCache.delete(key);
  }
  const cached = gameSummaryCache.get(cacheKey);
  if (cached) return cached.data;
  const pending = pendingGameSummaryRequests.get(cacheKey);
  if (pending) return pending;

  const request = fetchGameSummaryUncached(league, eventId)
    .then(data => {
      if (data) {
        if (gameSummaryCache.size >= 100) {
          gameSummaryCache.delete(gameSummaryCache.keys().next().value);
        }
        gameSummaryCache.set(cacheKey, { data, fetchedAt: Date.now() });
      }
      return data;
    })
    .finally(() => pendingGameSummaryRequests.delete(cacheKey));
  pendingGameSummaryRequests.set(cacheKey, request);
  return request;
};

const fetchGameSummaryUncached = async (league, eventId) => {
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
