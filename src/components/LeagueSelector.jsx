import React from 'react';

const LeagueSelector = ({ selectedLeagues, onLeagueToggle, availableLeagues }) => {
  const leagueInfo = {
    nfl: { name: 'NFL', fullName: 'National Football League', emoji: '🏈' },
    nhl: { name: 'NHL', fullName: 'National Hockey League', emoji: '🏒' },
    fcs: { name: 'FCS', fullName: 'College Football FCS Division', emoji: '🎓' },
    fbs: { name: 'FBS', fullName: 'College Football FBS Division', emoji: '🏟️' },
    mlb: { name: 'MLB', fullName: 'Major League Baseball', emoji: '⚾' },
    bundesliga1: { name: 'BL1', fullName: 'German Bundesliga 1', emoji: '⚽' },
    bundesliga2: { name: 'BL2', fullName: 'German Bundesliga 2', emoji: '🥅' }
  };

  return (
    <div className="league-selector">
      <h3>Select Leagues</h3>
      <div className="league-buttons">
        {availableLeagues.map(league => {
          const info = leagueInfo[league];
          const isSelected = selectedLeagues.includes(league);
          
          return (
            <button
              key={league}
              className={`league-button ${isSelected ? 'active' : ''}`}
              onClick={() => onLeagueToggle(league)}
              title={info.fullName}
            >
              <span className="league-emoji">{info.emoji}</span>
              <span className="league-name">{info.name}</span>
            </button>
          );
        })}
      </div>
      
      {selectedLeagues.length === 0 && (
        <p className="no-selection">Select at least one league to view games</p>
      )}
    </div>
  );
};

export default LeagueSelector;