/**
 * Custom hook for managing drag and drop functionality
 * Handles game reordering and sort mode management
 */

import { useState, useCallback } from 'react';

export const useDragAndDrop = (filteredGames, setFilteredGames) => {
  // Custom game order (for drag and drop)
  const [gameOrder, setGameOrder] = useState([]);
  
  // Sorting mode: 'custom' or 'startTime'
  const [sortMode, setSortMode] = useState('custom');

  // Handle drag and drop
  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;
    
    // Only allow drag and drop in custom sort mode
    if (sortMode !== 'custom') {
      return;
    }

    const items = Array.from(filteredGames);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the custom order
    const newOrder = items.map(game => `${game.league}-${game.id}`);
    setGameOrder(newOrder);
    setFilteredGames(items);
  }, [filteredGames, setFilteredGames, sortMode]);

  // Handle sort mode toggle
  const handleSortModeToggle = useCallback(() => {
    const newMode = sortMode === 'startTime' ? 'custom' : 'startTime';
    setSortMode(newMode);
    
    // Clear custom order when switching to start time mode
    if (newMode === 'startTime') {
      setGameOrder([]);
    }
  }, [sortMode]);

  // Set sort mode directly
  const setSortModeDirectly = useCallback((mode) => {
    setSortMode(mode);
    
    // Clear custom order when switching to start time mode
    if (mode === 'startTime') {
      setGameOrder([]);
    }
  }, []);

  return {
    gameOrder,
    setGameOrder,
    sortMode,
    setSortMode: setSortModeDirectly,
    handleDragEnd,
    handleSortModeToggle
  };
};