import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import GameTile from './components/GameTile';
import LeagueSelector from './components/LeagueSelector';
import Settings from './components/Settings';
import {
  fetchAllGames,
  sortGames,
  extractTeams
} from './services/sportsApi-fixed';

function App() {
  const [games, setGames] = useState({});
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);

  // Settings state
  const [settings, setSettings] = useState({
    refreshInterval: 30,
    selectedLeagues: ['nfl', 'nhl', 'fcs', 'fbs', 'mlb', 'bundesliga1', 'bundesliga2'],
    hiddenTeams: [],
    colorCoding: true
  });

  // Custom game order (for drag and drop)
  const [gameOrder, setGameOrder] = useState([]);

  const availableLeagues = ['nfl', 'nhl', 'fcs', 'fbs', 'mlb', 'bundesliga1', 'bundesliga2'];

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

  // Fetch games data
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

  // Initial load
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // Auto-refresh based on settings
  useEffect(() => {
    const interval = setInterval(() => {
      loadGames();
    }, settings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [loadGames, settings.refreshInterval]);

  // Filter and sort games
  useEffect(() => {
    const allGames = [];
    
    // Combine all games from selected leagues
    settings.selectedLeagues.forEach(league => {
      if (games[league]) {
        allGames.push(...games[league]);
      }
    });

    // Filter out hidden teams
    const visibleGames = allGames.filter(game => {
      const homeTeamHidden = settings.hiddenTeams.includes(game.homeTeam.id);
      const awayTeamHidden = settings.hiddenTeams.includes(game.awayTeam.id);
      return !homeTeamHidden && !awayTeamHidden;
    });

    // Sort games with smart ordering
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
      
      setFilteredGames(orderedGames);
    } else {
      setFilteredGames(sortedGames);
    }
  }, [games, settings.selectedLeagues, settings.hiddenTeams, gameOrder]);

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

    const items = Array.from(filteredGames);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the custom order
    const newOrder = items.map(game => `${game.league}-${game.id}`);
    setGameOrder(newOrder);
    setFilteredGames(items);
  };

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-text">
              <h1>🏆 Live Sports Results</h1>
              <p>Real-time scores for NFL, NHL, College Football, MLB, and German Bundesliga</p>
              {lastUpdated && (
                <div className="last-updated">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  {settings.refreshInterval && (
                    <span className="refresh-interval">
                      (Updates every {settings.refreshInterval}s)
                    </span>
                  )}
                </div>
              )}
            </div>
            <button 
              className="settings-button"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <LeagueSelector
          selectedLeagues={settings.selectedLeagues}
          onLeagueToggle={handleLeagueToggle}
          availableLeagues={availableLeagues}
        />

        {loading && (
          <div className="loading">
            <div className="loading-spinner">⏳</div>
            Loading games...
          </div>
        )}

        {error && (
          <div className="error">
            <div className="error-icon">❌</div>
            {error}
            <button onClick={loadGames} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
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
            <p>🔄 Scores update automatically every {settings.refreshInterval} seconds</p>
          </div>
          <div className="drag-info">
            <p>↕️ Drag and drop tiles to rearrange them</p>
          </div>
        </div>
      </main>

      <Settings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        availableTeams={availableTeams}
      />
    </div>
  );
}

export default App;