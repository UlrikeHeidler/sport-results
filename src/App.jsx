import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import GameTile from './components/game-tiles/GameTileFactory';
import LeagueSelector from './components/LeagueSelector';
import Settings from './components/Settings';
import IncrementalUpdatesMonitor from './components/IncrementalUpdatesMonitor';
import Toast from './components/Toast';
import { useIncrementalUpdates } from './hooks/useIncrementalUpdates';
import { useSettings } from './hooks/useSettings';
import { useUIState } from './hooks/useUIState';
import { useGameFiltering } from './hooks/useGameFiltering';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { fetchAllGames, extractTeams } from './services/sportsApi';
import { AVAILABLE_LEAGUES } from './config/constants';

function App() {
  // Custom hooks for state management
  const { settings, handleSettingsChange, handleLeagueToggle, handleClearSettings } = useSettings();
  const {
    headerExpanded,
    setHeaderExpanded,
    showSettings,
    setShowSettings,
    showIncrementalMonitor,
    setShowIncrementalMonitor,
    toasts,
    addToast,
    removeToast
  } = useUIState();

  // Game data state
  const [filteredGames, setFilteredGames] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [useIncrementalMode, setUseIncrementalMode] = useState(true);

  // Drag and drop functionality
  const {
    gameOrder,
    setGameOrder,
    sortMode,
    setSortMode,
    handleDragEnd
  } = useDragAndDrop(filteredGames, setFilteredGames);

  // Incremental updates hook
  const {
    games: incrementalGames,
    loading: incrementalLoading,
    error: incrementalError,
    lastUpdated: incrementalLastUpdated,
    forceRefresh: incrementalForceRefresh,
    updateStats,
    recentChanges,
    changeSummary,
    liveGamesCount,
    updateFrequency
  } = useIncrementalUpdates(settings.selectedLeagues, settings.refreshInterval);

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

  // Game filtering and sorting
  const { filteredGames: processedGames } = useGameFiltering({
    games: currentGames,
    selectedLeagues: settings.selectedLeagues,
    hiddenTeams: settings.hiddenTeams,
    gameOrder,
    sortMode
  });

  // Update filteredGames when processed games change
  useEffect(() => {
    setFilteredGames(processedGames);
  }, [processedGames]);

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

  // Toggle between incremental and traditional mode
  const toggleUpdateMode = useCallback(() => {
    setUseIncrementalMode(prev => !prev);
  }, []);

  // Handle force refresh
  const handleForceRefresh = useCallback(() => {
    if (useIncrementalMode) {
      incrementalForceRefresh();
    } else {
      loadGames();
    }
  }, [useIncrementalMode, incrementalForceRefresh, loadGames]);

  // Enhanced settings change handler with toast notification
  const handleSettingsChangeWithToast = useCallback((newSettings) => {
    handleSettingsChange(newSettings);
    try { 
      addToast('Settings saved'); 
    } catch (e) { 
      /* ignore */ 
    }
  }, [handleSettingsChange, addToast]);

  // Enhanced clear settings handler with toast notification
  const handleClearSettingsWithToast = useCallback(() => {
    handleClearSettings();
    addToast('Cleared saved settings');
  }, [handleClearSettings, addToast]);

  return (
    <div className="App">
      <header className={`header${headerExpanded ? ' expanded' : ''}`}> 
        {!headerExpanded && (
          <div className="header-minimized" onClick={() => setHeaderExpanded(true)}>
            <div className="header-menu-icon">
              <span>🏆</span>
            </div>
          </div>
        )}
        {headerExpanded && (
          <div className="header-expanded">
            <button className="header-close-button" onClick={() => setHeaderExpanded(false)} title="Close header">✕</button>
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
                    availableLeagues={AVAILABLE_LEAGUES}
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
        )}
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
                          game={{ ...game, refreshInterval: settings.refreshInterval }}
                          index={index}
                          colorCoding={settings.colorCoding}
                          isDragDisabled={sortMode === 'startTime'}
                          draggableId={`${game.league}-${game.id}`}
                          showTeamForm={settings.showTeamForm}
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
        onSettingsChange={handleSettingsChangeWithToast}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        availableTeams={availableTeams}
        onClearStorage={handleClearSettingsWithToast}
      />
      
      <Toast toasts={toasts} onRemove={removeToast} />

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