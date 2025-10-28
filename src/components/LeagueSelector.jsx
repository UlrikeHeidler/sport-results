import React from 'react';

const LeagueSelector = ({ selectedLeagues, onLeagueToggle, availableLeagues }) => {
  const leagueInfo = {
    nfl: { name: 'NFL', fullName: 'National Football League', emoji: '🏈', sport: 'Football' },
    fbs: { name: 'FBS', fullName: 'College Football FBS Division', emoji: '🏈', sport: 'Football' },
    fcs: { name: 'FCS', fullName: 'College Football FCS Division', emoji: '🏈', sport: 'Football' },
    nhl: { name: 'NHL', fullName: 'National Hockey League', emoji: ' 🏒', sport: 'Hockey' },
    mlb: { name: 'MLB', fullName: 'Major League Baseball', emoji: '⚾', sport: 'Baseball' },
    bundesliga1: { name: 'BL1', fullName: 'German Bundesliga 1', emoji: '⚽', sport: 'Soccer' },
    bundesliga2: { name: 'BL2', fullName: 'German Bundesliga 2', emoji: '⚽', sport: 'Soccer' },
    dfb_pokal: { name: 'DFB', fullName: 'German Cup (DFB Pokal)', emoji: '⚽', sport: 'Soccer' },
    ucl: { name: 'UCL', fullName: 'UEFA Champions League', emoji: '⚽', sport: 'Soccer' },
    mls: { name: 'MLS', fullName: 'Major League Soccer', emoji: '⚽', sport: 'Soccer' },
    nba: { name: 'NBA', fullName: 'National Basketball Association', emoji: '🏀', sport: 'Basketball' },
    ncaaw: { name: 'NCAAW', fullName: 'Womens College Basketball', emoji: '🏀', sport: 'Basketball' },
  };

  // Group leagues by sport
  const sportGroups = [
    { sport: 'Football', leagues: ['nfl', 'fbs', 'fcs'] },
    { sport: 'Hockey', leagues: ['nhl'] },
    { sport: 'Baseball', leagues: ['mlb'] },
    { sport: 'Soccer', leagues: ['bundesliga1', 'bundesliga2', 'dfb_pokal', 'ucl', 'mls'] },
    { sport: 'Basketball', leagues: ['nba', 'ncaaw'] },
  ];

  return (
    <div className="league-selector">
      <h3>Select Leagues</h3>
      {sportGroups.map(group => (
        <div key={group.sport} className="league-group">
          <div className="league-group-title">{group.sport}</div>
          <div className="league-buttons">
            {group.leagues.filter(league => availableLeagues.includes(league)).map(league => {
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
        </div>
      ))}
      {selectedLeagues.length === 0 && (
        <p className="no-selection">Select at least one league to view games</p>
      )}
    </div>
  );
};

export default LeagueSelector;