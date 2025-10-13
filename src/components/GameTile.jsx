import React, { useState, useEffect, useRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { formatGameTime, getStatusClass, getLeagueColors, shouldMoveToBottom } from '../services/sportsApi';

const getDisplayStatus = (status) => {
  const isOngoing = status.type === 'STATUS_IN_PROGRESS' ||
                 status.type === 'STATUS_HALFTIME' ||
                 status.type === 'STATUS_BREAK' ||
                 status.type === 'STATUS_INTERMISSION' ||
                 status.type === 'STATUS_END_PERIOD';
  
  if (isOngoing && status.type === 'STATUS_IN_PROGRESS') return 'LIVE';
  if (isOngoing) return 'INTERMISSION';
  if (status.completed) return 'FINAL';
  return 'SCHEDULED';
};

const GameTile = ({ game, index, colorCoding = true, isDragDisabled = true, draggableId }) => {
  const statusClass = getStatusClass(game.status);
  const timeDisplay = formatGameTime(game.date, game.status);
  const leagueColors = getLeagueColors(game.league);
  const isMovedToBottom = shouldMoveToBottom(game);
  
  // Track previous values for animations
  const prevValues = useRef({
    homeScore: game.homeTeam.score,
    awayScore: game.awayTeam.score,
    homeTeamName: game.homeTeam.name,
    awayTeamName: game.awayTeam.name,
    status: game.status.type,
    venue: game.venue,
    league: game.league
  });
  
  // Animation states
  const [animations, setAnimations] = useState({
    homeScore: false,
    awayScore: false,
    homeTeamName: false,
    awayTeamName: false,
    status: false,
    venue: false,
    league: false
  });
  
  // Generic function to handle value changes
  const handleValueChange = (key, newValue, oldValue) => {
    if (oldValue !== newValue && oldValue !== undefined) {
      setAnimations(prev => ({ ...prev, [key]: true }));
      const timer = setTimeout(() => {
        setAnimations(prev => ({ ...prev, [key]: false }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  };
  
  // Track all value changes
  useEffect(() => {
    const cleanup = handleValueChange('homeScore', game.homeTeam.score, prevValues.current.homeScore);
    prevValues.current.homeScore = game.homeTeam.score;
    return cleanup;
  }, [game.homeTeam.score]);
  
  useEffect(() => {
    const cleanup = handleValueChange('awayScore', game.awayTeam.score, prevValues.current.awayScore);
    prevValues.current.awayScore = game.awayTeam.score;
    return cleanup;
  }, [game.awayTeam.score]);
  
  useEffect(() => {
    const cleanup = handleValueChange('homeTeamName', game.homeTeam.name, prevValues.current.homeTeamName);
    prevValues.current.homeTeamName = game.homeTeam.name;
    return cleanup;
  }, [game.homeTeam.name]);
  
  useEffect(() => {
    const cleanup = handleValueChange('awayTeamName', game.awayTeam.name, prevValues.current.awayTeamName);
    prevValues.current.awayTeamName = game.awayTeam.name;
    return cleanup;
  }, [game.awayTeam.name]);
  
  useEffect(() => {
    const cleanup = handleValueChange('status', game.status.type, prevValues.current.status);
    prevValues.current.status = game.status.type;
    return cleanup;
  }, [game.status.type]);
  
  useEffect(() => {
    const cleanup = handleValueChange('venue', game.venue, prevValues.current.venue);
    prevValues.current.venue = game.venue;
    return cleanup;
  }, [game.venue]);
  
  useEffect(() => {
    const cleanup = handleValueChange('league', game.league, prevValues.current.league);
    prevValues.current.league = game.league;
    return cleanup;
  }, [game.league]);

  const tileStyle = colorCoding ? {
    borderLeft: `4px solid ${leagueColors.primary}`,
    backgroundColor: leagueColors.background
  } : {};

  // {game.venue && game.venue !== 'TBD' && (
//             <div className={`game-venue ${animations.venue ? 'venue-changed' : ''}`}>
//               📍 {game.venue}
//             </div>
//           )}

  return (
    <Draggable
      draggableId={draggableId || `${game.league}-${game.id}`}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`game-tile ${isMovedToBottom ? 'moved-to-bottom' : ''} ${snapshot.isDragging ? 'dragging' : ''} ${isDragDisabled ? 'drag-disabled' : ''} ${getDisplayStatus(game.status).toLocaleLowerCase()}`}
          style={{
            ...tileStyle,
            ...provided.draggableProps.style
          }}
        >
          {!isDragDisabled && <div className="drag-handle">⋮⋮</div>}
          <div className="game-header">
            <span
              className={`league-badge`}
              style={colorCoding ? {
                backgroundColor: leagueColors.primary,
                color: 'white'
              } : {}}
            >
              {game.league}
            </span>
            <span className={`game-status ${statusClass} ${animations.status ? 'status-changed' : ''}`}>
              {getDisplayStatus(game.status)}
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
              <div className={`team-name`}>
                {game.awayTeam.name}
              </div>
              <div className="team-abbreviation">{game.awayTeam.abbreviation}    - 
                {game.awayTeam.id}</div>
            </div>
          </div>
          <div className={`team-score ${animations.awayScore ? 'score-changed' : ''}`}>
            {game.awayTeam.score || '0'}
          </div>
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
              <div className={`team-name`}>
                {game.homeTeam.name}
              </div>
              <div className="team-abbreviation">{game.homeTeam.abbreviation}    - 
                {game.homeTeam.id}</div>
            </div>
          </div>
          <div className={`team-score ${animations.homeScore ? 'score-changed' : ''}`}>
            {game.homeTeam.score || '0'}
          </div>
        </div>
      </div>

      <div className="game-time">
        {timeDisplay}
      </div>

         

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
