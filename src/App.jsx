import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import GameTile from './components/game-tiles/GameTileFactory';
import LeagueSelector from './components/LeagueSelector';
import Settings from './components/Settings';
import IncrementalUpdatesMonitor from './components/IncrementalUpdatesMonitor';
import { useIncrementalUpdates } from './hooks/useIncrementalUpdates';
import {
  fetchAllGames,
  sortGames,
  extractTeams
} from './services/sportsApi-fixed';

function App() {
  const [filteredGames, setFilteredGames] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showIncrementalMonitor, setShowIncrementalMonitor] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [useIncrementalMode, setUseIncrementalMode] = useState(true);

  // Settings state
  const [settings, setSettings] = useState({
    refreshInterval: 30,
    selectedLeagues: ['nfl', 'nhl', 'fcs', 'fbs', 'mlb', 'bundesliga1', 'bundesliga2', 'nba', 'mls', 'ncaaw'],
    hiddenTeams: [],
    colorCoding: true
  });

  // Custom game order (for drag and drop)
  const [gameOrder, setGameOrder] = useState([]);
  
  // Sorting mode: 'custom' or 'startTime'
  const [sortMode, setSortMode] = useState('custom');

  const availableLeagues = ['nfl', 'nhl', 'fcs', 'fbs', 'mlb', 'bundesliga1', 'bundesliga2', 'nba', 'mls', 'ncaaw'];

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('sportsAppSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('sportsAppSettings', JSON.stringify(newSettings));
  };

  // Incremental updates hook
  const {
    games: incrementalGames,
    loading: incrementalLoading,
    error: incrementalError,
    lastUpdated: incrementalLastUpdated,
    loadGames: incrementalLoadGames,
    forceRefresh: incrementalForceRefresh,
    updateStats,
    recentChanges,
    changeSummary,
    liveGamesCount,
    updateFrequency
  } = useIncrementalUpdates(settings.selectedLeagues);

  // Fallback to traditional loading
  const [games, setGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Traditional fetch games data (fallback)
  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const gamesData = await fetchAllGames(settings.selectedLeagues);
      setGames(gamesData);
      setLastUpdated(new Date());
      
      // Extract teams for settings
      const teams = extractTeams(gamesData);
      setAvailableTeams(teams);
    } catch (err) {
      setError('Failed to load games. Please try again later.');
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  }, [settings.selectedLeagues]);

  // Use incremental or traditional mode
  const currentGames = useIncrementalMode ? incrementalGames : games;
  const currentLoading = useIncrementalMode ? incrementalLoading : loading;
  const currentError = useIncrementalMode ? incrementalError : error;
  const currentLastUpdated = useIncrementalMode ? incrementalLastUpdated : lastUpdated;

  // Extract teams when games change
  useEffect(() => {
    if (Object.keys(currentGames).length > 0) {
      const teams = extractTeams(currentGames);
      setAvailableTeams(teams);
    }
  }, [currentGames]);

  // Initial load for traditional mode
  useEffect(() => {
    if (!useIncrementalMode) {
      loadGames();
    }
  }, [loadGames, useIncrementalMode]);

  // Auto-refresh for traditional mode
  useEffect(() => {
    if (!useIncrementalMode) {
      const interval = setInterval(() => {
        loadGames();
      }, settings.refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [loadGames, settings.refreshInterval, useIncrementalMode]);

  // Memoized filtered and sorted games to prevent unnecessary recalculations
  const filteredAndSortedGames = useMemo(() => {
    const allGames = [];
    
    // Combine all games from selected leagues
    settings.selectedLeagues.forEach(league => {
      if (currentGames[league]) {
        allGames.push(...currentGames[league]);
      }
    });

    // Filter out hidden teams
    const visibleGames = allGames.filter(game => {
      const homeTeamHidden = settings.hiddenTeams.map(id => id.toLowerCase()).includes((game.league + game.homeTeam.id).toLowerCase());
      const awayTeamHidden = settings.hiddenTeams.map(id => id.toLowerCase()).includes((game.league + game.awayTeam.id).toLowerCase());
      return !homeTeamHidden && !awayTeamHidden;
    });

    let finalGames = [];
    
    if (sortMode === 'startTime') {
      // Sort by game status: Ongoing (live/intermission), Scheduled, Final
      finalGames = visibleGames.sort((a, b) => {
        // Define game status categories
        const getGameCategory = (game) => {
          // Ongoing games (live or in intermission)
          if (game.status.type === 'STATUS_IN_PROGRESS' ||
              game.status.type === 'STATUS_HALFTIME' ||
              game.status.type === 'STATUS_BREAK' ||
              game.status.type === 'STATUS_INTERMISSION' ||
              game.status.type === 'STATUS_END_PERIOD') {
            return 1; // Ongoing - highest priority
          }
          // Final games
          else if (game.status.type === 'STATUS_FINAL' ||
                   game.status.type === 'STATUS_FINAL_OT' ||
                   game.status.type === 'STATUS_FINAL_SO') {
            return 3; // Final - lowest priority
          }
          // Scheduled games (not started yet)
          else {
            return 2; // Scheduled - middle priority
          }
        };
        
        const aCat = getGameCategory(a);
        const bCat = getGameCategory(b);
        
        // Sort by category first
        if (aCat !== bCat) {
          return aCat - bCat;
        }
        
        // Within same category, sort by start time
        return new Date(a.date) - new Date(b.date);
      });
    } else {
      // Custom sort mode - use smart ordering and custom order
      const sortedGames = sortGames(visibleGames);
      
      // Apply custom order if it exists and is valid
      if (gameOrder.length > 0) {
        const orderedGames = [];
        const gameMap = new Map(sortedGames.map(game => [`${game.league}-${game.id}`, game]));
        
        // Add games in custom order
        gameOrder.forEach(gameId => {
          if (gameMap.has(gameId)) {
            orderedGames.push(gameMap.get(gameId));
            gameMap.delete(gameId);
          }
        });
        
        // Add any remaining games that weren't in the custom order
        orderedGames.push(...Array.from(gameMap.values()));
        
        finalGames = orderedGames;
      } else {
        finalGames = sortedGames;
      }
    }
    
    return finalGames;
  }, [currentGames, settings.selectedLeagues, settings.hiddenTeams, gameOrder, sortMode]);

  // Update filteredGames when the memoized value changes
  useEffect(() => {
    setFilteredGames(filteredAndSortedGames);
  }, [filteredAndSortedGames]);

  // Handle league selection toggle
  const handleLeagueToggle = (league) => {
    const newLeagues = settings.selectedLeagues.includes(league)
      ? settings.selectedLeagues.filter(l => l !== league)
      : [...settings.selectedLeagues, league];
    
    handleSettingsChange({
      ...settings,
      selectedLeagues: newLeagues
    });
  };

  // Handle drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    // Only allow drag and drop in custom sort mode
    if (sortMode !== 'custom') {
      return;
    }

    const items = Array.from(filteredGames);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the custom order
    const newOrder = items.map(game => `${game.league}-${game.id}`);
    setGameOrder(newOrder);
    setFilteredGames(items);
  };

  // Handle sort mode toggle
  const handleSortModeToggle = () => {
    const newMode = sortMode === 'startTime' ? 'custom' : 'startTime';
    setSortMode(newMode);
    
    // Clear custom order when switching to start time mode
    if (newMode === 'startTime') {
      setGameOrder([]);
    }
  };

  // Toggle between incremental and traditional mode
  const toggleUpdateMode = () => {
    setUseIncrementalMode(prev => !prev);
  };

  // Handle force refresh
  const handleForceRefresh = () => {
    if (useIncrementalMode) {
      incrementalForceRefresh();
    } else {
      loadGames();
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="header-minimized">
          <div className="header-menu-icon">
            <span>🏆</span>
          </div>
        </div>
        <div className="header-expanded">
          <div className="container">
            <div className="header-content">
              <div className="header-text">
                <h1>🏆 Live Sports Results</h1>
                <p>Real-time scores for NFL, NHL, College Football, MLB, and German Bundesliga</p>
                {currentLastUpdated && (
                  <div className="last-updated">
                    Last updated: {currentLastUpdated.toLocaleTimeString()}
                    {useIncrementalMode ? (
                      <span className="refresh-interval">
                        ({updateFrequency})
                      </span>
                    ) : (
                      settings.refreshInterval && (
                        <span className="refresh-interval">
                          (Updates every {settings.refreshInterval}s)
                        </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="header-controls">
                <LeagueSelector
                  selectedLeagues={settings.selectedLeagues}
                  onLeagueToggle={handleLeagueToggle}
                  availableLeagues={availableLeagues}
                />
                <div className="sort-controls">
                  <button 
                    className={`sort-button ${sortMode === 'custom' ? 'active' : ''}`}
                    onClick={() => setSortMode('custom')}
                  >
                    Custom Order
                  </button>
                  <button 
                    className={`sort-button ${sortMode === 'startTime' ? 'active' : ''}`}
                    onClick={() => setSortMode('startTime')}
                  >
                    By Start Time
                  </button>
                </div>
              </div>
              <div className="header-buttons">
                <button
                  className="update-mode-button"
                  onClick={toggleUpdateMode}
                  title={`Switch to ${useIncrementalMode ? 'Traditional' : 'Incremental'} Updates`}
                >
                  {useIncrementalMode ? '🔄' : '⏱️'}
                </button>
                <button
                  className="monitor-button"
                  onClick={() => setShowIncrementalMonitor(true)}
                  title="Incremental Updates Monitor"
                >
                  📊
                </button>
                <button
                  className="settings-button"
                  onClick={() => setShowSettings(true)}
                  title="Settings"
                >
                  ⚙️
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container">

        {currentLoading && (
          <div className="loading">
            <div className="loading-spinner">⏳</div>
            Loading games... {useIncrementalMode ? '(Incremental Mode)' : '(Traditional Mode)'}
          </div>
        )}

        {currentError && (
          <div className="error">
            <div className="error-icon">❌</div>
            {currentError}
            <button onClick={handleForceRefresh} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {!currentLoading && !currentError && (
          <>
            {filteredGames.length > 0 ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="games">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="games-grid"
                    >
                      {filteredGames.map((game, index) => (
                        <GameTile
                          key={`${game.league}-${game.id}`}
                          game={game}
                          index={index}
                          colorCoding={settings.colorCoding}
                          isDragDisabled={sortMode === 'startTime'}
                          draggableId={`${game.league}-${game.id}`}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="no-games">
                {settings.selectedLeagues.length === 0 ? (
                  <div>
                    <div className="no-games-icon">🏟️</div>
                    <h3>Select a league to view games</h3>
                    <p>Choose from NFL, NHL, FCS, FBS, MLB, or Bundesliga above to see live scores and schedules.</p>
                  </div>
                ) : (
                  <div>
                    <div className="no-games-icon">📅</div>
                    <h3>No games scheduled</h3>
                    <p>There are no games scheduled for the selected leagues in the next 4 days.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="app-info">
          <div className="refresh-info">
            <p>
              🔄 {useIncrementalMode
                ? `Smart updates: ${updateFrequency}`
                : `Updates every ${settings.refreshInterval} seconds`}
            </p>
            {useIncrementalMode && liveGamesCount > 0 && (
              <p>🔴 {liveGamesCount} live game{liveGamesCount !== 1 ? 's' : ''} active</p>
            )}
          </div>
          {useIncrementalMode && (
            <div className="incremental-info">
              <p>⚡ Incremental updates enabled - Real-time score changes</p>
            </div>
          )}
        </div>
      </main>

      <Settings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        availableTeams={availableTeams}
      />

      <IncrementalUpdatesMonitor
        isVisible={showIncrementalMonitor}
        onClose={() => setShowIncrementalMonitor(false)}
        changeSummary={changeSummary}
        updateStats={updateStats}
        updateFrequency={updateFrequency}
        liveGamesCount={liveGamesCount}
        recentChanges={recentChanges}
      />
    </div>
  );
}

export default App;