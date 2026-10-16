import { useState, useEffect } from 'react';
import { API_ENDPOINTS, isGameOngoing } from '../config/constants';

/**
 * Fetches the ESPN summary endpoint for a game.
 * Fetches once for each scoreboard snapshot. The returned game and summary are
 * kept together so the detail pane never renders different update generations.
 */
export function useGameDetail(game, refreshKey, refreshInterval = 30) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [refreshSequence, setRefreshSequence] = useState(0);

  const snapshotKey = game?.snapshotFetchedAt ?? JSON.stringify([
    game?.status,
    game?.homeTeam?.score,
    game?.awayTeam?.score,
    game?.situation
  ]);

  useEffect(() => {
    if (!isGameOngoing(game?.status)) return undefined;

    const configuredInterval = Math.max(5, Number(refreshInterval) || 30);
    const intervalSeconds = game?.league?.toLowerCase() === 'nhl' || game?.status?.period === 5
      ? 5
      : Math.min(configuredInterval, 15);
    const interval = setInterval(() => setRefreshSequence(sequence => sequence + 1), intervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [game?.id, game?.status?.type, game?.status?.period, refreshInterval]);

  useEffect(() => {
    if (!game?.id || !game?.league) return;

    const endpoint = API_ENDPOINTS[(game.league || '').toLowerCase()];
    if (!endpoint) return;

    const summaryUrl = endpoint.split('?')[0].replace('/scoreboard', '/summary') + `?event=${game.id}`;

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setRequestError(null);

    fetch(summaryUrl, { signal: controller.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then(data => {
        if (!cancelled) {
          setSnapshot({ game, data });
          setLoading(false);
        }
      })
      .catch(error => {
        if (!cancelled && error.name !== 'AbortError') {
          setRequestError(String(error));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [game?.id, game?.league, snapshotKey, refreshKey, refreshSequence]);

  const sameGame = snapshot?.game?.id === game?.id &&
    snapshot?.game?.league === game?.league;

  return {
    data: sameGame ? snapshot.data : null,
    displayGame: sameGame ? snapshot.game : game,
    loading,
    error: sameGame ? null : requestError
  };
}
