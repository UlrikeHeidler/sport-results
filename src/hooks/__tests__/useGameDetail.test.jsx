/* @vitest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGameDetail } from '../useGameDetail';

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

describe('useGameDetail', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('keeps the displayed game paired with its summary until the next summary arrives', async () => {
    const firstRequest = deferred();
    const secondRequest = deferred();
    const fetchMock = vi.fn()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    vi.stubGlobal('fetch', fetchMock);

    const firstGame = {
      id: 'game-1',
      league: 'nfl',
      snapshotFetchedAt: 100,
      status: { type: 'STATUS_IN_PROGRESS' },
      homeTeam: { score: 0 },
      awayTeam: { score: 0 },
      situation: { down: 1 }
    };
    const nextGame = {
      ...firstGame,
      snapshotFetchedAt: 200,
      situation: { down: 2 }
    };

    const { result, rerender } = renderHook(
      ({ game }) => useGameDetail(game, null),
      { initialProps: { game: firstGame } }
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => {
      firstRequest.resolve({ ok: true, json: async () => ({ snapshot: 100 }) });
      await firstRequest.promise;
    });
    await waitFor(() => expect(result.current.data).toEqual({ snapshot: 100 }));
    expect(result.current.displayGame.snapshotFetchedAt).toBe(100);

    rerender({ game: nextGame });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(result.current.data).toEqual({ snapshot: 100 });
    expect(result.current.displayGame.snapshotFetchedAt).toBe(100);

    await act(async () => {
      secondRequest.resolve({ ok: true, json: async () => ({ snapshot: 200 }) });
      await secondRequest.promise;
    });
    await waitFor(() => expect(result.current.data).toEqual({ snapshot: 200 }));
    expect(result.current.displayGame.snapshotFetchedAt).toBe(200);
  });

  it('refreshes live shootout details every five seconds', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ updated: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const game = {
      id: 'nhl-game',
      league: 'nhl',
      status: { type: 'STATUS_IN_PROGRESS', period: 5, completed: false },
      homeTeam: { score: 1 },
      awayTeam: { score: 1 },
    };
    renderHook(() => useGameDetail(game, null, 30));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});