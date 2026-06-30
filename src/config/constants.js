/**
 * Centralized constants for the Sports Results Application
 * This file consolidates all league configurations, status types, and other constants
 * to eliminate duplication and provide a single source of truth.
 */

// ESPN API Base URL
export const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

// API endpoints for different leagues
export const API_ENDPOINTS = {
  nfl: `${ESPN_BASE_URL}/football/nfl/scoreboard`,
  nhl: `${ESPN_BASE_URL}/hockey/nhl/scoreboard`,
  fcs: `${ESPN_BASE_URL}/football/college-football/scoreboard?groups=81`,
  fbs: `${ESPN_BASE_URL}/football/college-football/scoreboard?groups=80`,
  mlb: `${ESPN_BASE_URL}/baseball/mlb/scoreboard`,
  wbc: `${ESPN_BASE_URL}/baseball/world-baseball-classic/scoreboard`,
  bundesliga1: `${ESPN_BASE_URL}/soccer/ger.1/scoreboard`,
  bundesliga2: `${ESPN_BASE_URL}/soccer/ger.2/scoreboard`,
  dfb_pokal: `${ESPN_BASE_URL}/soccer/ger.dfb_pokal/scoreboard`,
  ucl: `${ESPN_BASE_URL}/soccer/uefa.champions/scoreboard`,
  fifa_world: `${ESPN_BASE_URL}/soccer/fifa.world/scoreboard`,
  nba: `${ESPN_BASE_URL}/basketball/nba/scoreboard`,
  ncaaw: `${ESPN_BASE_URL}/basketball/womens-college-basketball/scoreboard`,
  ncaam: `${ESPN_BASE_URL}/basketball/mens-college-basketball/scoreboard`,
  mls: `${ESPN_BASE_URL}/soccer/usa.1/scoreboard`
};

// Game status types - consolidated from multiple files
export const STATUS_TYPES = {
  // Ongoing/Live statuses
  ONGOING: new Set([
    'STATUS_IN_PROGRESS',
    'STATUS_HALFTIME',
    'STATUS_HALFTIME_ET',
    'STATUS_OVERTIME',
    'STATUS_FIRST_HALF',
    'STATUS_SECOND_HALF',
    'STATUS_END_OF_REGULATION',
    'STATUS_END_OF_EXTRATIME',
    'STATUS_EXTRA_TIME',
    'STATUS_PENALTIES',
    'STATUS_SHOOTOUT',
    'STATUS_BREAK',
    'STATUS_INTERMISSION',
    'STATUS_END_PERIOD'
  ]),
  
  // Break/Intermission statuses
  IN_BREAK: new Set([
    'STATUS_HALFTIME',
    'STATUS_HALFTIME_ET',
    'STATUS_END_OF_REGULATION',
    'STATUS_END_PERIOD',
    'STATUS_BREAK',
    'STATUS_INTERMISSION'
  ]),
  
  // Final statuses
  FINAL: new Set([
    'STATUS_FINAL',
    'STATUS_FINAL_OT',
    'STATUS_FINAL_SO',
    'STATUS_FINAL_PEN'
  ]),
  
  // Scheduled status
  SCHEDULED: 'STATUS_SCHEDULED'
};

// League information with metadata
export const LEAGUE_INFO = {
  nfl: { 
    name: 'NFL', 
    fullName: 'National Football League', 
    emoji: '🏈', 
    sport: 'Football',
    category: 'professional'
  },
  fbs: { 
    name: 'FBS', 
    fullName: 'College Football FBS Division', 
    emoji: '🏈', 
    sport: 'Football',
    category: 'college'
  },
  fcs: { 
    name: 'FCS', 
    fullName: 'College Football FCS Division', 
    emoji: '🏈', 
    sport: 'Football',
    category: 'college'
  },
  nhl: { 
    name: 'NHL', 
    fullName: 'National Hockey League', 
    emoji: '🏒', 
    sport: 'Hockey',
    category: 'professional'
  },
  mlb: { 
    name: 'MLB', 
    fullName: 'Major League Baseball', 
    emoji: '⚾', 
    sport: 'Baseball',
    category: 'professional'
  },
  wbc: {
    name: 'WBC',
    fullName: 'World Baseball Classic',
    emoji: '⚾',
    sport: 'Baseball',
    category: 'international'
  },
  bundesliga1: { 
    name: 'BL1', 
    fullName: 'German Bundesliga 1', 
    emoji: '⚽', 
    sport: 'Soccer',
    category: 'professional'
  },
  bundesliga2: { 
    name: 'BL2', 
    fullName: 'German Bundesliga 2', 
    emoji: '⚽', 
    sport: 'Soccer',
    category: 'professional'
  },
  dfb_pokal: { 
    name: 'DFB', 
    fullName: 'German Cup (DFB Pokal)', 
    emoji: '⚽', 
    sport: 'Soccer',
    category: 'cup'
  },
  ucl: { 
    name: 'UCL', 
    fullName: 'UEFA Champions League', 
    emoji: '⚽', 
    sport: 'Soccer',
    category: 'international'
  },
  fifa_world: {
    name: 'FIFA',
    fullName: 'FIFA World Cup',
    emoji: '⚽',
    sport: 'Soccer',
    category: 'international'
  },
  mls: { 
    name: 'MLS', 
    fullName: 'Major League Soccer', 
    emoji: '⚽', 
    sport: 'Soccer',
    category: 'professional'
  },
  nba: { 
    name: 'NBA', 
    fullName: 'National Basketball Association', 
    emoji: '🏀', 
    sport: 'Basketball',
    category: 'professional'
  },
  ncaaw: { 
    name: 'NCAAW', 
    fullName: 'Womens College Basketball', 
    emoji: '🏀', 
    sport: 'Basketball',
    category: 'college'
  },
  ncaam: { 
    name: 'NCAAM', 
    fullName: 'Mens College Basketball', 
    emoji: '🏀',
    sport: 'Basketball',
    category: 'college'
  }
};

