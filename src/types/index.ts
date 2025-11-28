/**
 * Core TypeScript type definitions for the Sports Results App
 */

import React from 'react';

// Base types
export type LeagueType = 'NFL' | 'NHL' | 'NBA' | 'MLB' | 'FCS' | 'FBS' | 'BUNDESLIGA';
export type SportType = 'football' | 'hockey' | 'basketball' | 'baseball' | 'soccer';

// Game status types
export interface GameStatus {
  type: string;
  completed: boolean;
  displayClock?: string;
  period?: number;
  detail?: string;
}

// Team types
export interface TeamData {
  id: string | number;
  name: string;
  abbreviation: string;
  displayName?: string;
  shortDisplayName?: string;
  logo?: string;
  color?: string;
  alternateColor?: string;
  score: number;
  record?: string;
  ranking?: number;
  form?: string[];
  isWinner?: boolean;
}

// Game situation types
export interface GameSituation {
  matchTime?: number;
  period?: string | number;
  displayClock?: string;
  down?: number;
  distance?: number;
  yardLine?: number;
  possession?: string;
  inning?: number;
  balls?: number;
  strikes?: number;
  outs?: number;
  onBase?: string[];
}

// Main game data interface
export interface GameData {
  id: string;
  league: LeagueType;
  date: Date | string;
  status: GameStatus;
  homeTeam: TeamData;
  awayTeam: TeamData;
  venue?: string;
  broadcast?: string;
  situation?: GameSituation;
  refreshInterval?: number;
  finishedAt?: Date | string;
  lastUpdated?: Date | string;
}

// API response types
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  url: string;
}

export interface ApiError extends Error {
  status?: number;
  endpoint?: string;
  timestamp?: string;
}

export interface LeagueGamesResponse {
  events: any[];
  leagues?: any[];
  season?: any;
}

export interface MultiLeagueResponse {
  data: Record<string, LeagueGamesResponse>;
  errors: Array<{ league: string; error: Error }>;
}

// Animation types
export interface AnimationStates {
  homeScore: boolean;
  awayScore: boolean;
  homeTeamName: boolean;
  awayTeamName: boolean;
  status: boolean;
  venue: boolean;
  league: boolean;
}

export interface ScoreHighlights {
  home: boolean;
  away: boolean;
}

export interface AnimationOptions {
  duration?: number;
  highlightDuration?: number;
  enableSound?: boolean;
}

// UI State types
export interface ModalState {
  isOpen: boolean;
  data: any;
}

export interface ToastData {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration: number;
  actions: ToastAction[];
  timestamp: number;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface LoadingState {
  loading: boolean;
  message: string;
}

// Settings types
export interface AppSettings {
  selectedLeagues: LeagueType[];
  refreshInterval: number;
  colorCoding: boolean;
  showTeamForm: boolean;
  hiddenTeams: string[];
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
}

// Form types
export interface FormFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error: string;
  hasError: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Component prop types
export interface UnifiedGameTileProps {
  game: GameData;
  index: number;
  colorCoding?: boolean;
  isDragDisabled?: boolean;
  draggableId?: string;
  showTeamForm?: boolean;
  renderAdditionalInfo?: (() => React.ReactNode) | null | undefined;
  customClassName?: string;
  provided?: any;
  snapshot?: any;
}

export interface TeamInfoProps {
  team: TeamData;
  game: GameData;
  isHome: boolean;
  showForm?: boolean;
  showRanking?: boolean;
  showPossession?: boolean;
}

export interface TeamScoreProps {
  team: TeamData;
  game: GameData;
  isHome: boolean;
  animations: AnimationStates;
}

// Cache types
export interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
}

export interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  memoryUsage: number;
}

// League configuration types
export interface LeagueColors {
  primary: string;
  secondary: string;
  background: string;
}

export interface LeagueInfo {
  name: string;
  sport: SportType;
  colors: LeagueColors;
  apiEndpoint: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event handler types
export type GameEventHandler = (game: GameData) => void;
export type TeamEventHandler = (team: TeamData, game: GameData) => void;
export type SettingsChangeHandler = (settings: Partial<AppSettings>) => void;

// Hook return types
export interface UseGameAnimationsReturn {
  animations: AnimationStates;
  isAnimating: (field: keyof AnimationStates) => boolean;
  hasAnyAnimation: boolean;
  getAnimationClass: (field: keyof AnimationStates, baseClass?: string) => string;
}

export interface UseScoreAnimationsReturn extends UseGameAnimationsReturn {
  scoreHighlights: ScoreHighlights;
  getScoreClass: (isHome: boolean) => string;
}

export interface UseModalManagerReturn {
  modals: Record<string, ModalState>;
  openModal: (modalName: string, data?: any) => void;
  closeModal: (modalName: string) => void;
  closeAllModals: () => void;
  toggleModal: (modalName: string, data?: any) => void;
  isModalOpen: (modalName: string) => boolean;
  getModalData: (modalName: string) => any;
  getOpenModals: () => string[];
  modalHistory: string[];
}

export interface UseToastManagerReturn {
  toasts: ToastData[];
  addToast: (message: string, type?: ToastData['type'], duration?: number, actions?: ToastAction[]) => number;
  removeToast: (id: number) => void;
  clearAllToasts: () => void;
  updateToast: (id: number, updates: Partial<ToastData>) => void;
  success: (message: string, duration?: number, actions?: ToastAction[]) => number;
  error: (message: string, duration?: number, actions?: ToastAction[]) => number;
  warning: (message: string, duration?: number, actions?: ToastAction[]) => number;
  info: (message: string, duration?: number, actions?: ToastAction[]) => number;
  position: string;
}
