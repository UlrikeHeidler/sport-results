import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { incrementalUpdatesManager } from '../incrementalUpdates';
import * as api from '../sportsApi';

describe('IncrementalUpdatesManager', () => {
  beforeEach(() => {
    // Provide a simple in-memory mock for localStorage (vitest/node env)
    Object.defineProperty(global, 'localStorage', {
      value: (function () {
        let store = Object.create(null);
        return {
          getItem(key) { return store[key] ?? null; },
          setItem(key, value) { store[key] = String(value); },
          removeItem(key) { delete store[key]; },
          clear() { store = Object.create(null); },
        };
      })(),
      writable: true,
    });

    // clear cache and listeners
    incrementalUpdatesManager.clearCache();
    if (incrementalUpdatesManager.changeListeners) {
      incrementalUpdatesManager.changeListeners.clear();
    }
    // reset lastFetch
    incrementalUpdatesManager.lastFetch = new Map();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should notify listeners when a game is updated and provide cloned game objects', async () => {
    // Prepare old and new game fixtures
    const oldGame = {
      id: 'game-1',
      league: 'MLB',
      homeTeam: { id: 'h1', name: 'Home', score: 1 },
      awayTeam: { id: 'a1', name: 'Away', score: 0 },
      status: { type: 'STATUS_IN_PROGRESS', displayClock: '5:00', period: 5 },
      date: new Date().toISOString(),
    };

    const newGame = {
      ...oldGame,
      homeTeam: { ...oldGame.homeTeam, score: 2 },
    };

    // Seed cache with the old game (simulate previously cached data)
    incrementalUpdatesManager.cache.set('games_mlb', [incrementalUpdatesManager.cloneGame(oldGame)]);

    // Mock fetchGames to return the updated game
    const fetchMock = vi.spyOn(api, 'fetchGames').mockResolvedValue([newGame]);

    const changesReceived = [];
    const unsubscribe = incrementalUpdatesManager.addChangeListener((changes) => {
      changesReceived.push(...changes);
    });

    // Run update
    const result = await incrementalUpdatesManager.fetchAndUpdateLeague('mlb');

    // Assertions
    expect(fetchMock).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.league).toBe('mlb');
    // Cache should be updated
    const cached = incrementalUpdatesManager.cache.get('games_mlb') || [];
    expect(cached.length).toBe(1);
    expect(cached[0].homeTeam.score).toBe(2);

    // Listener should have been notified of one GAME_UPDATED
    expect(changesReceived.length).toBeGreaterThan(0);
    const updateChange = changesReceived.find(c => c.type === 'GAME_UPDATED');
    expect(updateChange).toBeDefined();
    expect(updateChange.game.id).toBe('game-1');
    expect(updateChange.game.homeTeam.score).toBe(2);

    // Ensure the change payload game is not the exact same reference as the cached game (defensive clones)
    expect(updateChange.game).not.toBe(cached[0]);

    unsubscribe();
  });

  it('should notify listeners when only situation changes', async () => {
    const baseGame = {
      id: 'game-2',
      league: 'mlb',
      homeTeam: { id: 'h2', name: 'Home2', score: 1 },
      awayTeam: { id: 'a2', name: 'Away2', score: 0 },
      status: { type: 'STATUS_IN_PROGRESS', displayClock: '6:00', period: 3 },
      date: new Date().toISOString(),
      situation: { balls: 1, strikes: 0, outs: 0 },
    };

    const updatedGame = {
      ...baseGame,
      situation: { balls: 3, strikes: 2, outs: 1 },
    };

    // Seed cache with the base game
    incrementalUpdatesManager.cache.set('games_mlb', [incrementalUpdatesManager.cloneGame(baseGame)]);

    const fetchMock = vi.spyOn(api, 'fetchGames').mockResolvedValue([updatedGame]);

    const changes = [];
    const unsub = incrementalUpdatesManager.addChangeListener((c) => changes.push(...c));

    await incrementalUpdatesManager.fetchAndUpdateLeague('mlb');

    expect(fetchMock).toHaveBeenCalled();
    expect(changes.length).toBeGreaterThan(0);
    const sitChange = changes.find(ch => ch.field === 'situation' || (ch.type === 'GAME_UPDATED' && ch.changes && ch.changes.some(x => x.field === 'situation')));
    // Either the top-level change will have field set or the nested changes include situation
    expect(sitChange).toBeDefined();

    unsub();
  });
});
