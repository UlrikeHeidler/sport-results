import React, { useState, useEffect, useCallback } from 'react';
import GameTile from './components/GameTile';
import LeagueSelector from './components/LeagueSelector';
import { fetchAllGames, sortGames } from './services/sportsApi-fixed';

function App() {
  const [games, setGames] = useState({});
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedLeagues, setSelectedLeagues] = useState(['nfl', 'nhl']);

  const availableLeagues = ['nfl', 'nhl'];

  // Fetch games data
  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const gamesData = await fetchAllGames(selectedLeagues);
      setGames(gamesData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load games. Please try again later.');
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedLeagues]);

  // Initial load
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // Filter and sort games
  useEffect(() => {
    const allGames = [];
    selectedLeagues.forEach(league => {
      if (games[league]) {
        allGames.push(...games[league]);
      }
    });
    const sortedGames = sortGames(allGames);
    setFilteredGames(sortedGames);
  }, [games, selectedLeagues]);

  // Handle league selection toggle
  const handleLeagueToggle = (league) => {
    setSelectedLeagues(prev => 
      prev.includes(league)
        ? prev.filter(l => l !== league)
        : [...prev, league]
    );
  };

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <h1>🏆 Live Sports Results</h1>
          <p>Real-time scores for NHL and NFL games</p>
          {lastUpdated && (
            <div className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </header>

      <main className="container">
        <LeagueSelector
          selectedLeagues={selectedLeagues}
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
              <div className="games-grid">
                {filteredGames.map((game, index) => (
                  <div key={`${game.league}-${game.id}`} className="game-tile">
                    <div className="game-header">
                      <span className="league-badge">{game.league}</span>
                      <span className="game-status">
                        {game.status.type === 'STATUS_IN_PROGRESS' ? 'LIVE' : 
                         game.status.completed ? 'FINAL' : 'SCHEDULED'}
                      </span>
                    </div>

                    <div className="teams">
                      <div className="team">
                        <div className="team-name">{game.awayTeam.name}</div>
                        <div className="team-score">{game.awayTeam.score || '0'}</div>
                      </div>
                      <div className="vs">@</div>
                      <div className="team">
                        <div className="team-name">{game.homeTeam.name}</div>
                        <div className="team-score">{game.homeTeam.score || '0'}</div>
                      </div>
                    </div>

                    <div className="game-time">
                      {new Date(game.date).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-games">
                <div className="no-games-icon">📅</div>
                <h3>No games scheduled</h3>
                <p>There are no games scheduled for the selected leagues.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;