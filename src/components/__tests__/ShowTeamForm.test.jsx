/* @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import BaseGameTile from '../game-tiles/BaseGameTile';

describe('BaseGameTile showTeamForm setting', () => {
  it('does not render team form indicators when showTeamForm is false', () => {
    const game = {
      id: 't1',
      league: 'nfl',
      homeTeam: { id: 'h1', name: 'Home', abbreviation: 'HOM', score: 10 },
      awayTeam: { id: 'a1', name: 'Away', abbreviation: 'AWY', score: 7 },
      status: { type: 'STATUS_IN_PROGRESS', displayClock: '5:00' },
      situation: null
    };

    const { container } = render(
      <BaseGameTile game={game} index={0} showTeamForm={false} />
    );

    // The team-form wrapper or any .form-indicator should not be present
    expect(container.querySelector('.team-form')).toBeNull();
    expect(container.querySelector('.form-indicator')).toBeNull();
  });
});
