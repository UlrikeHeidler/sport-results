import React, { useState } from 'react';
import './Settings.css';

const Settings = ({
  settings,
  onSettingsChange,
  isOpen,
  onClose,
  availableTeams
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [searchFilter, setSearchFilter] = useState('');

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      refreshInterval: 30,
      selectedLeagues: ['nfl', 'nhl', 'fcs', 'fbs', 'mlb', 'bundesliga1', 'bundesliga2', 'nba', 'mls', 'ncaaw'],
      hiddenTeams: [],
      colorCoding: true
    };
    setLocalSettings(defaultSettings);
  };

  const toggleHiddenTeam = (teamId) => {
    setLocalSettings(prev => ({
      ...prev,
      hiddenTeams: prev.hiddenTeams.includes(teamId)
        ? prev.hiddenTeams.filter(id => id !== teamId)
        : [...prev.hiddenTeams, teamId]
    }));
  };

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
            <div className="league-options">
              <label className="league-option">
                <input
                  type="checkbox"
                  checked={localSettings.selectedLeagues.includes('nfl')}
                  onChange={() => toggleLeague('nfl')}
                />
                <span>🏈 NFL</span>
              </label>
              <label className="league-option">
                <input
                  type="checkbox"
                  checked={localSettings.selectedLeagues.includes('nhl')}
                  onChange={() => toggleLeague('nhl')}
                />
                <span>🏒 NHL</span>
              </label>
              <label className="league-option">
                <input
                  type="checkbox"
                  checked={localSettings.selectedLeagues.includes('fcs')}
                  onChange={() => toggleLeague('fcs')}
                />
                <span>🎓 FCS</span>
              </label>
              <label className="league-option">
                <input
                  type="checkbox"
                  checked={localSettings.selectedLeagues.includes('fbs')}
                  onChange={() => toggleLeague('fbs')}
                />
                <span>🏟️ FBS</span>
              </label>
              <label className="league-option">
                <input
                  type="checkbox"
                  checked={localSettings.selectedLeagues.includes('mlb')}
                  onChange={() => toggleLeague('mlb')}
                />
                <span>⚾ MLB</span>
              </label>
              <label className="league-option">
                <input
                  type="checkbox"
                  checked={localSettings.selectedLeagues.includes('bundesliga1')}
                  onChange={() => toggleLeague('bundesliga1')}
                />
                <span>⚽ BL1</span>
              </label>
              <label className="league-option">
                <input
                  type="checkbox"
                  checked={localSettings.selectedLeagues.includes('bundesliga2')}
                  onChange={() => toggleLeague('bundesliga2')}
                />
                <span>🥅 BL2</span>
              </label>
              <label className="league-option">
                <input
                  type="checkbox"
                  checked={localSettings.selectedLeagues.includes('nba')}
                  onChange={() => toggleLeague('nba')}
                />
                <span>🥅 NBA</span>
              </label>
              <label className="league-option">
                <input
                  type="checkbox"
                  checked={localSettings.selectedLeagues.includes('mls')}
                  onChange={() => toggleLeague('mls')}
                />
                <span>⚽ MLS</span>
              </label>
              <label className="league-option">
                <input
                  type="checkbox"
                  checked={localSettings.selectedLeagues.includes('ncaaw')}
                  onChange={() => toggleLeague('ncaaw')}
                />
                <span>🥅 NCAAW</span>
              </label>
            </div>
          </div>

          {/* Color Coding */}
          <div className="setting-group">
            <h3>🎨 Display Options</h3>
            <label className="color-option">
              <input
                type="checkbox"
                checked={localSettings.colorCoding}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  colorCoding: e.target.checked
                }))}
              />
              <span>Enable color coding by league</span>
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
          <button className="reset-button" onClick={handleReset}>
            Reset to Defaults
          </button>
          <div className="action-buttons">
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button className="save-button" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;