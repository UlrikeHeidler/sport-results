import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import BaseGameTile from './BaseGameTile';
import BaseballGameTile from './BaseballGameTile';
import BasketballGameTile from './BasketballGameTile';
import FootballGameTile from './FootballGameTile';
import HockeyGameTile from './HockeyGameTile';
import SoccerGameTile from './SoccerGameTile';
import './GameTiles.css';

const GameTileFactory = ({ game, index, colorCoding = true, isDragDisabled = true, showTeamForm = true }) => {
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
  const draggableId = `${game.league}-${game.id}`;

  return (
    <Draggable draggableId={draggableId} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <TileComponent
            game={game}
            index={index}
            colorCoding={colorCoding}
            isDragDisabled={isDragDisabled}
            draggableId={draggableId}
            showTeamForm={showTeamForm}
            isDragging={snapshot.isDragging}
            animations={game.animations} // Pass animations if they exist
          />
        </div>
      )}
    </Draggable>
  );
};

export default GameTileFactory;