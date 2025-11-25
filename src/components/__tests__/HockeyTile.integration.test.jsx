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

  const { rerender, container } = render(<HockeyGameTile game={initialGame} index={0} />);

  // Initial period/clock present (scoped to additional-info area)
  const additional = container.querySelector('.additional-info-wrapper');
  expect(additional).toBeTruthy();
  const { getByText: getByTextInAdditional } = require('@testing-library/dom');
  // the additional-info-wrapper should contain the clock text
  //expect(getByTextInAdditional(additional, /10:00/)).toBeTruthy();

  // Initial SOG present
  //expect(screen.getByText(/SOG: 8/)).toBeTruthy();
  //expect(screen.getByText(/SOG: 10/)).toBeTruthy();

    // Update situation: shot counts change and power play starts for home
    const updatedGame = {
      ...initialGame,
      status: { type: 'STATUS_IN_PROGRESS', displayClock: '05:12', period: 3 },
      situation: {
        shotCount: { home: 12, away: 9 },
        powerPlay: true,
        powerPlayTeam: 'Home',
        powerPlayTime: '1:23'
      }
    };

    rerender(<HockeyGameTile game={updatedGame} index={0} />);

  // Updated period/clock (scoped to additional-info area)
  expect(getByTextInAdditional(additional, /05:12/)).toBeTruthy();

    // Updated SOG
    expect(screen.getByText(/SOG: 9/)).toBeTruthy();
    expect(screen.getByText(/SOG: 12/)).toBeTruthy();

    // Power play text and time
    expect(screen.getByText(/Power Play: Home/)).toBeTruthy();
    expect(screen.getByText(/1:23/)).toBeTruthy();
  });
});
