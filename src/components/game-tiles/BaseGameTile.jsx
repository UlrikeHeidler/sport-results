import React, { useState, useEffect, useRef } from 'react';
import { formatGameTime, getStatusClass, getLeagueColors, shouldMoveToBottom } from '../../services/sportsApi';
import { getTeamForm, getFormColor } from '../../services/teamStats';

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
  renderScore: customRenderScore,
  showTeamForm = true,
  isDragging = false
}) => {
  const statusClass = getStatusClass(game.status || {});
  const timeDisplay = formatGameTime(game.date || new Date(), game.status || {});
  const leagueColors = getLeagueColors(game.league || 'nfl');
  const isMovedToBottom = shouldMoveToBottom(game || {});
  
  // Track previous values for animations
  // Safe accessors: support both legacy top-level homeTeam/awayTeam and new teams.home/away
  const homeTeamSafe = game.homeTeam || game.teams?.home || { id: null, name: '', abbreviation: '', score: 0, logo: '' };
  const awayTeamSafe = game.awayTeam || game.teams?.away || { id: null, name: '', abbreviation: '', score: 0, logo: '' };

  const prevValues = useRef({
    homeScore: homeTeamSafe.score,
    awayScore: awayTeamSafe.score,
    homeTeamName: homeTeamSafe.name,
    awayTeamName: awayTeamSafe.name,
    status: game.status?.type,
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
    const newHomeScore = (game.homeTeam || game.teams?.home)?.score ?? 0;
    const cleanup = handleValueChange('homeScore', newHomeScore, prevValues.current.homeScore);
    prevValues.current.homeScore = newHomeScore;
    return cleanup;
  }, [game.homeTeam?.score, game.teams?.home?.score]);

  useEffect(() => {
    const newAwayScore = (game.awayTeam || game.teams?.away)?.score ?? 0;
    const cleanup = handleValueChange('awayScore', newAwayScore, prevValues.current.awayScore);
    prevValues.current.awayScore = newAwayScore;
    return cleanup;
  }, [game.awayTeam?.score, game.teams?.away?.score]);

  // ... other useEffects remain the same ...

  const tileStyle = colorCoding ? {
    borderLeft: `4px solid ${leagueColors.primary}`,
    backgroundColor: leagueColors.background
  } : {};

  // Render methods that can be overridden by sport-specific tiles
  const renderTeamLogo = (team) => (
    team?.logo ? (
      <img 
        src={team.logo} 
        alt={`${team.name} logo`}
        className="team-logo"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    ) : null
  );

  const renderTeamForm = (team) => {
    const form = getTeamForm(team.id, game.league);
    return (
      <div className="team-form">
        {form.map((result, index) => (
          <span
            key={index}
            className="form-indicator"
            style={{
              backgroundColor: getFormColor(result),
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              display: 'inline-block',
              margin: '0 2px'
            }}
            title={result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
          />
        ))}
      </div>
    );
  };

  const renderTeamName = (team, isHome) => (
    <div className="team-details">
      <div className={`team-name ${game.situation?.possession === team?.name ? 'has-possession' : ''}`}>
        <span className="abbrev">{team?.abbreviation}</span>
        {showTeamForm && team?.id && renderTeamForm(team)}
        <span className="tooltip">{team?.name}</span>
      </div>
    </div>
  );

  const defaultRenderScore = (team, isHome) => (
    <div className={`team-score ${animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : ''}`}>
      {(team?.score ?? 0) || '0'}
    </div>
  );

  const renderTeamScore = customRenderScore || defaultRenderScore;

  const renderTeam = (team, isHome = false) => {
    return (
      <div className="team">
        <div className="team-info">
          {renderTeamLogo(team)}
          {renderTeamName(team, isHome)}
        </div>
        {renderTeamScore(team, isHome, animations)}
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