import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/constants';

/**
 * Fetches the ESPN summary endpoint for a game.
 * When refreshKey changes (for live games), re-fetches to get updated box score stats.
 */
export function useGameDetail(game, refreshKey) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!game?.id || !game?.league) return;

    const endpoint = API_ENDPOINTS[(game.league || '').toLowerCase()];
    if (!endpoint) return;

    const summaryUrl = endpoint.split('?')[0].replace('/scoreboard', '/summary') + `?event=${game.id}`;

    let cancelled = false;
    setLoading(true);

    fetch(summaryUrl)
      .then(r => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(String(e)); setLoading(false); } });

    return () => { cancelled = true; };
  // refreshKey is intentionally included: changing it triggers a re-fetch for live games
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id, game?.league, refreshKey]);

  return { data, loading, error };
}
