/**
 * GameGrid Component
 * Extracted from App.jsx to handle games display and grid functionality
 */

import React from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import GameTile from '../game-tiles/GameTileFactory';
import './GameGrid.css';

/**
 * Loading state component
 */
export const LoadingState = ({ useIncrementalMode }) => (
  <div className="loading">
    <div className="loading-spinner">⏳</div>
    Loading games... {useIncrementalMode ? '(Incremental Mode)' : '(Traditional Mode)'}
  </div>
);

/**
 * Error state component
 */
export const ErrorState = ({ error, onRetry }) => (
  <div className="error">
    <div className="error-icon">❌</div>
    {error}
    <button onClick={onRetry} className="retry-button">
      Try Again
    </button>
  </div>
);

/**
 * No games state component
 */
export const NoGamesState = ({ selectedLeagues }) => (
  <div className="no-games">
    {selectedLeagues.length === 0 ? (
      <div>
        <div className="no-games-icon">🏟️</div>
        <h3>Select a league to view games</h3>
        <p>Choose from NFL, NHL, FCS, FBS, MLB, or Bundesliga above to see live scores and schedules.</p>
      </div>
    ) : (
      <div>
        <div className="no-games-icon">📅</div>
        <h3>No games scheduled</h3>
        <p>There are no games scheduled for the selected leagues in the next 4 days.</p>
      </div>
    )}
  </div>
);

/**
 * Games list component with drag and drop
 */
export const GamesList = ({ 
  filteredGames, 
  settings, 
  onDragEnd = null,
  isDragDisabled = false 
}) => (
  <DragDropContext onDragEnd={onDragEnd}>
    <Droppable droppableId="games">
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="games-grid"
        >
          {filteredGames.map((game, index) => (
            <GameTile
              key={`${game.league}-${game.id}`}
              game={{ ...game, refreshInterval: settings.refreshInterval }}
              index={index}
              colorCoding={settings.colorCoding}
              isDragDisabled={isDragDisabled}
              draggableId={`${game.league}-${game.id}`}
              showTeamForm={settings.showTeamForm}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);

/**
 * App info section
 */
export const AppInfo = ({ 
  useIncrementalMode, 
  updateFrequency, 
  refreshInterval, 
  liveGamesCount 
}) => (
  <div className="app-info">
    <div className="refresh-info">
      <p>
        🔄 {useIncrementalMode
          ? `Smart updates: ${updateFrequency}`
          : `Updates every ${refreshInterval} seconds`}
      </p>
      {useIncrementalMode && liveGamesCount > 0 && (
        <p>🔴 {liveGamesCount} live game{liveGamesCount !== 1 ? 's' : ''} active</p>
      )}
    </div>
  </div>
);

/**
 * Main GameGrid component
 */
export const GameGrid = ({
  // Data
  filteredGames,
  settings,
  
  // State
  loading,
  error,
  useIncrementalMode,
  updateFrequency,
  liveGamesCount,
  
  // Actions
  onForceRefresh,
  onDragEnd,
  
  // Options
  isDragDisabled = false
}) => {
  // Show loading state
  if (loading) {
    return <LoadingState useIncrementalMode={useIncrementalMode} />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} onRetry={onForceRefresh} />;
  }

  // Show games or no games state
  return (
    <>
      {filteredGames.length > 0 ? (
        <GamesList
          filteredGames={filteredGames}
          settings={settings}
          onDragEnd={onDragEnd}
          isDragDisabled={isDragDisabled}
        />
      ) : (
        <NoGamesState selectedLeagues={settings.selectedLeagues} />
      )}
      
      <AppInfo
        useIncrementalMode={useIncrementalMode}
        updateFrequency={updateFrequency}
        refreshInterval={settings.refreshInterval}
        liveGamesCount={liveGamesCount}
      />
    </>
  );
};

/**
 * Enhanced GameGrid with additional features
 */
export const EnhancedGameGrid = ({
  // Additional features
  enableVirtualization = false,
  enableInfiniteScroll = false,
  pageSize = 20,
  onLoadMore = null,
  
  // All GameGrid props
  ...gameGridProps
}) => {
  // For future enhancement: virtual scrolling for large datasets
  if (enableVirtualization) {
    // TODO: Implement virtual scrolling
    console.warn('Virtual scrolling not yet implemented');
  }
  
  // For future enhancement: infinite scroll
  if (enableInfiniteScroll) {
    // TODO: Implement infinite scroll
    console.warn('Infinite scroll not yet implemented');
  }
  
  return <GameGrid {...gameGridProps} />;
};

export default GameGrid;