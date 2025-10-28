/* @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HockeyGameTile from '../game-tiles/HockeyGameTile';

describe('HockeyGameTile on-demand summary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches summary on demand and shows goalie and empty-net info', async () => {
    const mockSummary = {
      boxscore: {
        teams: [
          {
            team: { id: 'home-1' },
            goalies: [ { person: { fullName: 'Home Goalie' }, stats: { saves: 22, shots: 25 } } ],
            emptyNet: false
          },
          {
            team: { id: 'away-1' },
            goalies: [ { person: { fullName: 'Away Goalie' }, stats: { saves: 18, shots: 20 } } ],
            emptyNet: true
          }
        ]
      }
    };

    // mock fetch to return the mockSummary
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockSummary) })));

    const game = {
      id: 'h2',
      league: 'nhl',
      homeTeam: { id: 'home-1', abbreviation: 'HOM', name: 'Home' },
      awayTeam: { id: 'away-1', abbreviation: 'AWY', name: 'Away' },
      status: { type: 'STATUS_IN_PROGRESS', displayClock: '08:00' },
      situation: { shotCount: { home: 5, away: 6 } }
    };

    render(<HockeyGameTile game={game} index={0} />);

    // auto-fetch happens on mount for live games; wait for summary to be fetched and rendered
    await waitFor(() => {
      expect(screen.getByText(/Home Goalie/)).toBeTruthy();
      expect(screen.getByText(/Away Goalie/)).toBeTruthy();
      expect(screen.getByText(/Empty Net \(Away\)/)).toBeTruthy();
    });
  });
});
