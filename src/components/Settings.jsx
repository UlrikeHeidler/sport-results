import React, { useState } from 'react';
import './Settings.css';

const Settings = ({
  settings,
  onSettingsChange,
  isOpen,
  onClose,
  availableTeams,
  onClearStorage
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [searchFilter, setSearchFilter] = useState('');

  const toggleSetting = (settingName) => {
    setLocalSettings(prev => ({
      ...prev,
      [settingName]: !prev[settingName]
    }));
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      refreshInterval: 30,
      selectedLeagues: [
        // Football
        'nfl', 'fbs', 'fcs',
        // Hockey
        'nhl',
        // Baseball
        'mlb',
        // Soccer
        'bundesliga1', 'bundesliga2', 'dfb_pokal', 'ucl', 'mls',
        // Basketball
        'nba', 'ncaaw'
      ],
      hiddenTeams: [],
      colorCoding: true,
      showTeamForm: true,
      darkMode: false
    };
    setLocalSettings(defaultSettings);
  };

  const handleClearStorage = () => {
    // Clear persisted settings (localStorage + cookie) via parent handler
    if (typeof onClearStorage === 'function') {
      onClearStorage();
    }

    // Reset UI to defaults and immediately persist the defaults
    const defaultSettings = {
      refreshInterval: 30,
      selectedLeagues: [
        'nfl', 'nhl', 'fcs', 'fbs', 'mlb',
        'bundesliga1', 'bundesliga2', 'dfb_pokal', 'ucl',
        'nba', 'mls', 'ncaaw'
      ],
      hiddenTeams: [],
      colorCoding: true,
      showTeamForm: true,
      darkMode: false
    };
    setLocalSettings(defaultSettings);
    if (typeof onSettingsChange === 'function') onSettingsChange(defaultSettings);
  };

  const toggleHiddenTeam = (teamId) => {
    setLocalSettings(prev => ({
      ...prev,
      hiddenTeams: prev.hiddenTeams.includes(teamId)
        ? prev.hiddenTeams.filter(id => id !== teamId)
        : [...prev.hiddenTeams, teamId]
    }));
  };

  const leagueInfo = {
    nfl: { name: 'NFL', fullName: 'National Football League', emoji: '🏈', sport: 'Football' },
    fbs: { name: 'FBS', fullName: 'College Football FBS Division', emoji: '🏈', sport: 'Football' },
    fcs: { name: 'FCS', fullName: 'College Football FCS Division', emoji: '🏈', sport: 'Football' },
    nhl: { name: 'NHL', fullName: 'National Hockey League', emoji: '🏒', sport: 'Hockey' },
    mlb: { name: 'MLB', fullName: 'Major League Baseball', emoji: '⚾', sport: 'Baseball' },
    bundesliga1: { name: 'BL1', fullName: 'German Bundesliga 1', emoji: '⚽', sport: 'Soccer' },
    bundesliga2: { name: 'BL2', fullName: 'German Bundesliga 2', emoji: '⚽', sport: 'Soccer' },
    dfb_pokal: { name: 'DFB', fullName: 'German Cup (DFB Pokal)', emoji: '⚽', sport: 'Soccer' },
    ucl: { name: 'UCL', fullName: 'UEFA Champions League', emoji: '⚽', sport: 'Soccer' },
    mls: { name: 'MLS', fullName: 'Major League Soccer', emoji: '⚽', sport: 'Soccer' },
    nba: { name: 'NBA', fullName: 'National Basketball Association', emoji: '🏀', sport: 'Basketball' },
    ncaaw: { name: 'NCAAW', fullName: 'Womens College Basketball', emoji: '🏀', sport: 'Basketball' },
  };

  const sportGroups = [
    { sport: 'Football', leagues: ['nfl', 'fbs', 'fcs'] },
    { sport: 'Hockey', leagues: ['nhl'] },
    { sport: 'Baseball', leagues: ['mlb'] },
    { sport: 'Soccer', leagues: ['bundesliga1', 'bundesliga2', 'dfb_pokal', 'ucl', 'mls'] },
    { sport: 'Basketball', leagues: ['nba', 'ncaaw'] },
  ];

  const toggleLeague = (league) => {
    setLocalSettings(prev => ({
      ...prev,
      selectedLeagues: prev.selectedLeagues.includes(league)
        ? prev.selectedLeagues.filter(l => l !== league)
        : [...prev.selectedLeagues, league]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          {/* Refresh Interval */}
          <div className="setting-group">
            <h3>🔄 Refresh Interval</h3>
            <div className="refresh-options">
              {[10, 15, 30, 60].map(seconds => (
                <label key={seconds} className="refresh-option">
                  <input
                    type="radio"
                    name="refreshInterval"
                    value={seconds}
                    checked={localSettings.refreshInterval === seconds}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      refreshInterval: parseInt(e.target.value)
                    }))}
                  />
                  <span>{seconds}s</span>
                </label>
              ))}
            </div>
          </div>

          {/* League Selection */}
          <div className="setting-group">
            <h3>🏆 Leagues</h3>
            {sportGroups.map(group => (
              <div key={group.sport} className="league-group">
                <div className="league-group-title">{group.sport}</div>
                <div className="league-options">
                  {group.leagues.map(league => {
                    const info = leagueInfo[league];
                    const isSelected = localSettings.selectedLeagues.includes(league);
                    return (
                      <label key={league} className="league-option">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLeague(league)}
                        />
                        <span>{info.emoji} {info.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Display Options */}
          <div className="setting-group">
            <h3>🎨 Display Options</h3>
            <label className="display-option">
              <input
                type="checkbox"
                checked={localSettings.colorCoding}
                onChange={() => toggleSetting('colorCoding')}
              />
              <span>Enable color coding by league</span>
            </label>
            <label className="display-option">
              <input
                type="checkbox"
                checked={localSettings.darkMode}
                onChange={() => toggleSetting('darkMode')}
              />
              <span>Enable dark mode</span>
            </label>
            <label className="display-option">
              <input
                type="checkbox"
                checked={localSettings.showTeamForm}
                onChange={() => toggleSetting('showTeamForm')}
              />
              <span>Show team form indicators</span>
            </label>
          </div>

          {/* Hidden Teams */}
          <div className="setting-group">
            <h3>👁️ Hidden Teams</h3>
            <p className="setting-description">
              Select teams to hide from the results display
            </p>
            {/* Search Filter */}
            <div className="search-filter">
              <input
                type="text"
                placeholder="Search teams..."
                onChange={(e) => setSearchFilter(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="hidden-teams-list">
              {availableTeams
                .filter(team => 
                  searchFilter
                    ? team.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                      team.league.toLowerCase().includes(searchFilter.toLowerCase())
                    : true
                )
                .map(team => (
                  <label key={team.id} className="team-option">
                    <input
                      type="checkbox"
                      checked={localSettings.hiddenTeams.includes(team.id)}
                      onChange={() => toggleHiddenTeam(team.id)}
                    />
                    <span>{team.name} ({team.league})</span>
                  </label>
                ))
              }
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="reset-button" onClick={handleReset}>Reset to Defaults</button>
          <button className="clear-storage-button" onClick={handleClearStorage}>Clear Stored Settings</button>
          <button className="save-button" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
         