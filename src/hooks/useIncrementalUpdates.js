// React Hook for Incremental Updates
// Provides seamless integration with React components for real-time data updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { debug } from '../utils/logger';
import { 
  initializeIncrementalUpdates, 
  getGamesWithIncrementalUpdates, 
  addChangeListener,
  getIncrementalCacheStats,
  setTrackedLeagues
} from '../services/incrementalUpdates';
import { isGameOngoing } from '../services/gameUtils';

/**
 * Custom hook for managing incremental updates in React components
 */
export const useIncrementalUpdates = (selectedLeagues = []) => {
  const [games, setGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updateStats, setUpdateStats] = useState({});
  const [recentChanges, setRecentChanges] = useState([]);
  
  // Refs for managing state
  const isInitialized = useRef(false);
  const changeListenerCleanup = useRef(null);
  const updateInProgress = useRef(false);

  /**
   * Initialize the incremental updates system
   */
  useEffect(() => {
    if (!isInitialized.current) {
      initializeIncrementalUpdates();
      isInitialized.current = true;
    }
  }, []);

  /**
   * Handle real-time changes from the incremental updates system
   */
  const handleChanges = useCallback((changes) => {
    debug('Received incremental changes:', changes);
    
    // Update recent changes for debugging/monitoring
    setRecentChanges(prev => {
      const newChanges = [...changes, ...prev].slice(0, 50); // Keep last 50 changes
      return newChanges;
    });

    // Group changes by league for efficient updates
    const changesByLeague = changes.reduce((acc, change) => {
      if (!acc[change.league]) {
        acc[change.league] = [];
      }
      acc[change.league].push(change);
      return acc;
    }, {});

    // Apply changes to current games state
    setGames(prevGames => {
      const newGames = { ...prevGames };
      Object.entries(changesByLeague).forEach(([league, leagueChanges]) => {
        if (!newGames[league]) {
          newGames[league] = [];
        }
        leagueChanges.forEach(change => {
          switch (change.type) {
            case 'NEW_GAME':
              // Add new game if not already present
              if (!newGames[league].find(g => g.id === change.gameId)) {
                newGames[league] = [...newGames[league], change.game];
              }
              break;
            case 'GAME_UPDATED':
            case 'GAME_REFRESH':
              // Update existing game (or insert if missing)
              if (newGames[league].find(g => g.id === change.gameId)) {
                newGames[league] = newGames[league].map(game =>
                  game.id === change.gameId ? change.game : game
                );
              } else {
                newGames[league] = [...newGames[league], change.game];
              }
              break;
            case 'GAME_REMOVED':
              // Remove game
              newGames[league] = newGames[league].filter(game =>
                game.id !== change.gameId
              );
              break;
          }
        });
      });
      return newGames;
    });

    setLastUpdated(new Date());
  }, []);

  /**
   * Set up change listener
   */
  useEffect(() => {
    if (changeListenerCleanup.current) {
      changeListenerCleanup.current();
    }
    
    changeListenerCleanup.current = addChangeListener(handleChanges);
    
    return () => {
      if (changeListenerCleanup.current) {
        changeListenerCleanup.current();
      }
    };
  }, [handleChanges]);

  /**
   * Load games with incremental updates
   */
  const loadGames = useCallback(async (forceRefresh = false) => {
    if (updateInProgress.current && !forceRefresh) {
      return;
    }

    updateInProgress.current = true;
    
    try {
      setLoading(true);
      setError(null);
      
      const gamesData = await getGamesWithIncrementalUpdates(selectedLeagues, forceRefresh);
      
      setGames(gamesData);
      setLastUpdated(new Date());
      
      // Update cache statistics
      const stats = getIncrementalCacheStats();
      setUpdateStats(stats);
      
    } catch (err) {
      setError('Failed to load games. Please try again later.');
      console.error('Error loading games with incremental updates:', err);
    } finally {
      setLoading(false);
      updateInProgress.current = false;
    }
  }, [selectedLeagues]);

  /**
   * Force refresh all data
   */
  const forceRefresh = useCallback(() => {
    return loadGames(true);
  }, [loadGames]);

  /**
   * Load games when selected leagues change
   */
  useEffect(() => {
    // Tell the manager which leagues we want tracked and remove any cached
    // data for leagues the user has deselected. Then load current games.
    setTrackedLeagues(selectedLeagues || []);

    if (selectedLeagues.length > 0) {
      loadGames();
    } else {
      // If user has deselected all leagues, clear local games state
      setGames({});
    }
  }, [selectedLeagues, loadGames]);

  /**
   * Get change summary for UI display
   */
  const getChangeSummary = useCallback(() => {
    const now = Date.now();
    const recentChangesInLastMinute = recentChanges.filter(
      change => now - change.timestamp < 60000
    );

    const summary = {
      totalChanges: recentChanges.length,
      recentChanges: recentChangesInLastMinute.length,
      scoreChanges: recentChanges.filter(change => 
        change.type === 'GAME_UPDATED' && 
        change.changes?.some(c => c.field.includes('Score'))
      ).length,
      statusChanges: recentChanges.filter(change =>
        change.type === 'GAME_UPDATED' &&
        change.changes?.some(c => c.field === 'status')
      ).length,
      newGames: recentChanges.filter(change => change.type === 'NEW_GAME').length
    };

    return summary;
  }, [recentChanges]);

  /**
   * Get live games count
   */
  const getLiveGamesCount = useCallback(() => {
    let liveCount = 0;
    Object.values(games).forEach(leagueGames => {
      liveCount += leagueGames.filter(game => isGameOngoing(game.status)).length;
    });
    return liveCount;
  }, [games]);

  /**
   * Get update frequency based on current game states
   */
  const getUpdateFrequency = useCallback(() => {
    const liveGames = getLiveGamesCount();
    if (liveGames > 0) {
      return 'High (5s) - Live games active';
    }
    
    // Check for upcoming games
    const now = new Date();
    let upcomingGames = 0;
    Object.values(games).forEach(leagueGames => {
      upcomingGames += leagueGames.filter(game => {
        const gameTime = new Date(game.date);
        const timeDiff = gameTime - now;
        return timeDiff > 0 && timeDiff < 30 * 60 * 1000;
      }).length;
    });
    
    if (upcomingGames > 0) {
      return 'Medium (15s) - Games starting soon';
    }
    
    return 'Low (60s) - No active games';
  }, [games, getLiveGamesCount]);

  return {
    // Core data
    games,
    loading,
    error,
    lastUpdated,
    
    // Actions
    loadGames,
    forceRefresh,
    
    // Monitoring and stats
    updateStats,
    recentChanges,
    changeSummary: getChangeSummary(),
    liveGamesCount: getLiveGamesCount(),
    updateFrequency: getUpdateFrequency(),
    
    // Utilities
    isUpdateInProgress: updateInProgress.current
  };
};

/**
 * Hook for monitoring incremental updates performance
 */
export const useIncrementalUpdatesMonitor = () => {
  const [stats, setStats] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const currentStats = getIncrementalCacheStats();
      setStats(currentStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return {
    stats,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
};

/**
 * Hook for debugging incremental updates
 */
export const useIncrementalUpdatesDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    enabled: false,
    logs: [],
    performance: {}
  });

  const enableDebug = useCallback(() => {
    setDebugInfo(prev => ({ ...prev, enabled: true }));
  }, []);

  const disableDebug = useCallback(() => {
    setDebugInfo(prev => ({ ...prev, enabled: false }));
  }, []);

  const addDebugLog = useCallback((message, data = null) => {
    if (!debugInfo.enabled) return;
    
    setDebugInfo(prev => ({
      ...prev,
      logs: [
        { timestamp: Date.now(), message, data },
        ...prev.logs.slice(0, 99) // Keep last 100 logs
      ]
    }));
  }, [debugInfo.enabled]);

  return {
    debugInfo,
    enableDebug,
    disableDebug,
    addDebugLog
  };
};