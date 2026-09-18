import { useState, useEffect } from 'react';
import { API_ENDPOINTS, isGameOngoing } from '../config/constants';

/**
 * Fetches the ESPN summary endpoint for a game.
 * Re-fetches when refreshKey changes (baseball situation trigger) and,
 * for live games, polls on the same interval as the tile scoreboard.
 */
export function useGameDetail(game, refreshKey, pollInterval = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!game?.id || !game?.league) return;

    const endpoint = API_ENDPOINTS[(game.league || '').toLowerCase()];
    if (!endpoint) return;

    const summaryUrl = endpoint.split('?')[0].replace('/scoreboard', '/summary') + `?event=${game.id}`;

    let cancelled = false;

    const doFetch = () => {
      fetch(summaryUrl)
        .then(r => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
        .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
        .catch(e => { if (!cancelled) { setError(String(e)); setLoading(false); } });
    };

    setLoading(true);
    doFetch();

    // Poll for live games at the same interval as the scoreboard tiles
    let timer = null;
    if (pollInterval > 0 && isGameOngoing(game.status)) {
      timer = setInterval(doFetch, pollInterval * 1000);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  // refreshKey changes (baseball situation) also trigger a re-fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id, game?.league, refreshKey, pollInterval]);

  return { data, loading, error };
}
