import { describe, it, expect } from 'vitest';
import { detectPossession } from '../sportsApi-fixed';

describe('detectPossession lastPlay preference', () => {
  it('prefers lastPlay.team id over other signals', () => {
    const competitionObj = {
      situation: {
        lastPlay: { team: { id: 'home-42' }, text: 'Pass to home' },
        possession: 'Away'
      },
      drives: {}
    };

    const homeTeam = { id: 'home-42', abbreviation: 'HME', name: 'Home Team', displayName: 'Home Team' };
    const awayTeam = { id: 'away-1', abbreviation: 'AWY', name: 'Away Team', displayName: 'Away Team' };

    const result = detectPossession(competitionObj, homeTeam, awayTeam);
    expect(result.which).toBe('home');
    expect(result.label).toBe('home-42');
  });
});
