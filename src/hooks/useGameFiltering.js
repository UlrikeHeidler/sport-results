/**
 * Custom hook for filtering and sorting games
 * Handles complex game filtering logic and sorting modes
 */

import { useMemo } from 'react';
import { sortGames } from '../services/sportsApi';
import { isGameOngoing } from '../config/constants';

export const useGameFiltering = ({ 
  games, 
  selectedLeagues, 
  hiddenTeams, 
  gameOrder, 
  sortMode 
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
    
    if (sortMode === 'startTime') {
      // Sort by game status: Ongoing (live/intermission), Scheduled, Final
      finalGames = visibleGames.sort((a, b) => {
        // Define game status categories
        const getGameCategory = (game) => {
          // Ongoing games (live or in intermission)
          if (game.status.type === 'STATUS_IN_PROGRESS' ||
              game.status.type === 'STATUS_HALFTIME' ||
              game.status.type === 'STATUS_HALFTTIME_ET' ||
              game.status.type === 'STATUS_OVERTIME' ||
              game.status.type === 'STATUS_BREAK' ||
              game.status.type === 'STATUS_INTERMISSION' ||
              game.status.type === 'STATUS_END_PERIOD') {
            return 1; // Ongoing - highest priority
          }
          // Final games
          else if (game.status.type === 'STATUS_FINAL' ||
                   game.status.type === 'STATUS_FINAL_OT' ||
                   game.status.type === 'STATUS_FINAL_SO') {
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
    } else {
      // Custom sort mode - use smart ordering and custom order
      const sortedGames = sortGames(visibleGames);
      
      // Apply custom order if it exists and is valid
      if (gameOrder.length > 0) {
        const orderedGames = [];
        const gameMap = new Map(sortedGames.map(game => [`${game.league}-${game.id}`, game]));
        
        // Add games in custom order
        gameOrder.forEach(gameId => {
          if (gameMap.has(gameId)) {
            orderedGames.push(gameMap.get(gameId));
            gameMap.delete(gameId);
          }
        });
        
        // Add any remaining games that weren't in the custom order
        orderedGames.push(...Array.from(gameMap.values()));
        
        finalGames = orderedGames;
      } else {
        finalGames = sortedGames;
      }
    }
    
    return finalGames;
  }, [games, selectedLeagues, hiddenTeams, gameOrder, sortMode]);

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