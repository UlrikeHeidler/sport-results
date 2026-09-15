import { useState, useCallback } from 'react';

export function useDetailMode() {
  // [leftSlot, rightSlot] — each is a gameKey string or null
  const [detailGames, setDetailGames] = useState([null, null]);

  const toggleDetailMode = useCallback((gameKey) => {
    setDetailGames(prev => {
      const [s0, s1] = prev;
      // Already in a slot — remove it (collapse both toward the left)
      if (s0 === gameKey) return [s1, null];
      if (s1 === gameKey) return [s0, null];
      // Add to first empty slot
      if (s0 === null) return [gameKey, s1];
      if (s1 === null) return [s0, gameKey];
      // Both slots full — evict the oldest (slot 0) and shift
      return [s1, gameKey];
    });
  }, []);

  const clearDetailMode = useCallback(() => setDetailGames([null, null]), []);

  const isInDetailMode = useCallback(
    (gameKey) => detailGames[0] === gameKey || detailGames[1] === gameKey,
    [detailGames]
  );

  const activeDetailKeys = detailGames.filter(Boolean);

  return { detailGames, activeDetailKeys, toggleDetailMode, clearDetailMode, isInDetailMode };
}
