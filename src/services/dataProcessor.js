/**
 * Consolidated Data Processing Service
 * Eliminates duplicate data parsing and normalization logic
 */

import { normalizeStatus } from './normalizeStatus';
import { normalizeSituation } from './normalizeSituation';
import { detectPossession } from './sportsApi';
import { extractTeams } from '../utils/gameHelpers';
import { debug } from '../utils/logger';

/**
 * Base data processor with common functionality
 */
class DataProcessor {
  constructor(options = {}) {
    this.options = {
      validateData: true,
      logErrors: true,
      ...options
    };
  }

  /**
   * Validate required fields in data
   */
  validateRequiredFields(data, requiredFields, context = 'data') {
    const missing = requiredFields.filter(field => {
      const value = this.getNestedValue(data, field);
      return value === null || value === undefined;
    });

    if (missing.length > 0) {
      const error = `Missing required fields in ${context}: ${missing.join(', ')}`;
      if (this.options.logErrors) {
        console.warn(error, data);
      }
      if (this.options.validateData) {
        throw new Error(error);
      }
    }

    return missing.length === 0;
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Deep clone object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
    
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = this.deepClone(obj[key]);
    });
    return cloned;
  }

  /**
   * Merge objects with deep merging
   */
  deepMerge(target, source) {
    const result = this.deepClone(target);
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }
}

/**
 * ESPN API data processor
 */
class EspnDataProcessor extends DataProcessor {
  constructor(options = {}) {
    super(options);
    this.requiredEventFields = ['id', 'competitions'];
    this.requiredCompetitionFields = ['competitors', 'status'];
  }

  /**
   * Process ESPN API response into standardized format
   */
  processApiResponse(data, league) {
    try {
      if (!data.events || !Array.isArray(data.events)) {
        debug(`No events found for ${league}`);
        return [];
      }

      debug(`Processing ${data.events.length} events for ${league}`);

      const processedGames = data.events
        .map(event => this.processEvent(event, league))
        .filter(game => game !== null);

      debug(`Successfully processed ${processedGames.length} games for ${league}`);
      return processedGames;
    } catch (error) {
      console.error(`Error processing API response for ${league}:`, error);
      return [];
    }
  }

