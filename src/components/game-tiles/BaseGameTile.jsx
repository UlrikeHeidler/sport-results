import React, { useState, useEffect, useRef } from 'react';
import { formatGameTime, getStatusClass, shouldMoveToBottom } from '../../services/sportsApi';
import { getTeamForm, getFormColor } from '../../services/teamStats';
import { getLeagueColors } from '../../services/gameUtils';


const getDisplayStatus = (status, situation) => {
  // Known ongoing status types
  const ongoingTypes = new Set([
    'STATUS_IN_PROGRESS',
    'STATUS_HALFTIME',
    'STATUS_HALFTIME_ET',
    'STATUS_OVERTIME',
    'STATUS_FIRST_HALF',
    'STATUS_SECOND_HALF',
    'STATUS_EXTRA_TIME',
    'STATUS_PENALTIES',
    'STATUS_BREAK',
    'STATUS_INTERMISSION',
    'STATUS_END_PERIOD'
  ]);

  const isOngoingType = status && ongoingTypes.has(status.type);

  // Heuristic: some APIs may leave status.type as 'SCHEDULED' while providing
  // situation data (matchTime / period / displayClock). Treat those as live.
  const situationIndicatesLive = situation && (
    situation.matchTime != null ||
    (situation.period && /half|period|overtime|extra|penalties|first|second/i.test(String(situation.period))) ||
    (status && status.displayClock)
  );

  if (isOngoingType || situationIndicatesLive) {
    // Prefer explicit in-progress type; otherwise consider it live
    if (status && status.type === 'STATUS_IN_PROGRESS') return 'LIVE';
    return 'LIVE';
  }

  if (status && status.completed) return 'FINAL';
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
  const timeDisplay = formatGameTime(game.date || new Date(), game.status || {}, game.league);
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
        loading="lazy"
        decoding="async"
        width={36}
        height={36}
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

  const renderTeamName = (team, isHome) => {
    // Determine possession for this team. Prefer the normalized `possessionWhich`
    // field (set to 'home'|'away') if available. Fall back to string matching
    // against team name or possession label when necessary.
    const situation = game.situation || null;
    let hasPossessionMarker = false;
    if (situation) {
      // Prefer explicit normalized ownership
      if (situation.possessionWhich) {
        if (situation.possessionWhich === 'home') hasPossessionMarker = !!isHome;
        else if (situation.possessionWhich === 'away') hasPossessionMarker = !isHome;
      } else if (situation?.lastPlay && situation?.lastPlay?.team?.id) {
        // Some feeds provide a lastPlay.team.id we can match against
        if (situation.lastPlay.team.id === team?.id) hasPossessionMarker = true;
      } else {
        // Fallback: string matching against possession label or team abbreviation/name
        const poss = situation.possession || situation.possessionLabel || null;
        if (poss) {
          const normalize = v => (v == null ? '' : String(v).toLowerCase());
          const possNorm = normalize(poss);
          const teamNorms = [team?.abbreviation, team?.name, team?.displayName].map(normalize);
          if (teamNorms.includes(possNorm)) hasPossessionMarker = true;
        }
      }
    }

    return (
      <div className="team-details">
        <div className={`team-name ${hasPossessionMarker ? 'has-possession' : ''}`}>
          <span className="abbrev">{team?.abbreviation}</span>
          {showTeamForm && team?.id && renderTeamForm(team)}
          {/* Possession marker: show a small football emoji when this team has possession */}
          {hasPossessionMarker && (
            <span className="possession-marker" aria-hidden title="Has possession">🏈</span>
          )}
          <span className="tooltip">{team?.name}</span>
        </div>
      </div>
    );
  };

  const defaultRenderScore = (team, isHome) => (
    <div className={`team-score ${animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : ''}`}>
      {(team?.score ?? 0) || '0'}
    </div>
  );

  const renderTeamScore = customRenderScore || defaultRenderScore;

  // Winner logic: only for completed games
  let winner = null;
  if (game.status && game.status.completed) {
    const homeScore = Number(game.homeTeam?.score ?? 0);
    const awayScore = Number(game.awayTeam?.score ?? 0);
    if (homeScore > awayScore) winner = 'home';
    else if (awayScore > homeScore) winner = 'away';
  }

  const renderTeam = (team, isHome = false) => {
    const isWinner = winner && ((winner === 'home' && isHome) || (winner === 'away' && !isHome));
    return (
      <div className={`team${isWinner ? ' winner' : ''}`}>
        <div className="team-info">
          {renderTeamLogo(team)}
          {renderTeamName(team, isHome)}
        </div>
        {renderTeamScore(team, isHome, animations)}
      </div>
    );
  };
  
  const renderGameStatus = () => (
    <div className="game-header">
      <span className={`league-badge`} style={colorCoding ? {
        backgroundColor: leagueColors.primary,
        color: 'white'
      } : {}}>
        {game.league}
      </span>
      <span className={`game-status ${statusClass} ${animations.status ? 'status-changed' : ''}`}>
        {getDisplayStatus(game.status, game.situation)}
      </span>
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

      <div className="game-time">
        {timeDisplay}
      </div>

      {/* Render additional info */}
      <div className="additional-info-wrapper">
        {customRenderAdditionalInfo && customRenderAdditionalInfo()}
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