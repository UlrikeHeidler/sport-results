/* @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BaseballGameTile from '../game-tiles/BaseballGameTile';

describe('BaseballGameTile integration', () => {
  it('re-renders counts and bases when situation changes', () => {
    const initialGame = {
      id: 'b1',
      league: 'mlb',
      homeTeam: { id: 'h1', name: 'Home', abbreviation: 'HOM', score: 2 },
      awayTeam: { id: 'a1', name: 'Away', abbreviation: 'AWY', score: 1 },
      status: { type: 'STATUS_IN_PROGRESS', displayClock: 'Top 5' },
      situation: {
        inning: 5,
        isTopInning: true,
        balls: 1,
        strikes: 0,
        outs: 0,
        onFirst: false,
        onSecond: false,
        onThird: false
      }
    };

    const { container, rerender } = render(<BaseballGameTile game={initialGame} index={0} />);

    // Initial counts: 1-0
    expect(screen.getByText(/1-0/)).toBeTruthy();
    expect(screen.getByText(/0 out/)).toBeTruthy();

    // No base occupied
    expect(container.querySelector('.base.first.occupied')).toBeNull();
    expect(container.querySelector('.base.third.occupied')).toBeNull();

    const updatedGame = {
      ...initialGame,
      situation: {
        inning: 5,
        isTopInning: true,
        balls: 3,
        strikes: 2,
        outs: 1,
        onFirst: true,
        onSecond: false,
        onThird: true
      }
    };

    rerender(<BaseballGameTile game={updatedGame} index={0} />);

    // Updated counts and outs
    expect(screen.getByText(/3-2/)).toBeTruthy();
    expect(screen.getByText(/1 out/)).toBeTruthy();

    // Bases occupied
    expect(container.querySelector('.base.first.occupied')).toBeTruthy();
    expect(container.querySelector('.base.third.occupied')).toBeTruthy();
  });
});
