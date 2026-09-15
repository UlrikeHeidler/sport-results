import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/constants';

/**
 * Fetches the ESPN summary endpoint for a game.
 * Derives the summary URL from the scoreboard endpoint by replacing /scoreboard → /summary.
 */
export function useGameDetail(game) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!game?.id || !game?.league) return;

    const endpoint = API_ENDPOINTS[(game.league || '').toLowerCase()];
    if (!endpoint) return;

    // Strip query string, swap path segment, add event param
    const summaryUrl = endpoint.split('?')[0].replace('/scoreboard', '/summary') + `?event=${game.id}`;

    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(null);

    fetch(summaryUrl)
      .then(r => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(String(e)); setLoading(false); } });

    return () => { cancelled = true; };
  }, [game?.id, game?.league]);

  return { data, loading, error };
}
