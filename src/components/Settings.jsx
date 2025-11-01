import React, { useState } from 'react';
import './Settings.css';
import { LEAGUE_INFO, SPORT_GROUPS, DEFAULT_SETTINGS } from '../config/constants';

const Settings = ({
  settings,
  onSettingsChange,
  isOpen,
  onClose,
  availableTeams,
  onClearStorage
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync localSettings with settings prop when it changes
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
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
    setLocalSettings(DEFAULT_SETTINGS);
  };

  const handleClearStorage = () => {
    // Clear persisted settings (localStorage + cookie) via parent handler
    if (typeof onClearStorage === 'function') {
      onClearStorage();
    }

    // Reset UI to defaults and immediately persist the defaults
    setLocalSettings(DEFAULT_SETTINGS);
    if (typeof onSettingsChange === 'function') onSettingsChange(DEFAULT_SETTINGS);
  };

  const toggleHiddenTeam = (teamId) => {
    setLocalSettings(prev => ({
      ...prev,
      hiddenTeams: prev.hiddenTeams.includes(teamId)
        ? prev.hiddenTeams.filter(id => id !== teamId)
        : [...prev.hiddenTeams, teamId]
    }));
  };

  // League info and sport groups now imported from constants

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
            {SPORT_GROUPS.map(group => (
              <div key={group.sport} className="league-group">
                <div className="league-group-title">{group.sport}</div>
                <div className="league-options">
                  {group.leagues.map(league => {
                    const info = LEAGUE_INFO[league];
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
         