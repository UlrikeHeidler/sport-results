import { describe, it, expect } from 'vitest';
import { detectPossession } from '../sportsApi-fixed';

// Since parseGamesData expects full ESPN-like responses, we will instead
// import the helper by requiring the file and extracting the function via
// eval of the source. Simpler approach: craft a minimal competition object
// and call detectPossession if it were exported. But detectPossession is
// currently internal — instead we'll exercise the football parsing path by
// constructing a minimal `data` object similar to ESPN's shape and assert
// the parsed game's situation contains normalized possession fields.

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
