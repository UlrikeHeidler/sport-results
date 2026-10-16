import { describe, it, expect } from 'vitest';
import { detectPossession } from '../detectPossession';

describe('detectPossession helper', () => {
  it('identifies home team by abbreviation', () => {
    const competition = { situation: { possession: 'HM' } };
    const home = { id: 'h1', abbreviation: 'HM', name: 'Home Team', displayName: 'Home Team' };
    const away = { id: 'a1', abbreviation: 'AW', name: 'Away Team', displayName: 'Away Team' };

    const res = detectPossession(competition, home, away);
    expect(res.which).toBe('home');
    expect(res.label).toBe('HM');
  });

  it('identifies away team from currentPlay.team.id', () => {
    const competition = { drives: { currentPlay: { team: { id: 'a2' } } }, situation: {} };
    const home = { id: 'h2', abbreviation: 'H2', name: 'Home2', displayName: 'Home2' };
    const away = { id: 'a2', abbreviation: 'A2', name: 'Away2', displayName: 'Away2' };

    const res = detectPossession(competition, home, away);
    expect(res.which).toBe('away');
    expect(res.label).toBe('a2');
  });
});
