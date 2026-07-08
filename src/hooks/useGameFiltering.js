/**
 * Custom hook for filtering and sorting games
 * Handles complex game filtering logic and sorting modes
 */

import { useMemo } from 'react';
import { isGameOngoing, isGameFinal } from '../config/constants';

export const useGameFiltering = ({
  games,
  selectedLeagues,
  hiddenTeams,
  pinnedIds = null
}) => {
  const filteredAndSortedGames = useMemo(() => {
    const allGames = [];
    
    // Combine all games from selected leagues
    selectedLeagues.forEach(league => {
      if (games[league]) {
        allGames.push(...games[league]);
      }
    });

    // Filter out hidden teams
    const visibleGames = allGames.filter(game => {
      const homeTeamHidden = hiddenTeams.map(id => id.toLowerCase()).includes((game.league + game.homeTeam.id).toLowerCase());
      const awayTeamHidden = hiddenTeams.map(id => id.toLowerCase()).includes((game.league + game.awayTeam.id).toLowerCase());
      return !homeTeamHidden && !awayTeamHidden;
    });

    let finalGames = [];

    // Sort: pinned first (0), then ongoing (1), scheduled (2), final (3)
    finalGames = visibleGames.sort((a, b) => {
      const keyOf = (g) => `${g.league}-${g.id}`;
      const isPinned = (g) => pinnedIds && pinnedIds.has(keyOf(g));

      const getGameCategory = (game) => {
        if (isPinned(game)) return 0;
        if (isGameOngoing(game.status)) return 1;
        if (isGameFinal(game.status)) return 3;
        return 2;
      };

      const aCat = getGameCategory(a);
      const bCat = getGameCategory(b);

      if (aCat !== bCat) return aCat - bCat;

      // Within same category, sort by start time
      return new Date(a.date) - new Date(b.date);
    });
    
    return finalGames;
  }, [games, selectedLeagues, hiddenTeams, pinnedIds]);

  // Get live games count
  const liveGamesCount = useMemo(() => {
    let count = 0;
    Object.values(games).forEach(leagueGames => {
      count += leagueGames.filter(game => isGameOngoing(game.status)).length;
    });
    return count;
  }, [games]);

  return {
    filteredGames: filteredAndSortedGames,
    liveGamesCount
  };
};