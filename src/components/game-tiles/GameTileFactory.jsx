import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GameTileErrorBoundary } from '../ErrorBoundary';
import BaseGameTile from './BaseGameTile';
import BaseballGameTile from './BaseballGameTile';
import BasketballGameTile from './BasketballGameTile';
import FootballGameTile from './FootballGameTile';
import HockeyGameTile from './HockeyGameTile';
import SoccerGameTile from './SoccerGameTile';
import './GameTiles.css';
import { debug } from '../../utils/logger';

const GameTileFactory = ({ game, index, colorCoding = true, isDragDisabled = true, provided, snapshot, showTeamForm = true }) => {
  // Select the appropriate tile component based on league/sport
  const getTileComponent = () => {
    const league = game.league.toLowerCase();
    
    if (league === 'mlb' || league === 'wbc') {
      return BaseballGameTile;
    }

    if (league === 'nba' || league === 'ncaam' || league === 'ncaaw') {
      return BasketballGameTile;
    }
    
    if (league === 'nfl' || league === 'fcs' || league === 'fbs') {
      return FootballGameTile;
    }
    
    if (league === 'nhl') {
      return HockeyGameTile;
    }
    
    if (league === 'mls' || league === 'bundesliga1' || league === 'bundesliga2' || league === 'ucl' || league === 'dfb_pokal' || league === 'fifa_world') {
      return SoccerGameTile;
    }
    
    // Default to base tile for any other sports
    return BaseGameTile;
  };

  const TileComponent = getTileComponent();
  
  /*debug('GameTileFactory rendering:', {
    componentType: TileComponent.name,
    league: game.league,
    hasSituation: !!game.situation,
    gameId: game.id
  });*/

  // Pass all props through to the specific tile component
  const componentProps = {
    game,
    index,
    colorCoding,
    isDragDisabled,
    isDragging: snapshot?.isDragging,
    showTeamForm,
    refreshInterval: game.refreshInterval || 30
  };

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className={`game-wrapper ${snapshot?.isDragging ? 'dragging' : ''}`}
    >
      <GameTileErrorBoundary game={game}>
        <TileComponent
          {...componentProps}
          colorCoding={colorCoding}
          isDragDisabled={isDragDisabled}
          isDragging={snapshot?.isDragging}
          animations={game.animations}
        />
      </GameTileErrorBoundary>
    </div>
  );
};

export default GameTileFactory;