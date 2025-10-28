// Incremental Updates Service for Sports Results App
// Provides efficient data synchronization with minimal API calls and optimal user experience

import { fetchGames } from './sportsApi-fixed';
import { isGameOngoing } from './gameUtils';
// Debug logger
const debug = (...args) => { if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('debugIncremental') === '1') { console.log('[IncrementalUpdates]', ...args); } };

/**
 * Incremental Updates Manager
 * Handles smart data fetching, caching, and change detection
 */
class IncrementalUpdatesManager {
  constructor() {
    this.cache = new Map(); // Game data cache
    this.lastFetch = new Map(); // Last fetch timestamps per league
    this.changeListeners = new Set(); // Change event listeners
    this.updateQueue = new Map(); // Queued updates
    this.isUpdating = false;
    this.updateInterval = null;
    this.userRefreshInterval = 30; // Default to 30s if not set
    // Configuration
    this.config = {
      minUpdateInterval: 5000, // Minimum 5 seconds between updates
      maxUpdateInterval: 60000, // Maximum 60 seconds for live games
      cacheExpiry: 300000, // 5 minutes cache expiry
      batchUpdateDelay: 1000, // 1 second delay for batching updates
      retryAttempts: 3,
      retryDelay: 2000
    };
  }

  // Deep clone a game object, including all nested objects/arrays, to ensure React state updates
  cloneGame(game) {
    if (!game) return game;
    try {
      // Deep clone using structuredClone if available (modern browsers)
      if (typeof structuredClone === 'function') {
        return structuredClone(game);
      }
      // Fallback: manual deep clone for all relevant fields
      return {
        ...game,
        homeTeam: game.homeTeam ? { ...game.homeTeam } : null,
        awayTeam: game.awayTeam ? { ...game.awayTeam } : null,
        teams: game.teams ? {
          home: game.teams.home ? { ...game.teams.home } : null,
          away: game.teams.away ? { ...game.teams.away } : null
        } : null,
        status: game.status ? { ...game.status } : null,
        situation: game.situation
          ? (Array.isArray(game.situation)
              ? game.situation.map(s => (typeof s === 'object' && s !== null ? { ...s } : s))
              : { ...game.situation })
          : null,
        date: game.date ? new Date(game.date) : null,
        finishedAt: game.finishedAt ? new Date(game.finishedAt) : null
      };
    } catch (e) {
      // Fallback to returning the original object if cloning fails
      return JSON.parse(JSON.stringify(game));
    }
  }

  /**
   * Set which leagues should be tracked by the manager.
   * Removes cached data and lastFetch entries for leagues that are not in the
   * provided list so the manager stops polling them.
   */
  setTrackedLeagues(leagues = []) {
    try {
      const keep = new Set(leagues);

      // Remove cache entries not requested
      for (const key of Array.from(this.cache.keys())) {
        const league = key.replace(/^games_/, '');
        if (!keep.has(league)) {
          this.cache.delete(key);
        }
      }

      // Remove lastFetch entries not requested
      for (const k of Array.from(this.lastFetch.keys())) {
        if (!keep.has(k)) {
          this.lastFetch.delete(k);
        }
      }

      // Persist cache changes
      this.saveCacheToStorage();
    } catch (e) {
      console.warn('setTrackedLeagues failed', e);
    }
  }

