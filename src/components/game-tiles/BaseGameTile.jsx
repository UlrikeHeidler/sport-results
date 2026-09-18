import React, { useState, useEffect, useRef } from 'react';
import { formatGameTime, getStatusClass } from '../../services/sportsApi';
import { getLeagueColors, isGameOngoing, isGameFinal } from '../../services/gameUtils';
import { TeamLogo, TeamName, TeamRanking } from '../shared/TeamInfo';

const BaseGameTile = ({
  game,
  index,
  colorCoding = true,
  isDragDisabled = true,
  draggableId,
  renderAdditionalInfo: customRenderAdditionalInfo,
  renderScore: customRenderScore,
  showTeamForm = true,
  isDragging = false,
  isPinned = false,
  onTogglePin,
  isInDetailMode = false,
  onToggleDetailMode
}) => {
  const statusClass = getStatusClass(game.status || {});
  const timeDisplay = formatGameTime(game.date || new Date(), game.status || {}, game.league);
  const leagueColors = getLeagueColors(game.league || 'nfl');
  const isMovedToBottom = isGameFinal(game.status || {});
  
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
      }, 15000); // Match the 15s CSS animation duration
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

  const defaultRenderScore = (team, isHome) => (
    <div className={`team-score ${animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : ''}`}>
      {(team?.score ?? 0) || '0'}
    </div>
  );

  const renderTeamScore = customRenderScore || defaultRenderScore;

  // Winner logic: only for completed games
  // Prefer the ESPN winner flag (handles PSO where scores are tied)
  let winner = null;
  if (game.status && game.status.completed) {
    if (game.homeTeam?.winner) winner = 'home';
    else if (game.awayTeam?.winner) winner = 'away';
    else {
      const homeScore = Number(game.homeTeam?.score ?? 0);
      const awayScore = Number(game.awayTeam?.score ?? 0);
      if (homeScore > awayScore) winner = 'home';
      else if (awayScore > homeScore) winner = 'away';
    }
  }

  const renderTeam = (team, isHome = false) => {
    const isWinner = winner && ((winner === 'home' && isHome) || (winner === 'away' && !isHome));
    const teamInfo = (
      <div className={`team-info${isHome ? ' home' : ''}`}>
        {isHome ? <TeamRanking team={team} /> : <TeamLogo team={team} />}
        <TeamName team={team} game={game} isHome={isHome} showForm={showTeamForm} />
        {isHome ? <TeamLogo team={team} /> : <TeamRanking team={team} />}
      </div>
    );
    const score = renderTeamScore(team, isHome, animations);
    return (
      <div className={`team${isWinner ? ' winner' : ''}`}>
        {isHome ? score : teamInfo}
        {isHome ? teamInfo : score}
      </div>
    );
  };

  const renderBroadcastInfo = () => {
    if (game.broadcast) {
      return (
        <div className="broadcast-info">
              {game.broadcast}
        </div>
      );
    }
    return null;
  }
  
  const renderGameStatus = () => (
    <div className={`game-header ${game.id}`}>
      <span title={game.id} className={`league-badge`} style={colorCoding ? {
        backgroundColor: leagueColors.primary,
        color: 'white'
      } : {}}>
        {game.league}
      </span>
      {!isGameFinal(game.status) && renderBroadcastInfo()}
      {onToggleDetailMode && (
        <button
          className={`detail-btn${isInDetailMode ? ' detail-btn--active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleDetailMode(); }}
          title={isInDetailMode ? 'Close detail view' : 'Open detail view'}
          aria-pressed={isInDetailMode}
        >
          🔎
        </button>
      )}
      {onTogglePin && !isGameFinal(game.status) && (
        <button
          className={`pin-btn${isPinned ? ' pin-btn--active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          title={isPinned ? 'Unpin game' : 'Pin to top'}
          aria-pressed={isPinned}
        >
          📌
        </button>
      )}
    </div>
  );

  // Use custom renderer if provided, otherwise return null
  const renderAdditionalInfo = () => {
    return customRenderAdditionalInfo ? customRenderAdditionalInfo() : null;
  };

  return (
    <div
      className={`game-tile ${statusClass} ${isMovedToBottom ? 'moved-to-bottom' : ''} ${isDragDisabled ? 'drag-disabled' : ''}`}
      style={tileStyle}
    >
      {renderGameStatus()}
      
      <div className="teams">
        {renderTeam(game.awayTeam, false)}
        <div className="vs">@</div>
        {renderTeam(game.homeTeam, true)}
      </div>

      {/* Debug information removed: avoid noisy console output in render */}

      {!isGameFinal(game.status) && (
        <div className="game-time">
          {timeDisplay}
        </div>
      )}

       {/* Render additional info — shown for live games and final games (each tile guards internally) */}
      {game.status && (isGameOngoing(game.status) || isGameFinal(game.status)) && customRenderAdditionalInfo && (
        <div className="additional-info-wrapper">
          {customRenderAdditionalInfo()}
        </div>
      )}

    </div>
  );
};

export default BaseGameTile;