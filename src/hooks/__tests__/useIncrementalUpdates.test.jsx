/* @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useIncrementalUpdates } from '../useIncrementalUpdates';
import * as manager from '../../services/incrementalUpdates';

// Simple test component that uses the hook and renders values we can assert
const TestComponent = ({ selectedLeagues }) => {
  const { games, liveGamesCount } = useIncrementalUpdates(selectedLeagues);
  const count = games?.nfl?.length ?? 0;
  const homeScore = games?.nfl?.[0]?.homeTeam?.score ?? '';
  return (
    <div>
      <div data-testid="count">{count}</div>
      <div data-testid="homeScore">{homeScore}</div>
      <div data-testid="live">{liveGamesCount}</div>
    </div>
  );
};

describe('useIncrementalUpdates hook', () => {
  let listener;

  beforeEach(() => {
    listener = null;
    // Mock manager functions
    vi.spyOn(manager, 'initializeIncrementalUpdates').mockImplementation(() => {});
    vi.spyOn(manager, 'setTrackedLeagues').mockImplementation(() => {});
    vi.spyOn(manager, 'getIncrementalCacheStats').mockImplementation(() => ({ cachedLeagues: 0, totalGames: 0 }));
    vi.spyOn(manager, 'addChangeListener').mockImplementation((cb) => {
      listener = cb;
      return () => { listener = null; };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads initial games and updates when listener fires', async () => {
    const initialGame = {
      id: 'g1',
      league: 'nfl',
      homeTeam: { id: 'h1', name: 'Home', score: 1 },
      awayTeam: { id: 'a1', name: 'Away', score: 0 },
      status: { type: 'STATUS_IN_PROGRESS' },
      situation: { down: 1 }
    };

    const updatedGame = {
      ...initialGame,
      homeTeam: { ...initialGame.homeTeam, score: 2 },
      situation: { down: 2 }
    };

    // Mock getGamesWithIncrementalUpdates to return initial games
    vi.spyOn(manager, 'getGamesWithIncrementalUpdates').mockResolvedValue({ nfl: [initialGame] });

    render(<TestComponent selectedLeagues={[ 'nfl' ]} />);

    // Wait for initial load (hook calls getGamesWithIncrementalUpdates)
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
    expect(screen.getByTestId('homeScore').textContent).toBe('1');

    // Simulate an incremental update via the saved listener
    expect(typeof listener).toBe('function');
    listener([{
      type: 'GAME_UPDATED',
      league: 'nfl',
      gameId: 'g1',
      game: updatedGame,
      changes: [{ field: 'situation' }],
      timestamp: Date.now()
    }]);

    // Now the hook should update the rendered score
    await waitFor(() => expect(screen.getByTestId('homeScore').textContent).toBe('2'));
  });
});
