/* @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FootballGameTile from '../game-tiles/FootballGameTile';

describe('FootballGameTile integration', () => {
  it('re-renders additional info when game prop changes', () => {
    const initialGame = {
      id: 'g1',
      league: 'nfl',
      homeTeam: { id: 'h1', name: 'Home', abbreviation: 'HOM', score: 7 },
      awayTeam: { id: 'a1', name: 'Away', abbreviation: 'AWY', score: 3 },
      status: { type: 'STATUS_IN_PROGRESS', displayClock: '12:34', period: 2 },
      situation: {
        down: 1,
        distance: 10,
        yardLine: '35',
        fieldSide: 'opponent',
        possession: 'Home'
      }
    };

    const { rerender } = render(<FootballGameTile game={initialGame} index={0} />);

    // Should render down & distance
    expect(screen.getByText(/1st & 10/)).toBeTruthy();

    // Update the game prop to new situation
    const updatedGame = {
      ...initialGame,
      situation: {
        down: 3,
        distance: 4,
        yardLine: '20',
        fieldSide: 'opponent',
        possession: 'Away'
      }
    };

    rerender(<FootballGameTile game={updatedGame} index={0} />);

    // Now it should show updated down/distance
    expect(screen.getByText(/3rd & 4/)).toBeTruthy();
  });
});
