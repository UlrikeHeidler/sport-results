/**
 * Custom hook for filtering and sorting games
 * Handles complex game filtering logic and sorting modes
 */

import { useMemo } from 'react';
import { isGameOngoing, isGameFinal } from '../config/constants';

export const useGameFiltering = ({ 
  games, 
  selectedLeagues, 
  hiddenTeams
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
    
      // Sort by game status: Ongoing (live/intermission), Scheduled, Final
      finalGames = visibleGames.sort((a, b) => {
        // Define game status categories
        const getGameCategory = (game) => {
          // Ongoing games (live or in intermission)
          if (isGameOngoing(game.status)) {
            return 1; // Ongoing - highest priority
          }
          // Final games
          else if (isGameFinal(game.status)) {
             return 3; // Final - lowest priority
          }
          // Scheduled games (not started yet)
          else {
            return 2; // Scheduled - middle priority
          }
        };
        
        const aCat = getGameCategory(a);
        const bCat = getGameCategory(b);
        
        // Sort by category first
        if (aCat !== bCat) {
          return aCat - bCat;
        }
        
        // Within same category, sort by start time
        return new Date(a.date) - new Date(b.date);
      });
    
    return finalGames;
  }, [games, selectedLeagues, hiddenTeams]);

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