  /**
   * Initialize the incremental updates system
   */
  initialize(userRefreshInterval = 30) {
    debug('Initializing IncrementalUpdatesManager with refreshInterval:', userRefreshInterval);
    this.userRefreshInterval = userRefreshInterval || 30;
    this.loadCacheFromStorage();
    this.startPeriodicUpdates();
    // Listen for visibility changes to optimize updates
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseUpdates();
      } else {
        this.resumeUpdates();
      }
    });
  }

  /**
   * Add a change listener for real-time updates
   */
  addChangeListener(callback) {
    this.changeListeners.add(callback);
    return () => this.changeListeners.delete(callback);
  }

  /**
   * Get games with incremental update logic
   */
  async getGamesIncremental(leagues, forceRefresh = false) {
    const results = {};
    const updatePromises = [];

    // Ensure manager only tracks leagues the caller cares about. Remove any
    // previously tracked leagues that are not in the requested list so the
    // periodic updater doesn't continue polling them.
    try {
      const requestedSet = new Set(leagues);
      for (const tracked of Array.from(this.lastFetch.keys())) {
        if (!requestedSet.has(tracked)) {
          this.lastFetch.delete(tracked);
        }
      }
    } catch (e) {
      // ignore pruning errors
    }

    for (const league of leagues) {
      const cacheKey = `games_${league}`;
      const lastFetchTime = this.lastFetch.get(league) || 0;
      const now = Date.now();
      
      // Check if we need to fetch new data
      const shouldUpdate = forceRefresh || 
                          !this.cache.has(cacheKey) || 
                          (now - lastFetchTime) > this.getUpdateInterval(league);

      if (shouldUpdate) {
        updatePromises.push(this.fetchAndUpdateLeague(league));
      } else {
        // Use cached data
        results[league] = this.cache.get(cacheKey) || [];
      }
    }

    // Wait for all updates to complete
    const updates = await Promise.allSettled(updatePromises);
    
    // Merge updated data with cached data
    updates.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { league, games } = result.value;
        // Return clones to callers to avoid exposing internal cache references
          results[league] = (games || []).map(g => this.cloneGame(g));
      }
    });

    return results;
  }

  /**
   * Fetch and update data for a specific league
   */
  async fetchAndUpdateLeague(league) {
    try {
      const newGames = await fetchGames(league);
      const cacheKey = `games_${league}`;
      const oldGames = this.cache.get(cacheKey) || [];
      
      // Detect changes
      const changes = this.detectChanges(oldGames, newGames, league);
      
      // Update cache (store cloned games to avoid sharing references)
      const cloned = (newGames || []).map(g => this.cloneGame(g));
      this.cache.set(cacheKey, cloned);
      this.lastFetch.set(league, Date.now());
      
      // Save to localStorage
      this.saveCacheToStorage();
      
      // Always notify listeners: if changes, send them; otherwise, send a GAME_REFRESH event for all games
      if (changes.length > 0) {
        // Clone game objects on change payloads as well to be defensive
        const safeChanges = changes.map(c => ({ ...c, game: this.cloneGame(c.game) }));
        this.notifyChanges(safeChanges);
      } else {
        // No detected changes, but new data fetched: notify listeners with a GAME_REFRESH for each game
        const refreshEvents = (cloned || []).map(game => ({
          type: 'GAME_REFRESH',
          league,
          gameId: game.id,
          game,
          timestamp: Date.now()
        }));
        if (refreshEvents.length > 0) {
          this.notifyChanges(refreshEvents);
        }
      }
      return { league, games: newGames, changes };
    } catch (error) {
      console.error(`Failed to update ${league}:`, error);
      throw error;
    }
  }

  /**
   * Detect changes between old and new game data
   */
  detectChanges(oldGames, newGames, league) {
    const changes = [];
    const oldGameMap = new Map(oldGames.map(game => [game.id, game]));
    const newGameMap = new Map(newGames.map(game => [game.id, game]));

    // Check for new games
    newGames.forEach(newGame => {
      if (!oldGameMap.has(newGame.id)) {
        changes.push({
          type: 'NEW_GAME',
          league,
          gameId: newGame.id,
          game: newGame,
          timestamp: Date.now()
        });
      }
    });

    // Check for updated games
    newGames.forEach(newGame => {
      const oldGame = oldGameMap.get(newGame.id);
      if (oldGame) {
        const gameChanges = this.detectGameChanges(oldGame, newGame);
        if (gameChanges.length > 0) {
          changes.push({
            type: 'GAME_UPDATED',
            league,
            gameId: newGame.id,
            game: newGame,
            changes: gameChanges,
            timestamp: Date.now()
          });
        }
      }
    });

    // Check for removed games (rare, but possible)
    oldGames.forEach(oldGame => {
      if (!newGameMap.has(oldGame.id)) {
        changes.push({
          type: 'GAME_REMOVED',
          league,
          gameId: oldGame.id,
          game: oldGame,
          timestamp: Date.now()
        });
      }
    });

    return changes;
  }

  /**
   * Detect specific changes within a game
   */
  detectGameChanges(oldGame, newGame) {
    const changes = [];

    // Score changes
    if (oldGame.homeTeam.score !== newGame.homeTeam.score) {
      changes.push({
        field: 'homeScore',
        oldValue: oldGame.homeTeam.score,
        newValue: newGame.homeTeam.score,
        priority: 'HIGH'
      });
    }

    if (oldGame.awayTeam.score !== newGame.awayTeam.score) {
      changes.push({
        field: 'awayScore',
        oldValue: oldGame.awayTeam.score,
        newValue: newGame.awayTeam.score,
        priority: 'HIGH'
      });
    }

    // Status changes
    if (oldGame.status.type !== newGame.status.type) {
      changes.push({
        field: 'status',
        oldValue: oldGame.status.type,
        newValue: newGame.status.type,
        priority: 'HIGH'
      });
    }

    // Clock changes
    if (oldGame.status.displayClock !== newGame.status.displayClock) {
      changes.push({
        field: 'clock',
        oldValue: oldGame.status.displayClock,
        newValue: newGame.status.displayClock,
        priority: 'MEDIUM'
      });
    }

    // Period changes
    if (oldGame.status.period !== newGame.status.period) {
      changes.push({
        field: 'period',
        oldValue: oldGame.status.period,
        newValue: newGame.status.period,
        priority: 'MEDIUM'
      });
    }

    // Team name changes (rare)
    if (oldGame.homeTeam.name !== newGame.homeTeam.name) {
      changes.push({
        field: 'homeTeamName',
        oldValue: oldGame.homeTeam.name,
        newValue: newGame.homeTeam.name,
        priority: 'LOW'
      });
    }

    if (oldGame.awayTeam.name !== newGame.awayTeam.name) {
      changes.push({
        field: 'awayTeamName',
        oldValue: oldGame.awayTeam.name,
        newValue: newGame.awayTeam.name,
        priority: 'LOW'
      });
    }

    // Venue changes
    if (oldGame.venue !== newGame.venue) {
      changes.push({
        field: 'venue',
        oldValue: oldGame.venue,
        newValue: newGame.venue,
        priority: 'LOW'
      });
    }

    // Situation changes (e.g., down/distance, balls/strikes/outs, power play)
    try {
      const oldSit = oldGame.situation || null;
      const newSit = newGame.situation || null;
      // Use a JSON stringify comparison to detect any nested changes. This is
      // intentionally broad: situation updates are important to surface to the
      // UI even when scores/status haven't changed (e.g., down/distance updates).
      if (JSON.stringify(oldSit) !== JSON.stringify(newSit)) {
        changes.push({
          field: 'situation',
          oldValue: oldSit,
          newValue: newSit,
          priority: 'HIGH'
        });
      }
    } catch (e) {
      // If comparison fails for any reason, don't block other change detection
      // but log for debugging.
      console.warn('Failed to compare situation objects for game', oldGame?.id, e);
    }

    return changes;
  }

  /**
   * Get appropriate update interval based on game states
   */
  getUpdateInterval(league) {
    // Always use the user setting (in seconds), fallback to 30s if not set
    return (this.userRefreshInterval || 30) * 1000;
  }

  /**
   * Notify all listeners of changes
   */
  notifyChanges(changes) {
    this.changeListeners.forEach(callback => {
      try {
        callback(changes);
      } catch (error) {
        console.error('Error in change listener:', error);
      }
    });
  }

  /**
   * Start periodic updates
   */
  startPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    debug('Starting periodic updates with interval:', (this.userRefreshInterval || 30) * 1000, 'ms');
    this.updateInterval = setInterval(() => {
      if (!document.hidden && !this.isUpdating) {
        this.performScheduledUpdates();
      }
    }, (this.userRefreshInterval || 30) * 1000);
  }

  /**
   * Perform scheduled updates for all cached leagues
   */
  async performScheduledUpdates() {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    
    try {
      const leagues = Array.from(this.lastFetch.keys());
      const updatePromises = leagues.map(league => {
        const lastFetch = this.lastFetch.get(league);
        const interval = this.getUpdateInterval(league);
        
        if (Date.now() - lastFetch >= interval) {
          return this.fetchAndUpdateLeague(league);
        }
        return null;
      }).filter(Boolean);

      await Promise.allSettled(updatePromises);
    } catch (error) {
      console.error('Error in scheduled updates:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Pause updates (when tab is hidden)
   */
  pauseUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Resume updates (when tab becomes visible)
   */
  resumeUpdates() {
    this.startPeriodicUpdates();
    // Trigger immediate update when resuming
    setTimeout(() => this.performScheduledUpdates(), 100);
  }

  /**
   * Save cache to localStorage
   */
  // Disabled: No-op to avoid localStorage caching issues
  saveCacheToStorage() {}

  /**
   * Load cache from localStorage
   */
  // Disabled: No-op to avoid localStorage caching issues
  loadCacheFromStorage() {}

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
    this.lastFetch.clear();
    // localStorage.removeItem('sportsApp_incrementalCache');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedLeagues: this.cache.size,
      totalGames: Array.from(this.cache.values()).reduce((sum, games) => sum + games.length, 0),
      lastUpdate: Math.max(...Array.from(this.lastFetch.values())),
      cacheSize: JSON.stringify(Object.fromEntries(this.cache)).length
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.pauseUpdates();
    this.changeListeners.clear();
    this.cache.clear();
    this.lastFetch.clear();
  }
}

// Create singleton instance
export const incrementalUpdatesManager = new IncrementalUpdatesManager();

// Export utility functions
export const initializeIncrementalUpdates = (userRefreshInterval = 30) => {
  incrementalUpdatesManager.initialize(userRefreshInterval);
};

export const getGamesWithIncrementalUpdates = (leagues, forceRefresh = false) => {
  return incrementalUpdatesManager.getGamesIncremental(leagues, forceRefresh);
};

export const setTrackedLeagues = (leagues) => {
  return incrementalUpdatesManager.setTrackedLeagues(leagues);
};

export const addChangeListener = (callback) => {
  return incrementalUpdatesManager.addChangeListener(callback);
};

export const clearIncrementalCache = () => {
  incrementalUpdatesManager.clearCache();
};

export const getIncrementalCacheStats = () => {
  return incrementalUpdatesManager.getCacheStats();
};