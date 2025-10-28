/* @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FootballGameTile from '../game-tiles/FootballGameTile';

describe('FootballGameTile possession marker', () => {
  it('shows possession marker based on situation.possessionWhich', () => {
    const game = {
      id: 'game-1',
      sport: 'football',
      status: { type: { name: 'STATUS_IN_PROGRESS', completed: false } },
      situation: {
        possessionWhich: 'home',
      },
      teams: {
        away: { id: 'away-1', abbreviation: 'AWY', name: 'Away Team' },
        home: { id: 'home-1', abbreviation: 'HME', name: 'Home Team' },
      },
      // legacy fields (some tiles may read these)
      homeTeam: { id: 'home-1', abbreviation: 'HME', name: 'Home Team' },
      awayTeam: { id: 'away-1', abbreviation: 'AWY', name: 'Away Team' },
    };

    const { container } = render(<FootballGameTile game={game} showTeamForm={false} />);

    // Expect exactly one possession marker (the home team)
    const markers = container.querySelectorAll('.possession-marker');
    expect(markers.length).toBe(1);
  });
});
