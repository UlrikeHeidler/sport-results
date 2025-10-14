import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import BaseGameTile from './BaseGameTile';
import BaseballGameTile from './BaseballGameTile';
import BasketballGameTile from './BasketballGameTile';
import FootballGameTile from './FootballGameTile';
import HockeyGameTile from './HockeyGameTile';
import SoccerGameTile from './SoccerGameTile';
import './GameTiles.css';

// Small ErrorBoundary so a failing tile doesn't break the list
class TileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Tile error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="game-tile error-tile">
          <div style={{ padding: '1rem', color: 'var(--text-color)' }}>Tile failed to render</div>
        </div>
      );
    }
    return this.props.children;
  }
}

const GameTileFactory = ({ game, index, colorCoding = true, isDragDisabled = true, showTeamForm = true }) => {
  console.log('GameTileFactory rendering:', {
    league: game.league,
    gameId: game.id,
    hasSituation: !!game.situation,
    possession: game.situation?.possession
  });

  // Select the appropriate tile component based on league/sport
  const getTileComponent = () => {
    const league = String(game.league || '').toLowerCase();
    
    if (league === 'mlb') {
      return BaseballGameTile;
    }
    
    if (league === 'nba' || league === 'ncaaw') {
      return BasketballGameTile;
    }
    
    if (league === 'nfl' || league === 'fcs' || league === 'fbs') {
      return FootballGameTile;
    }
    
    if (league === 'nhl') {
      return HockeyGameTile;
    }
    
    if (league === 'mls' || league === 'bundesliga1' || league === 'bundesliga2') {
      return SoccerGameTile;
    }
    
    // Default to base tile for any other sports
    return BaseGameTile;
  };

  const TileComponent = getTileComponent();
  const draggableId = `${game.league || 'unknown'}-${game.id || Math.random().toString(36).slice(2,8)}`;

  return (
    <Draggable draggableId={draggableId} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <TileErrorBoundary>
            <TileComponent
              {...{game, index, colorCoding, isDragDisabled, draggableId, showTeamForm}}
              isDragging={snapshot.isDragging}
              animations={game.animations} // Pass animations if they exist
            />
          </TileErrorBoundary>
        </div>
      )}
    </Draggable>
  );
};

export default GameTileFactory;