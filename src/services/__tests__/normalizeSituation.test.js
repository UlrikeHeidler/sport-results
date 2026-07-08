import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeSituation } from '../normalizeSituation';

// detectPossession is imported inside normalizeSituation — stub it at the module level
vi.mock('../sportsApi', () => ({
  detectPossession: vi.fn(() => ({ which: null, label: null }))
}));

const makeCompetition = (overrides = {}) => ({
  status: { period: 1, clock: 600, type: { detail: 'Top 1st' } },
  situation: {},
  ...overrides
});

const makeTeam = (id = 't1') => ({
  id,
  team: { abbreviation: id.toUpperCase(), displayName: `Team ${id}`, name: `Team ${id}` }
});

// ─── null / empty guards ──────────────────────────────────────────────────────

describe('normalizeSituation — null/empty guards', () => {
  it('returns null for null situation', () => {
    expect(normalizeSituation('mlb', null, makeCompetition(), makeTeam(), makeTeam())).toBeNull();
  });

  it('returns null for empty situation object', () => {
    expect(normalizeSituation('mlb', {}, makeCompetition(), makeTeam(), makeTeam())).toBeNull();
  });
});

// ─── Baseball ─────────────────────────────────────────────────────────────────

describe('normalizeSituation — MLB', () => {
  it('maps balls, strikes, outs', () => {
    const result = normalizeSituation('mlb', { balls: 2, strikes: 1, outs: 2, inning: 5 }, makeCompetition(), makeTeam(), makeTeam());
    expect(result.balls).toBe(2);
    expect(result.strikes).toBe(1);
    expect(result.outs).toBe(2);
    expect(result.inning).toBe(5);
  });

  it('detects runners on base via onFirst/onSecond/onThird', () => {
    const result = normalizeSituation('mlb', { onFirst: true, onSecond: false, onThird: true }, makeCompetition(), makeTeam(), makeTeam());
    expect(result.onFirst).toBe(true);
    expect(result.onSecond).toBe(false);
    expect(result.onThird).toBe(true);
    expect(result.onBase).toBe(true);
  });

  it('returns null for balls/strikes when absent from situation', () => {
    const result = normalizeSituation('mlb', { inning: 3 }, makeCompetition(), makeTeam(), makeTeam());
    expect(result.balls).toBeNull();
    expect(result.strikes).toBeNull();
  });

  it('falls back to competition period for inning when situation.inning is missing', () => {
    const comp = makeCompetition({ status: { period: 7, clock: 0, type: { detail: 'Top 7th' } } });
    const result = normalizeSituation('mlb', { balls: 0 }, comp, makeTeam(), makeTeam());
    expect(result.inning).toBe(7);
  });
});

// ─── Soccer ───────────────────────────────────────────────────────────────────

describe('normalizeSituation — Soccer (MLS / Bundesliga)', () => {
  it('maps matchTime and period', () => {
    const result = normalizeSituation('bundesliga1', { matchTime: '45+2', period: 1 }, makeCompetition(), makeTeam(), makeTeam());
    expect(result.matchTime).toBe('45+2');
    expect(result.period).toBe(1);
  });

  it('defaults yellowCards and redCards to 0', () => {
    const result = normalizeSituation('mls', { matchTime: '10' }, makeCompetition(), makeTeam(), makeTeam());
    expect(result.yellowCards).toBe(0);
    expect(result.redCards).toBe(0);
  });

  it('maps shots on goal', () => {
    const result = normalizeSituation('mls', { shotsOnGoalHome: 4, shotsOnGoalAway: 2 }, makeCompetition(), makeTeam(), makeTeam());
    expect(result.shotsOnGoalHome).toBe(4);
    expect(result.shotsOnGoalAway).toBe(2);
  });
});

// ─── Hockey ───────────────────────────────────────────────────────────────────

describe('normalizeSituation — NHL', () => {
  it('returns empty timeline when situation has no plays', () => {
    const result = normalizeSituation('nhl', { lastPlay: null }, makeCompetition(), makeTeam(), makeTeam());
    expect(result.timeline).toEqual([]);
  });

  it('picks up a goal from lastPlay', () => {
    const lastPlay = {
      text: 'Power play goal',
      type: { text: 'Goal scored' },
      team: { id: 'team-a' },
      athletesInvolved: { displayName: 'Gretzky' },
      id: 'play-1'
    };
    const result = normalizeSituation('nhl', { lastPlay }, makeCompetition(), makeTeam(), makeTeam());
    expect(result.timeline).toHaveLength(1);
    expect(result.timeline[0].type).toBe('goal');
    expect(result.timeline[0].team).toBe('team-a');
  });

  it('picks up a penalty from lastPlay', () => {
    const lastPlay = {
      text: 'Hooking penalty',
      type: { text: 'Minor penalty' },
      team: { id: 'team-b' },
      id: 'play-2'
    };
    const result = normalizeSituation('nhl', { lastPlay }, makeCompetition(), makeTeam(), makeTeam());
    expect(result.timeline).toHaveLength(1);
    expect(result.timeline[0].type).toBe('penalty');
  });

  it('ignores plays that are neither goals nor penalties', () => {
    const lastPlay = {
      text: 'Faceoff won',
      type: { text: 'Faceoff' },
      team: { id: 'team-a' },
      id: 'play-3'
    };
    const result = normalizeSituation('nhl', { lastPlay }, makeCompetition(), makeTeam(), makeTeam());
    expect(result.timeline).toHaveLength(0);
  });
});

// ─── Basketball ───────────────────────────────────────────────────────────────

describe('normalizeSituation — NBA', () => {
  it('returns a numeric elapsed time', () => {
    const comp = makeCompetition({ status: { period: 2, clock: 360, type: {} } });
    const result = normalizeSituation('nba', { lastPlay: null }, comp, makeTeam(), makeTeam());
    expect(typeof result.time).toBe('number');
    expect(result.time).toBeGreaterThan(0);
  });
});
