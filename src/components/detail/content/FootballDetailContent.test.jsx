import { describe, expect, it } from 'vitest';
import {
  getFootballLastPlay,
  getDriveFieldPosition,
  isHomeTeamPossession,
  yardsToFieldPosition
} from './FootballDetailContent';

describe('getFootballLastPlay', () => {
  it('prefers the most recent play from the current drive', () => {
    const activePlay = { text: 'Current drive play' };
    const data = {
      drives: {
        current: { plays: [activePlay] },
        previous: [{ plays: [{ text: 'Completed drive play' }] }]
      },
      scoringPlays: [{ text: 'Earlier scoring play' }]
    };

    expect(getFootballLastPlay(data)).toBe(activePlay);
  });

  it('falls back to the latest completed-drive play and then scoring play', () => {
    const completedPlay = { text: 'Completed drive play' };
    expect(getFootballLastPlay({
      drives: { previous: [{ plays: [completedPlay] }] },
      scoringPlays: [{ text: 'Scoring play' }]
    })).toBe(completedPlay);

    const scoringPlay = { text: 'Scoring play' };
    expect(getFootballLastPlay({ scoringPlays: [scoringPlay] })).toBe(scoringPlay);
  });
});

describe('football drive orientation', () => {
  it('uses possession identity to identify the home drive', () => {
    expect(isHomeTeamPossession({ id: 'home-id' }, { id: 'home-id' })).toBe(true);
    expect(isHomeTeamPossession({ abbreviation: 'HOM' }, { abbreviation: 'hom' })).toBe(true);
    expect(isHomeTeamPossession({ id: 'away-id', abbreviation: 'AWY' }, { id: 'home-id', abbreviation: 'HOM' })).toBe(false);
  });

  it('keeps home drives moving right-to-left and away drives left-to-right, including losses', () => {
    const homeGain = [yardsToFieldPosition(70, true), yardsToFieldPosition(60, true)];
    const homeLoss = [yardsToFieldPosition(60, true), yardsToFieldPosition(70, true)];
    const awayGain = [yardsToFieldPosition(70, false), yardsToFieldPosition(60, false)];
    const awayLoss = [yardsToFieldPosition(60, false), yardsToFieldPosition(70, false)];

    expect(homeGain[1]).toBeLessThan(homeGain[0]);
    expect(homeLoss[1]).toBeGreaterThan(homeLoss[0]);
    expect(awayGain[1]).toBeGreaterThan(awayGain[0]);
    expect(awayLoss[1]).toBeLessThan(awayLoss[0]);
  });

  it('prefers offense-relative coordinates and understands own/opponent field labels', () => {
    const home = { id: 'home-id', abbreviation: 'HOM' };
    const away = { id: 'away-id', abbreviation: 'AWY' };
    const homeDrive = { id: 'home-id', abbreviation: 'HOM' };
    const awayDrive = { id: 'away-id', abbreviation: 'AWY' };

    expect(getDriveFieldPosition({ yardsToEndzone: 30, yardLine: 30, team: { id: 'home-id' } }, true, homeDrive, home, away)).toBe(30);
    expect(getDriveFieldPosition({ text: 'Own 20' }, true, homeDrive, home, away)).toBe(80);
    expect(getDriveFieldPosition({ text: 'Opponent 20' }, true, homeDrive, home, away)).toBe(20);
    expect(getDriveFieldPosition({ text: 'Own 20' }, false, awayDrive, home, away)).toBe(20);
    expect(getDriveFieldPosition({ text: 'Opponent 20' }, false, awayDrive, home, away)).toBe(80);
  });
});