  /**
   * Process individual event
   */
  processEvent(event, league) {
    try {
      // Validate event structure
      if (!this.validateRequiredFields(event, this.requiredEventFields, `event ${event.id}`)) {
        return null;
      }

      const competition = event.competitions[0];
      if (!competition) {
        console.warn(`No competition data for event ${event.id}`);
        return null;
      }

      // Validate competition structure
      if (!this.validateRequiredFields(competition, this.requiredCompetitionFields, `competition for event ${event.id}`)) {
        return null;
      }

      const competitors = competition.competitors;
      if (!Array.isArray(competitors) || competitors.length < 2) {
        console.warn(`Invalid competitors for event ${event.id}:`, competitors);
        return null;
      }

      // Extract teams
      const homeTeam = competitors.find(comp => comp.homeAway === 'home');
      const awayTeam = competitors.find(comp => comp.homeAway === 'away');

      if (!homeTeam || !awayTeam) {
        console.warn(`Missing team data for event ${event.id}:`, {
          homeTeam: !!homeTeam,
          awayTeam: !!awayTeam,
          competitors: competitors.length
        });
        return null;
      }

      // Process teams
      const processedHomeTeam = this.processTeam(homeTeam, competition, true);
      const processedAwayTeam = this.processTeam(awayTeam, competition, false);

      // Process status and situation
      const status = normalizeStatus(competition.status);
      const situation = normalizeSituation(league, competition.situation || {}, competition, homeTeam, awayTeam);

      // Extract per-inning linescores for baseball (available on competitor objects)
      const homeLs = homeTeam.linescores?.map(l => l.value ?? '-') ?? [];
      const awayLs = awayTeam.linescores?.map(l => l.value ?? '-') ?? [];
      const linescores = (homeLs.length > 0 || awayLs.length > 0)
        ? { home: homeLs, away: awayLs }
        : null;

      // Build game object
      const game = {
        id: event.id,
        league: league.toUpperCase(),
        status,
        broadcast: competition.broadcast || null,
        homeTeam: processedHomeTeam,
        awayTeam: processedAwayTeam,
        situation,
        linescores,
        date: new Date(event.date),
        venue: competition.venue ? competition.venue.fullName : 'TBD',
        finishedAt: status.completed ? new Date() : null
      };

      return game;
    } catch (error) {
      console.warn(`Failed to process event ${event.id}:`, {
        eventId: event.id,
        league,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Process team data
   */
  processTeam(teamData, competition, isHome) {
    try {
      const team = teamData.team || {};
      const competitorIndex = isHome ? 0 : 1;
      const ranking = competition.competitors?.[competitorIndex]?.curatedRank?.current || null;

      return {
        id: teamData.id || team.id,
        name: team.displayName || team.name || 'Unknown Team',
        abbreviation: team.abbreviation || team.shortDisplayName || 'UNK',
        ranking: ranking && !isNaN(ranking) ? Number(ranking) : null,
        score: teamData.score || '0',
        logo: team.logo || ''
      };
    } catch (error) {
      console.warn('Error processing team data:', error);
      return {
        id: null,
        name: 'Unknown Team',
        abbreviation: 'UNK',
        ranking: null,
        score: '0',
        logo: ''
      };
    }
  }

  /**
   * Process multiple leagues data
   */
  processMultipleLeagues(leaguesData) {
    const processed = {};
    const errors = [];

    Object.entries(leaguesData).forEach(([league, data]) => {
      try {
        processed[league] = this.processApiResponse(data, league);
      } catch (error) {
        errors.push({ league, error: error.message });
        processed[league] = [];
      }
    });

    return { processed, errors };
  }
}

/**
 * Game summary processor
 */
class GameSummaryProcessor extends DataProcessor {
  /**
   * Process game summary/boxscore data
   */
  processSummary(rawData) {
    if (!rawData) return null;

    try {
      const src = rawData.boxscore || rawData.gamepackageJSON?.boxscore || rawData.boxScore || rawData;
      const teamsArr = src?.teams || (Array.isArray(src) ? src : null);

      if (!teamsArr || !Array.isArray(teamsArr) || teamsArr.length < 2) {
        return null;
      }

      return {
        teams: {
          home: this.processTeamSummary(teamsArr[0]),
          away: this.processTeamSummary(teamsArr[1])
        }
      };
    } catch (error) {
      console.warn('Error processing game summary:', error);
      return null;
    }
  }

  /**
   * Process team summary data
   */
  processTeamSummary(teamData) {
    if (!teamData) return null;

    try {
      // Extract goalie information
      const goalies = teamData.goalies || 
        (teamData.players ? teamData.players.filter(p => p.position && p.position.abbreviation === 'G') : []) || 
        [];
      const goalie = goalies[0] || teamData.goalie || null;

      const goalieName = goalie?.person?.fullName || goalie?.name || goalie?.playerName || goalie?.person?.displayName || null;
      const saves = goalie?.stats?.saves ?? goalie?.saves ?? goalie?.statistics?.saves ?? null;
      const shots = goalie?.stats?.shotsAgainst ?? goalie?.shotsAgainst ?? goalie?.statistics?.shotsAgainst ?? goalie?.statistics?.shots ?? null;

      const emptyNet = !!teamData.emptyNet || !!teamData.isEmptyNet || !!teamData.goaliePulled || false;

      return {
        id: teamData.team?.id || teamData.teamId || teamData.id || null,
        name: teamData.team?.displayName || teamData.team?.name || teamData.team?.shortName || null,
        goalie: goalieName ? { name: goalieName, saves, shots } : null,
        emptyNet
      };
    } catch (error) {
      console.warn('Error processing team summary:', error);
      return null;
    }
  }
}

/**
 * Data aggregator for combining multiple data sources
 */
class DataAggregator extends DataProcessor {
  /**
   * Aggregate games from multiple sources
   */
  aggregateGames(gamesData, options = {}) {
    const {
      removeDuplicates = true,
      sortBy = 'date',
      filterBy = null,
      groupBy = null
    } = options;

    let allGames = [];

    // Flatten games from all leagues
    Object.entries(gamesData).forEach(([league, games]) => {
      if (Array.isArray(games)) {
        allGames.push(...games.map(game => ({ ...game, league })));
      }
    });

    // Remove duplicates
    if (removeDuplicates) {
      allGames = this.removeDuplicateGames(allGames);
    }

    // Apply filters
    if (filterBy && typeof filterBy === 'function') {
      allGames = allGames.filter(filterBy);
    }

    // Sort games
    if (sortBy) {
      allGames = this.sortGames(allGames, sortBy);
    }

    // Group games
    if (groupBy) {
      return this.groupGames(allGames, groupBy);
    }

    return allGames;
  }

  /**
   * Remove duplicate games based on ID
   */
  removeDuplicateGames(games) {
    const seen = new Set();
    return games.filter(game => {
      const key = `${game.league}-${game.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort games by specified criteria
   */
  sortGames(games, sortBy) {
    const sortFunctions = {
      date: (a, b) => new Date(a.date) - new Date(b.date),
      league: (a, b) => a.league.localeCompare(b.league),
      status: (a, b) => {
        const statusOrder = { live: 0, scheduled: 1, final: 2 };
        const aOrder = statusOrder[a.status?.type?.toLowerCase()] ?? 3;
        const bOrder = statusOrder[b.status?.type?.toLowerCase()] ?? 3;
        return aOrder - bOrder;
      }
    };

    const sortFn = typeof sortBy === 'function' ? sortBy : sortFunctions[sortBy];
    if (!sortFn) {
      console.warn(`Unknown sort criteria: ${sortBy}`);
      return games;
    }

    return [...games].sort(sortFn);
  }

  /**
   * Group games by specified criteria
   */
  groupGames(games, groupBy) {
    const groupFunctions = {
      league: game => game.league,
      date: game => game.date.toDateString(),
      status: game => game.status?.type || 'unknown'
    };

    const groupFn = typeof groupBy === 'function' ? groupBy : groupFunctions[groupBy];
    if (!groupFn) {
      console.warn(`Unknown group criteria: ${groupBy}`);
      return { all: games };
    }

    return games.reduce((groups, game) => {
      const key = groupFn(game);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(game);
      return groups;
    }, {});
  }

  /**
   * Extract teams from aggregated games data
   */
  extractTeamsFromGames(gamesData) {
    return extractTeams(gamesData);
  }
}

// Create singleton instances
export const espnDataProcessor = new EspnDataProcessor();
export const gameSummaryProcessor = new GameSummaryProcessor();
export const dataAggregator = new DataAggregator();

// Export classes for custom instances
export { DataProcessor, EspnDataProcessor, GameSummaryProcessor, DataAggregator };

// Default export
export default espnDataProcessor;