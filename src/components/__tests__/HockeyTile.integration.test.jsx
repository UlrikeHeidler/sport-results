/* @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HockeyGameTile from '../game-tiles/HockeyGameTile';

describe('HockeyGameTile integration', () => {
  it('re-renders SOG and power play when situation changes', () => {
    const initialGame = {
      id: 'h1',
      league: 'nhl',
      homeTeam: { id: 'h1', name: 'Home', abbreviation: 'HOM', score: 2 },
      awayTeam: { id: 'a1', name: 'Away', abbreviation: 'AWY', score: 1 },
      status: { type: 'STATUS_IN_PROGRESS', displayClock: '10:00' },
      situation: {
        shotCount: { home: 10, away: 8 },
        powerPlay: false
      }
    };

    const { rerender } = render(<HockeyGameTile game={initialGame} index={0} />);

    // Initial SOG present
    expect(screen.getByText(/SOG: 8/)).toBeTruthy();
    expect(screen.getByText(/SOG: 10/)).toBeTruthy();

    // Update situation: shot counts change and power play starts for home
    const updatedGame = {
      ...initialGame,
      situation: {
        shotCount: { home: 12, away: 9 },
        powerPlay: true,
        powerPlayTeam: 'Home',
        powerPlayTime: '1:23'
      }
    };

    rerender(<HockeyGameTile game={updatedGame} index={0} />);

    // Updated SOG
    expect(screen.getByText(/SOG: 9/)).toBeTruthy();
    expect(screen.getByText(/SOG: 12/)).toBeTruthy();

    // Power play text and time
    expect(screen.getByText(/Power Play: Home/)).toBeTruthy();
    expect(screen.getByText(/1:23/)).toBeTruthy();
  });
});
