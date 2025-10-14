import React, { useState, useEffect, useRef } from 'react';
import { formatGameTime, getStatusClass, getLeagueColors, shouldMoveToBottom } from '../../services/sportsApi';

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

const BaseGameTile = ({ 
  game, 
  index, 
  colorCoding = true, 
  isDragDisabled = true, 
  draggableId,
  renderAdditionalInfo: customRenderAdditionalInfo,
  renderScore: customRenderScore 
}) => {
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

  // ... other useEffects remain the same ...

  const tileStyle = colorCoding ? {
    borderLeft: `4px solid ${leagueColors.primary}`,
    backgroundColor: leagueColors.background
  } : {};

  // Render methods that can be overridden by sport-specific tiles
  const renderTeamLogo = (team) => (
    team.logo && (
      <img 
        src={team.logo} 
        alt={`${team.name} logo`}
        className="team-logo"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    )
  );

  const renderTeamName = (team) => (
    <div className="team-details">
      <div className={`team-name`}>
        {team.name}
      </div>
      <div className="team-abbreviation">{team.abbreviation}</div>
    </div>
  );

  const defaultRenderScore = (team, isHome) => (
    <div className={`team-score ${animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : ''}`}>
      {team.score || '0'}
    </div>
  );

  const renderScore = customRenderScore || defaultRenderScore;

  const renderTeam = (team, isHome = false) => {
    const scoreProps = {
      team,
      isHome,
      animations,
      animationClass: animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : ''
    };

    return (
      <div className="team">
        <div className="team-info">
          {renderTeamLogo(team)}
          {renderTeamName(team)}
        </div>
        {typeof customRenderScore === 'function' 
          ? customRenderScore(team, isHome, animations)
          : defaultRenderScore(team, isHome, animations)
        }
      </div>
    );
  };  const renderGameStatus = () => (
    <div className="game-header">
      <span className={`league-badge`} style={colorCoding ? {
        backgroundColor: leagueColors.primary,
        color: 'white'
      } : {}}>
        {game.league}
      </span>
      <span className={`game-status ${statusClass} ${animations.status ? 'status-changed' : ''}`}>
        {getDisplayStatus(game.status)}
      </span>
    </div>
  );

  // Use custom renderer if provided, otherwise return null
  const renderAdditionalInfo = () => {
    return customRenderAdditionalInfo ? customRenderAdditionalInfo() : null;
  };

  return (
    <div
      className={`game-tile ${isMovedToBottom ? 'moved-to-bottom' : ''} ${isDragDisabled ? 'drag-disabled' : ''}`}
      style={tileStyle}
    >
      {renderGameStatus()}
      
      <div className="teams">
        {renderTeam(game.awayTeam, false)}
        <div className="vs">@</div>
        {renderTeam(game.homeTeam, true)}
      </div>

      {renderAdditionalInfo()}

      <div className="game-time">
        {timeDisplay}
      </div>

      {isMovedToBottom && (
        <div className="bottom-indicator">
          Game finished 2+ minutes ago
        </div>
      )}
    </div>
  );
};

export default BaseGameTile;