// League color themes - consolidated and organized
export const LEAGUE_COLORS = {
  nfl: {
    primary: '#013369',
    secondary: '#D50A0A',
    accent: '#FFB612',
    background: '#f0f8ff'
  },
  nhl: {
    primary: '#000000',
    secondary: '#C8102E',
    accent: '#FCB514',
    background: '#f0f8ff'
  },
  fcs: {
    primary: '#8B0000',
    secondary: '#FFD700',
    accent: '#228B22',
    background: '#f0f8ff'
  },
  fbs: {
    primary: '#FF8C00',
    secondary: '#4169E1',
    accent: '#32CD32',
    background: '#f0f8ff'
  },
  mlb: {
    primary: '#002D72',
    secondary: '#D50032',
    accent: '#FFFFFF',
    background: '#f0f8ff'
  },
  wbc: {
    primary: '#001F4D',
    secondary: '#E53A23',
    accent: '#FFD700',
    background: '#f0f8ff'
  },
  bundesliga1: {
    primary: '#D20515',
    secondary: '#000000',
    accent: '#FFCC02',
    background: '#f0f8ff'
  },
  bundesliga2: {
    primary: '#005CA9',
    secondary: '#FFFFFF',
    accent: '#E30613',
    background: '#f0f8ff'
  },
  dfb_pokal: {
    primary: '#008751',
    secondary: '#FFFFFF',
    accent: '#FFD700',
    background: '#f0f8ff'
  },
  ucl: {
    primary: '#1B1E3C',
    secondary: '#FFFFFF',
    accent: '#FFD700',
    background: '#f0f8ff'
  },
  nba: {
    primary: '#614304',
    secondary: '#FFFFFF',
    accent: '#FFFFFF',
    background: '#f0f8ff'
  },
  mls: {
    primary: '#D20515',
    secondary: '#000000',
    accent: '#FFCC02',
    background: '#f0f8ff'
  },
  ncaaw: {
    primary: '#614304',
    secondary: '#FFFFFF',
    accent: '#E30613',
    background: '#f0f8ff'
  },
  ncaam: {
    primary: '#614304',
    secondary: '#FFFFFF',
    accent: '#E30613',
    background: '#f0f8ff'
  }
};

// Sport groups for UI organization
export const SPORT_GROUPS = [
  { sport: 'Football', leagues: ['nfl', 'fbs', 'fcs'] },
  { sport: 'Hockey', leagues: ['nhl'] },
  { sport: 'Baseball', leagues: ['mlb', 'wbc'] },
  { sport: 'Soccer', leagues: ['bundesliga1', 'bundesliga2', 'dfb_pokal', 'ucl', 'fifa_world', 'mls'] },
  { sport: 'Basketball', leagues: ['nba', 'ncaam', 'ncaaw'] }
];

// Available leagues list
export const AVAILABLE_LEAGUES = [
  'nfl', 'fbs', 'fcs', 'nhl', 'mlb', 'wbc', 
  'bundesliga1', 'bundesliga2', 'dfb_pokal', 'ucl', 'fifa_world', 'mls',
  'nba', 'ncaam', 'ncaaw'
];

// Default settings configuration
export const DEFAULT_SETTINGS = {
  refreshInterval: 30,
  selectedLeagues: [
    'nfl', 'fbs', 'fcs', 'nhl', 'mlb', 'wbc',
    'bundesliga1', 'bundesliga2', 'dfb_pokal', 'ucl', 'fifa_world', 'mls',
    'nba', 'ncaam', 'ncaaw'
  ],
  hiddenTeams: [],
  colorCoding: true,
  showTeamForm: true,
  darkMode: false
};

// Update intervals and timing constants
export const TIMING_CONSTANTS = {
  MIN_UPDATE_INTERVAL: 5000, // 5 seconds
  MAX_UPDATE_INTERVAL: 60000, // 60 seconds
  CACHE_EXPIRY: 300000, // 5 minutes
  BATCH_UPDATE_DELAY: 1000, // 1 second
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
  MOVE_TO_BOTTOM_DELAY: 2 * 60 * 1000, // 2 minutes
  ANIMATION_DURATION: 15000 // 15 seconds
};

// Utility functions for status checking
export const isGameOngoing = (status) => {
  if (!status || !status.type) return false;
  return STATUS_TYPES.ONGOING.has(status.type);
};

export const isGameInBreak = (status) => {
  if (!status || !status.type) return false;
  return STATUS_TYPES.IN_BREAK.has(status.type);
};

export const isGameFinal = (status) => {
  if (!status || !status.type) return false;
  return STATUS_TYPES.FINAL.has(status.type) || status.completed;
};

export const isGameScheduled = (status) => {
  if (!status || !status.type) return false;
  return status.type === STATUS_TYPES.SCHEDULED;
};

// Get league colors with fallback
export const getLeagueColors = (league) => {
  return LEAGUE_COLORS[league?.toLowerCase()] || LEAGUE_COLORS.nfl;
};

// Get league info with fallback
export const getLeagueInfo = (league) => {
  return LEAGUE_INFO[league?.toLowerCase()] || LEAGUE_INFO.nfl;
};