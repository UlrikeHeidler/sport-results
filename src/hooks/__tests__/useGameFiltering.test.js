import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameFiltering } from '../useGameFiltering';

const makeGame = (id, statusType, dateOffset = 0) => ({
  id,
  league: 'MLB',
  homeTeam: { id: `h-${id}`, name: 'Home', abbreviation: 'HM', score: 0 },
  awayTeam: { id: `a-${id}`, name: 'Away', abbreviation: 'AW', score: 0 },
  status: {
    type: statusType,
    completed: statusType === 'STATUS_FINAL',
    displayClock: '',
    period: 1
  },
  date: new Date(Date.now() + dateOffset * 60_000)
});

const liveGame  = (id, offset = 0) => makeGame(id, 'STATUS_IN_PROGRESS', offset);
const finalGame = (id, offset = 0) => makeGame(id, 'STATUS_FINAL', offset);
const schedGame = (id, offset = 0) => makeGame(id, 'STATUS_SCHEDULED', offset);

const render = (games, selectedLeagues = ['MLB'], hiddenTeams = [], pinnedIds = null) =>
  renderHook(() => useGameFiltering({ games, selectedLeagues, hiddenTeams, pinnedIds })).result.current;

// ─── category ordering ────────────────────────────────────────────────────────

describe('useGameFiltering — sort order', () => {
  it('puts live games before scheduled, scheduled before final', () => {
    const games = { MLB: [finalGame('f'), schedGame('s'), liveGame('l')] };
    const { filteredGames } = render(games);
    const types = filteredGames.map(g => g.status.type);
    expect(types.indexOf('STATUS_IN_PROGRESS')).toBeLessThan(types.indexOf('STATUS_SCHEDULED'));
    expect(types.indexOf('STATUS_SCHEDULED')).toBeLessThan(types.indexOf('STATUS_FINAL'));
  });

  it('sorts by start time within the same category', () => {
    const games = { MLB: [schedGame('late', 60), schedGame('early', 0)] };
    const { filteredGames } = render(games);
    expect(filteredGames[0].id).toBe('early');
    expect(filteredGames[1].id).toBe('late');
  });
});

// ─── pinned games ─────────────────────────────────────────────────────────────

describe('useGameFiltering — pinned games', () => {
  it('sorts a pinned final game above live and scheduled games', () => {
    const games = { MLB: [liveGame('live'), schedGame('sched'), finalGame('fin')] };
    const pinned = new Set(['MLB-fin']);
    const { filteredGames } = render(games, ['MLB'], [], pinned);
    expect(filteredGames[0].id).toBe('fin');
  });

  it('pins multiple games, preserving their relative time order', () => {
    const games = { MLB: [schedGame('b', 60), schedGame('a', 0)] };
    const pinned = new Set(['MLB-a', 'MLB-b']);
    const { filteredGames } = render(games, ['MLB'], [], pinned);
    expect(filteredGames[0].id).toBe('a');
    expect(filteredGames[1].id).toBe('b');
  });

  it('un-pinned games fall back to their natural position', () => {
    const games = { MLB: [finalGame('fin'), liveGame('live')] };
    const { filteredGames } = render(games, ['MLB'], [], new Set());
    expect(filteredGames[0].id).toBe('live');
  });
});

// ─── league filtering ─────────────────────────────────────────────────────────

describe('useGameFiltering — league filtering', () => {
  it('excludes games from leagues not in selectedLeagues', () => {
    const games = { MLB: [liveGame('m')], NFL: [liveGame('n')] };
    const { filteredGames } = render(games, ['MLB']);
    expect(filteredGames.every(g => g.league === 'MLB')).toBe(true);
  });

  it('returns empty array when no leagues selected', () => {
    const games = { MLB: [liveGame('m')] };
    const { filteredGames } = render(games, []);
    expect(filteredGames).toHaveLength(0);
  });
});

// ─── hidden teams ─────────────────────────────────────────────────────────────

describe('useGameFiltering — hidden teams', () => {
  it('hides games where the home team is in hiddenTeams', () => {
    const games = { MLB: [liveGame('g1')] };
    const { filteredGames } = render(games, ['MLB'], ['MLBh-g1']);
    expect(filteredGames).toHaveLength(0);
  });

  it('hides games where the away team is in hiddenTeams', () => {
    const games = { MLB: [liveGame('g2')] };
    const { filteredGames } = render(games, ['MLB'], ['MLBa-g2']);
    expect(filteredGames).toHaveLength(0);
  });

  it('keeps games where neither team is hidden', () => {
    const games = { MLB: [liveGame('g3')] };
    const { filteredGames } = render(games, ['MLB'], ['MLBh-other']);
    expect(filteredGames).toHaveLength(1);
  });
});

// ─── liveGamesCount ───────────────────────────────────────────────────────────

describe('useGameFiltering — liveGamesCount', () => {
  it('counts only live games across all loaded leagues', () => {
    const games = { MLB: [liveGame('l1'), liveGame('l2'), finalGame('f1')] };
    const { liveGamesCount } = render(games);
    expect(liveGamesCount).toBe(2);
  });

  it('returns 0 when no games are live', () => {
    const games = { MLB: [finalGame('f'), schedGame('s')] };
    const { liveGamesCount } = render(games);
    expect(liveGamesCount).toBe(0);
  });
});
