/**
 * Application Constants
 * Centralized constants for better maintainability
 */

// Animation constants
export const ANIMATION_DURATIONS = {
  SCORE_CHANGE: 15000,
  STATUS_CHANGE: 10000,
  HIGHLIGHT: 2000,
  TOAST_DEFAULT: 4000,
  MODAL_TRANSITION: 300,
} as const;

// CSS class constants
export const CSS_CLASSES = {
  GAME_TILE: 'game-tile',
  DRAGGING: 'dragging',
  WINNER: 'winner',
  LIVE: 'live',
  FINAL: 'final',
  SCHEDULED: 'scheduled',
  SCORE_HIGHLIGHT: 'score-highlight',
  STATUS_CHANGED: 'status-changed',
} as const;

// API constants
export const API_CONFIG = {
  DEFAULT_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: 30000,
  RATE_LIMIT_DELAY: 100,
} as const;

// UI constants
export const UI_CONFIG = {
  MAX_TOASTS: 5,
  ZOOM_MIN: 0.5,
  ZOOM_MAX: 2.0,
  ZOOM_STEP: 0.05,
  BREAKPOINT_MOBILE: 768,
  BREAKPOINT_TABLET: 1024,
  BREAKPOINT_DESKTOP: 1440,
} as const;

// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'sportsAppSettings',
  ZOOM: 'sportsAppZoom',
  THEME: 'sportsAppTheme',
  HIDDEN_TEAMS: 'sportsAppHiddenTeams',
} as const;

// Game status types
export const GAME_STATUS_TYPES = {
  SCHEDULED: 'STATUS_SCHEDULED',
  IN_PROGRESS: 'STATUS_IN_PROGRESS',
  HALFTIME: 'STATUS_HALFTIME',
  HALFTIME_ET: 'STATUS_HALFTIME_ET',
  OVERTIME: 'STATUS_OVERTIME',
  FIRST_HALF: 'STATUS_FIRST_HALF',
  SECOND_HALF: 'STATUS_SECOND_HALF',
  END_OF_REGULATION: 'STATUS_END_OF_REGULATION',
  EXTRA_TIME: 'STATUS_EXTRA_TIME',
  PENALTIES: 'STATUS_PENALTIES',
  BREAK: 'STATUS_BREAK',
  INTERMISSION: 'STATUS_INTERMISSION',
  END_PERIOD: 'STATUS_END_PERIOD',
  FINAL: 'STATUS_FINAL',
  POSTPONED: 'STATUS_POSTPONED',
  CANCELED: 'STATUS_CANCELED',
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  selectedLeagues: ['NFL', 'NHL', 'NBA', 'MLB'] as string[],
  refreshInterval: 30,
  colorCoding: true,
  showTeamForm: true,
  hiddenTeams: [] as string[],
  theme: 'auto' as const,
  notifications: true,
} as const;

// Validation constants
export const VALIDATION_RULES = {
  MIN_REFRESH_INTERVAL: 5,
  MAX_REFRESH_INTERVAL: 300,
  MIN_TEAM_NAME_LENGTH: 1,
  MAX_TEAM_NAME_LENGTH: 50,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  API_ERROR: 'Failed to fetch data from the API.',
  VALIDATION_ERROR: 'Validation failed. Please check your input.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
  LEAGUE_NOT_SUPPORTED: 'League is not supported.',
  INVALID_GAME_DATA: 'Invalid game data received.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SETTINGS_SAVED: 'Settings saved successfully',
  DATA_REFRESHED: 'Data refreshed successfully',
  CACHE_CLEARED: 'Cache cleared successfully',
  PREFERENCES_UPDATED: 'Preferences updated',
} as const;

// Accessibility constants
export const A11Y_LABELS = {
  GAME_TILE: 'Game information',
  SCORE_UPDATE: 'Score updated',
  STATUS_CHANGE: 'Game status changed',
  TEAM_LOGO: 'Team logo',
  SETTINGS_BUTTON: 'Open settings',
  CLOSE_BUTTON: 'Close',
  ZOOM_IN: 'Zoom in',
  ZOOM_OUT: 'Zoom out',
  RESET_ZOOM: 'Reset zoom',
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  ZOOM_IN: ['Ctrl+=', 'Cmd+='],
  ZOOM_OUT: ['Ctrl+-', 'Cmd+-'],
  RESET_ZOOM: ['Ctrl+0', 'Cmd+0'],
  ESCAPE: ['Escape'],
  ENTER: ['Enter'],
  SPACE: [' '],
} as const;

export const isGameOngoing = (status: any): boolean => {
  if (!status) return false;
  const ongoingTypes = [
    GAME_STATUS_TYPES.IN_PROGRESS,
    GAME_STATUS_TYPES.FIRST_HALF,
    GAME_STATUS_TYPES.SECOND_HALF,
    GAME_STATUS_TYPES.OVERTIME,
    GAME_STATUS_TYPES.EXTRA_TIME,
  ];
  return ongoingTypes.includes(status.type);
};

export const isGameInBreak = (status: any): boolean => {
  if (!status) return false;
  const breakTypes = [
    GAME_STATUS_TYPES.HALFTIME,
    GAME_STATUS_TYPES.HALFTIME_ET,
    GAME_STATUS_TYPES.END_OF_REGULATION,
    GAME_STATUS_TYPES.BREAK,
    GAME_STATUS_TYPES.INTERMISSION,
    GAME_STATUS_TYPES.END_PERIOD,
  ];
  return breakTypes.includes(status.type);
};

export const isGameFinal = (status: any): boolean => {
  if (!status) return false;
  return status.completed === true || status.type === GAME_STATUS_TYPES.FINAL;
};

export const isGameScheduled = (status: any): boolean => {
  if (!status) return true;
  return status.type === GAME_STATUS_TYPES.SCHEDULED;
};
