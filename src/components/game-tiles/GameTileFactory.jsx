import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import BaseGameTile from './BaseGameTile';
import BaseballGameTile from './BaseballGameTile';
import BasketballGameTile from './BasketballGameTile';
import FootballGameTile from './FootballGameTile';
import HockeyGameTile from './HockeyGameTile';
import SoccerGameTile from './SoccerGameTile';
import './GameTiles.css';
import './GameTiles.baseball.css';
import './GameTiles.hockey.css';
import './GameTiles.football.css';
import './GameTiles.soccer.css';
import './GameTiles.basketball.css';

const GameTileFactory = ({ game, index, colorCoding = true, isDragDisabled = true, provided, snapshot, showTeamForm = true }) => {
  // Select the appropriate tile component based on league/sport
  const getTileComponent = () => {
    const league = game.league.toLowerCase();
    
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
  
  console.log('GameTileFactory rendering:', {
    componentType: TileComponent.name,
    league: game.league,
    hasSituation: !!game.situation,
    gameId: game.id
  });

  // Pass all props through to the specific tile component
  const componentProps = {
    game,
    index,
    colorCoding,
    isDragDisabled,
    isDragging: snapshot?.isDragging,
    showTeamForm
  };

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className={`game-wrapper ${snapshot?.isDragging ? 'dragging' : ''}`}
    >
      <TileComponent
        {...componentProps}
        colorCoding={colorCoding}
        isDragDisabled={isDragDisabled}
        isDragging={snapshot?.isDragging}
        animations={game.animations}
      />
    </div>
  );
};

export default GameTileFactory;