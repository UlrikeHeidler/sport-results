import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../useSettings';

// Stub storage utils so tests don't touch localStorage or cookies
vi.mock('../../utils/storage', () => ({
  loadSettings: vi.fn(() => null),
  saveSettings: vi.fn(),
  clearSettings: vi.fn()
}));

import { loadSettings, saveSettings, clearSettings } from '../../utils/storage';

// Stub constants so the default settings are predictable
vi.mock('../../config/constants', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DEFAULT_SETTINGS: {
      selectedLeagues: ['mlb'],
      refreshInterval: 30,
      colorCoding: true,
      darkMode: false,
      showTeamForm: true,
      hiddenTeams: []
    }
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  // Provide a minimal document stub if running in node
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-theme');
  }
});

// ─── initial load ─────────────────────────────────────────────────────────────

describe('useSettings — initial load', () => {
  it('uses DEFAULT_SETTINGS when storage returns null', () => {
    loadSettings.mockReturnValue(null);
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.selectedLeagues).toEqual(['mlb']);
    expect(result.current.settings.refreshInterval).toBe(30);
  });

  it('merges saved settings over defaults on mount', async () => {
    loadSettings.mockReturnValue({ refreshInterval: 60, darkMode: true });
    const { result } = renderHook(() => useSettings());
    // Wait for the effect to run
    await act(async () => {});
    expect(result.current.settings.refreshInterval).toBe(60);
    expect(result.current.settings.darkMode).toBe(true);
    // Defaults not in storage are preserved
    expect(result.current.settings.colorCoding).toBe(true);
  });
});

// ─── handleSettingsChange ─────────────────────────────────────────────────────

describe('useSettings — handleSettingsChange', () => {
  it('updates settings state', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.handleSettingsChange({ ...result.current.settings, refreshInterval: 45 });
    });
    expect(result.current.settings.refreshInterval).toBe(45);
  });

  it('persists to storage on change', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.handleSettingsChange({ ...result.current.settings, refreshInterval: 45 });
    });
    expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({ refreshInterval: 45 }));
  });

  it('sets data-theme to dark when darkMode is true', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.handleSettingsChange({ ...result.current.settings, darkMode: true });
    });
    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    }
  });
});

// ─── handleLeagueToggle ───────────────────────────────────────────────────────

describe('useSettings — handleLeagueToggle', () => {
  it('adds a league that is not currently selected', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.handleLeagueToggle('nhl');
    });
    expect(result.current.settings.selectedLeagues).toContain('nhl');
  });

  it('removes a league that is already selected', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.handleLeagueToggle('mlb'); // mlb is in defaults
    });
    expect(result.current.settings.selectedLeagues).not.toContain('mlb');
  });
});

// ─── handleClearSettings ─────────────────────────────────────────────────────

describe('useSettings — handleClearSettings', () => {
  it('resets settings to defaults', async () => {
    loadSettings.mockReturnValue({ refreshInterval: 60 });
    const { result } = renderHook(() => useSettings());
    await act(async () => {});
    act(() => {
      result.current.handleClearSettings();
    });
    expect(result.current.settings.refreshInterval).toBe(30);
  });

  it('calls clearSettings from storage', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.handleClearSettings();
    });
    expect(clearSettings).toHaveBeenCalled();
  });
});
