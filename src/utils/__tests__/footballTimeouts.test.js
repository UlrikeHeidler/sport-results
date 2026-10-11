import { describe, expect, it } from 'vitest';
import { getFootballTimeoutsRemaining } from '../footballTimeouts';

const game = {
  league: 'nfl',
  status: { period: 4 },
  homeTeam: { id: 'home' },
  awayTeam: { id: 'away' }
};

const timeout = (period, teamId, type = 'Timeout') => ({
  period: { number: period },
  type: { text: type },
  teamParticipants: [
    { id: teamId, timeout: true },
    { id: teamId === 'home' ? 'away' : 'home' }
  ]
});

describe('getFootballTimeoutsRemaining', () => {
  it('counts team timeouts only in the current half', () => {
    const summary = {
      header: { competitions: [{ status: { period: 4, type: { state: 'in' } } }] },
      plays: [
        timeout(1, 'home'),
        timeout(2, 'away'),
        timeout(3, 'home'),
        timeout(4, 'home'),
        timeout(4, 'away', 'Official Timeout')
      ]
    };

    expect(getFootballTimeoutsRemaining(summary, game)).toEqual({ home: 1, away: 3 });
  });

  it('starts with all regulation timeouts before kickoff', () => {
    expect(getFootballTimeoutsRemaining({
      header: { competitions: [{ status: { period: 0, type: { state: 'pre' } } }] },
      plays: []
    }, game)).toEqual({ home: 3, away: 3 });
  });

  it('uses the overtime timeout allowance', () => {
    const overtimeGame = { ...game, status: { period: 5 } };
    const summary = {
      header: { competitions: [{ status: { period: 5, type: { state: 'in' } } }] },
      plays: [timeout(4, 'home'), timeout(5, 'home')]
    };

    expect(getFootballTimeoutsRemaining(summary, overtimeGame)).toEqual({ home: 1, away: 2 });
  });
});