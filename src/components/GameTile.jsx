import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { formatGameTime, getStatusClass, getLeagueColors, shouldMoveToBottom } from '../services/sportsApi';

const GameTile = ({ game, index, colorCoding = true }) => {
  const statusClass = getStatusClass(game.status);
  const timeDisplay = formatGameTime(game.date, game.status);
  const leagueColors = getLeagueColors(game.league);
  const isMovedToBottom = shouldMoveToBottom(game);

  const tileStyle = colorCoding ? {
    borderLeft: `4px solid ${leagueColors.primary}`,
    backgroundColor: leagueColors.background
  } : {};

  return (
    <Draggable draggableId={`${game.league}-${game.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`game-tile ${isMovedToBottom ? 'moved-to-bottom' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
          style={{
            ...tileStyle,
            ...provided.draggableProps.style
          }}
        >
          <div className="drag-handle">⋮⋮</div>
          <div className="game-header">
            <span
              className="league-badge"
              style={colorCoding ? {
                backgroundColor: leagueColors.primary,
                color: 'white'
              } : {}}
            >
              {game.league}
            </span>
            <span className={`game-status ${statusClass}`}>
              {game.status.type === 'STATUS_IN_PROGRESS' ? 'LIVE' :
               game.status.completed ? 'FINAL' : 'SCHEDULED'}
            </span>
          </div>

      <div className="teams">
        <div className="team">
          <div className="team-info">
            {game.awayTeam.logo && (
              <img 
                src={game.awayTeam.logo} 
                alt={`${game.awayTeam.name} logo`}
                className="team-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="team-details">
              <div className="team-name">{game.awayTeam.name}</div>
              <div className="team-abbreviation">{game.awayTeam.abbreviation}</div>
            </div>
          </div>
          <div className="team-score">{game.awayTeam.score || '0'}</div>
        </div>

        <div className="vs">@</div>

        <div className="team">
          <div className="team-info">
            {game.homeTeam.logo && (
              <img 
                src={game.homeTeam.logo} 
                alt={`${game.homeTeam.name} logo`}
                className="team-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="team-details">
              <div className="team-name">{game.homeTeam.name}</div>
              <div className="team-abbreviation">{game.homeTeam.abbreviation}</div>
            </div>
          </div>
          <div className="team-score">{game.homeTeam.score || '0'}</div>
        </div>
      </div>

      <div className="game-time">
        {timeDisplay}
      </div>

          {game.venue && game.venue !== 'TBD' && (
            <div className="game-venue">
              📍 {game.venue}
            </div>
          )}

          {isMovedToBottom && (
            <div className="bottom-indicator">
              Game finished 2+ minutes ago
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default GameTile;