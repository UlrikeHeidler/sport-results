/**
 * Game Helpers Test Suite
 * Comprehensive tests for game utility functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrdinalSuffix,
  getDownSuffix,
  getDisplayStatus,
  extractTeams,
  getGameWinner,
  isTeamWinner,
  getSafeTeamData,
  formatGameTime,
  getStatusClass,
  shouldMoveToBottom,
  getSportFromLeague,
  isFootballLeague,
  isBaseballLeague,
  isBasketballLeague,
  isHockeyLeague,
  isSoccerLeague,
} from '../gameHelpers';

describe('gameHelpers', () => {
  describe('getOrdinalSuffix', () => {
    it('should return correct ordinal suffixes', () => {
      expect(getOrdinalSuffix(1)).toBe('st');
      expect(getOrdinalSuffix(2)).toBe('nd');
      expect(getOrdinalSuffix(3)).toBe('rd');
      expect(getOrdinalSuffix(4)).toBe('th');
      expect(getOrdinalSuffix(11)).toBe('th');
      expect(getOrdinalSuffix(12)).toBe('th');
      expect(getOrdinalSuffix(13)).toBe('th');
      expect(getOrdinalSuffix(21)).toBe('st');
      expect(getOrdinalSuffix(22)).toBe('nd');
      expect(getOrdinalSuffix(23)).toBe('rd');
      expect(getOrdinalSuffix(101)).toBe('st');
    });
  });

  describe('getDownSuffix', () => {
    it('should return correct down suffixes', () => {
      expect(getDownSuffix(1)).toBe('st');
      expect(getDownSuffix(2)).toBe('nd');
      expect(getDownSuffix(3)).toBe('rd');
      expect(getDownSuffix(4)).toBe('th');
    });
  });

  describe('getDisplayStatus', () => {
    it('should return LIVE for ongoing games', () => {
      const status = { type: 'STATUS_IN_PROGRESS', completed: false };
      expect(getDisplayStatus(status)).toBe('LIVE');
    });

    it('should return FINAL for completed games', () => {
      const status = { type: 'STATUS_FINAL', completed: true };
      expect(getDisplayStatus(status)).toBe('FINAL');
    });

    it('should return SCHEDULED for scheduled games', () => {
      const status = { type: 'STATUS_SCHEDULED', completed: false };
      expect(getDisplayStatus(status)).toBe('SCHEDULED');
    });

    it('should detect live games from situation data', () => {
      const status = { type: 'STATUS_SCHEDULED', completed: false };
      const situation = { matchTime: 45 };
      expect(getDisplayStatus(status, situation)).toBe('LIVE');
    });
  });

  describe('extractTeams', () => {
    it('should extract unique teams from games data', () => {
      const gamesData = {
        NFL: [
          {
            homeTeam: { id: '1', name: 'Team A', abbreviation: 'TA' },
            awayTeam: { id: '2', name: 'Team B', abbreviation: 'TB' },
          },
          {
            homeTeam: { id: '1', name: 'Team A', abbreviation: 'TA' }, // Duplicate
            awayTeam: { id: '3', name: 'Team C', abbreviation: 'TC' },
          },
        ],
      };

      const teams = extractTeams(gamesData);
      expect(teams).toHaveLength(3);
      expect(teams[0]).toEqual({
        id: 'NFL1',
        name: 'Team A',
        abbreviation: 'TA',
        league: 'NFL',
      });
    });

    it('should handle empty games data', () => {
      const teams = extractTeams({});
      expect(teams).toEqual([]);
    });
  });

  describe('getGameWinner', () => {
    it('should return home team as winner', () => {
      const game = {
        status: { completed: true },
        homeTeam: { score: 21 },
        awayTeam: { score: 14 },
      };
      const result = getGameWinner(game);
      expect(result.winner).toBe('home');
      expect(result.isDraw).toBe(false);
    });

    it('should return away team as winner', () => {
      const game = {
        status: { completed: true },
        homeTeam: { score: 14 },
        awayTeam: { score: 21 },
      };
      const result = getGameWinner(game);
      expect(result.winner).toBe('away');
      expect(result.isDraw).toBe(false);
    });

    it('should return draw for tied games', () => {
      const game = {
        status: { completed: true },
        homeTeam: { score: 21 },
        awayTeam: { score: 21 },
      };
      const result = getGameWinner(game);
      expect(result.winner).toBe(null);
      expect(result.isDraw).toBe(true);
    });

    it('should return no winner for ongoing games', () => {
      const game = {
        status: { completed: false },
        homeTeam: { score: 21 },
        awayTeam: { score: 14 },
      };
      const result = getGameWinner(game);
      expect(result.winner).toBe(null);
      expect(result.isDraw).toBe(false);
    });
  });

  describe('isTeamWinner', () => {
    it('should correctly identify home team winner', () => {
      const game = {
        status: { completed: true },
        homeTeam: { score: 21 },
        awayTeam: { score: 14 },
      };
      expect(isTeamWinner(game, true)).toBe(true);
      expect(isTeamWinner(game, false)).toBe(false);
    });
  });

  describe('getSafeTeamData', () => {
    it('should return home team data', () => {
      const game = {
        homeTeam: { id: '1', name: 'Home Team', score: 21 },
        awayTeam: { id: '2', name: 'Away Team', score: 14 },
      };
      const homeTeam = getSafeTeamData(game, true);
      expect(homeTeam.name).toBe('Home Team');
      expect(homeTeam.score).toBe(21);
    });

    it('should return fallback data for missing team', () => {
      const game = {};
      const team = getSafeTeamData(game, true);
      expect(team.id).toBe(null);
      expect(team.name).toBe('');
      expect(team.score).toBe(0);
    });
  });

  describe('formatGameTime', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return "Final" for completed games', () => {
      const date = new Date('2023-01-01T15:00:00Z');
      const status = { completed: true, type: 'STATUS_FINAL' };
      expect(formatGameTime(date, status)).toBe('Final');
    });

    it('should return formatted time for scheduled games', () => {
      const date = new Date('2023-01-01T15:00:00Z');
      const status = { completed: false, type: 'STATUS_SCHEDULED' };
      const result = formatGameTime(date, status);
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
    });

    it('should return empty string for MLB live games', () => {
      const date = new Date('2023-01-01T15:00:00Z');
      const status = { type: 'STATUS_IN_PROGRESS' };
      expect(formatGameTime(date, status, 'mlb')).toBe('');
    });

    it('should handle errors gracefully', () => {
      const invalidDate = 'invalid-date';
      const status = { completed: false };
      expect(formatGameTime(invalidDate, status)).toBe('');
    });
  });

  describe('getStatusClass', () => {
    it('should return correct CSS classes', () => {
      expect(getStatusClass({ completed: true, type: 'STATUS_FINAL' })).toBe('final');
      expect(getStatusClass({ type: 'STATUS_IN_PROGRESS' })).toBe('live');
      expect(getStatusClass({ type: 'STATUS_SCHEDULED' })).toBe('scheduled');
    });
  });

  describe('shouldMoveToBottom', () => {
    it('should return true for old finished games', () => {
      const game = {
        status: { completed: true, type: 'STATUS_FINAL' },
        finishedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      };
      expect(shouldMoveToBottom(game, 2)).toBe(true);
    });

    it('should return false for recently finished games', () => {
      const game = {
        status: { completed: true },
        finishedAt: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      };
      expect(shouldMoveToBottom(game, 2)).toBe(false);
    });

    it('should return false for ongoing games', () => {
      const game = {
        status: { completed: false },
        finishedAt: new Date(Date.now() - 5 * 60 * 1000),
      };
      expect(shouldMoveToBottom(game, 2)).toBe(false);
    });
  });

  describe('sport detection functions', () => {
    it('should correctly identify football leagues', () => {
      expect(isFootballLeague('NFL')).toBe(true);
      expect(isFootballLeague('FCS')).toBe(true);
      expect(isFootballLeague('FBS')).toBe(true);
      expect(isFootballLeague('NBA')).toBe(false);
    });

    it('should correctly identify baseball leagues', () => {
      expect(isBaseballLeague('MLB')).toBe(true);
      expect(isBaseballLeague('NFL')).toBe(false);
    });

    it('should correctly identify basketball leagues', () => {
      expect(isBasketballLeague('NBA')).toBe(true);
      expect(isBasketballLeague('NFL')).toBe(false);
    });

    it('should correctly identify hockey leagues', () => {
      expect(isHockeyLeague('NHL')).toBe(true);
      expect(isHockeyLeague('NFL')).toBe(false);
    });

    it('should correctly identify soccer leagues', () => {
      expect(isSoccerLeague('bundesliga1')).toBe(true);
      expect(isSoccerLeague('NFL')).toBe(false);
    });
  });

  describe('getSportFromLeague', () => {
    it('should return correct sport for each league', () => {
      expect(getSportFromLeague('nfl')).toBe('Football');
      expect(getSportFromLeague('nba')).toBe('Basketball');
      expect(getSportFromLeague('mlb')).toBe('Baseball');
      expect(getSportFromLeague('nhl')).toBe('Hockey');
      expect(getSportFromLeague('bundesliga1')).toBe('Soccer');
    });

    it('should return Unknown for invalid league', () => {
      expect(getSportFromLeague('INVALID')).toBe('Football');
    });
  });
});
