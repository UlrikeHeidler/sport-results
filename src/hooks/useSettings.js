/**
 * Custom hook for managing application settings
 * Handles loading, saving, and updating user preferences
 */

import { useState, useEffect, useCallback } from 'react';
import { loadSettings, saveSettings, clearSettings } from '../utils/storage';
import { DEFAULT_SETTINGS } from '../config/constants';

export const useSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = loadSettings();
      if (saved) {
        setSettings(prev => ({ ...prev, ...saved }));
        if (saved.darkMode && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Handle settings changes
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
    try {
      saveSettings(newSettings);
    } catch (e) {
      console.error('Failed to persist settings:', e);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newSettings.darkMode ? 'dark' : 'light');
    }
  }, []);

  // Handle league toggle
  const handleLeagueToggle = useCallback((league) => {
    const newLeagues = settings.selectedLeagues.includes(league)
      ? settings.selectedLeagues.filter(l => l !== league)
      : [...settings.selectedLeagues, league];
    
    handleSettingsChange({
      ...settings,
      selectedLeagues: newLeagues
    });
  }, [settings, handleSettingsChange]);

  // Clear all settings
  const handleClearSettings = useCallback(() => {
    clearSettings();
    setSettings(DEFAULT_SETTINGS);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  return {
    settings,
    handleSettingsChange,
    handleLeagueToggle,
    handleClearSettings
  };
};