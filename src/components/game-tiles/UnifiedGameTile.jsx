/**
 * Unified Game Tile Component
 * Harmonizes game tile rendering patterns across all sports
 * Replaces the inconsistent patterns found in existing sport-specific tiles
 */

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useGameAnimations } from '../../hooks/useGameAnimations';
import { TeamInfo } from '../shared/TeamInfo';
import { TeamScore, getScoreComponent } from '../shared/TeamScore';
import { 
  getDisplayStatus, 
  getStatusClass, 
  formatGameTime, 
  getGameWinner,
  getSportFromLeague,
  getLeagueColors 
} from '../../utils/gameHelpers';
import './UnifiedGameTile.css';

/**
 * Game status header component
 */
const GameStatusHeader = ({ game, leagueColors, colorCoding }) => {
  const { animations } = useGameAnimations(game);
  const statusClass = getStatusClass(game.status);
  
  return (
    <div className={`game-header ${game.id}`}>
      <span 
        title={game.id} 
        className="league-badge" 
        style={colorCoding ? {
          backgroundColor: leagueColors.primary,
          color: 'white'
        } : {}}
      >
        {game.league}
      </span>
      
      {game.broadcast && (
        <div className="broadcast-info">
          {game.broadcast}
        </div>
      )}
      
      <span className={`game-status ${statusClass} ${animations.status ? 'status-changed' : ''}`}>
        {getDisplayStatus(game.status, game.situation)}
      </span>
    </div>
  );
};

/**
 * Teams display component
 */
const TeamsDisplay = ({ game, showTeamForm, animations }) => {
  const { winner } = getGameWinner(game);
  
  const renderTeam = (team, isHome) => {
    const isWinner = winner && ((winner === 'home' && isHome) || (winner === 'away' && !isHome));
    const ScoreComponent = getScoreComponent(getSportFromLeague(game.league));
    
    return (
      <div className={`team${isWinner ? ' winner' : ''}`}>
        <TeamInfo
          team={team}
          game={game}
          isHome={isHome}
          showForm={showTeamForm}
          showRanking={true}
          showPossession={true}
        />
        <ScoreComponent
          team={team}
          game={game}
          isHome={isHome}
          animations={animations}
        />
      </div>
    );
  };

  return (
    <div className="teams">
      {renderTeam(game.awayTeam, false)}
      <div className="vs">@</div>
      {renderTeam(game.homeTeam, true)}
    </div>
  );
};

/**
 * Game time display component
 */
const GameTimeDisplay = ({ game }) => {
  const timeDisplay = formatGameTime(game.date, game.status, game.league);
  
  return (
    <div className="game-time">
      {timeDisplay}
    </div>
  );
};

/**
 * Sport-specific additional info wrapper
 */
const AdditionalInfoWrapper = ({ game, renderAdditionalInfo }) => {
  if (!renderAdditionalInfo) return null;
  
  return (
    <div className="additional-info-wrapper">
      {renderAdditionalInfo()}
    </div>
  );
};

/**
 * Main Unified Game Tile Component
 */
export const UnifiedGameTile = ({
  game,
  index,
  colorCoding = true,
  isDragDisabled = true,
  draggableId,
  showTeamForm = true,
  renderAdditionalInfo = null,
  customClassName = '',
  provided = null,
  snapshot = null
}) => {
  const { animations } = useGameAnimations(game);
  const leagueColors = getLeagueColors(game.league);
  const statusClass = getStatusClass(game.status);
  const sport = getSportFromLeague(game.league);
  
  const tileStyle = colorCoding ? {
    borderLeft: `4px solid ${leagueColors.primary}`,
    backgroundColor: leagueColors.background
  } : {};

  const tileClassName = [
    'unified-game-tile',
    `sport-${sport.toLowerCase()}`,
    `league-${game.league.toLowerCase()}`,
    statusClass,
    isDragDisabled ? 'drag-disabled' : '',
    snapshot?.isDragging ? 'dragging' : '',
    customClassName
  ].filter(Boolean).join(' ');

  const content = (
    <div
      className={tileClassName}
      style={tileStyle}
      data-game-id={game.id}
      data-league={game.league}
      data-sport={sport}
    >
      <GameStatusHeader 
        game={game} 
        leagueColors={leagueColors} 
        colorCoding={colorCoding} 
      />
      
      <TeamsDisplay 
        game={game} 
        showTeamForm={showTeamForm} 
        animations={animations} 
      />
      
      <GameTimeDisplay game={game} />
      
      <AdditionalInfoWrapper 
        game={game} 
        renderAdditionalInfo={renderAdditionalInfo} 
      />
    </div>
  );

  // If provided and snapshot are passed, we're already wrapped in Draggable
  if (provided && snapshot) {
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`game-wrapper ${snapshot.isDragging ? 'dragging' : ''}`}
      >
        {content}
      </div>
    );
  }

  // Otherwise, wrap in Draggable ourselves
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
          className={`game-wrapper ${snapshot.isDragging ? 'dragging' : ''}`}
        >
          {content}
        </div>
      )}
    </Draggable>
  );
};

/**
 * Sport-specific tile creators using the unified base
 */

// Football tile with down and distance info
export const createFootballTile = (additionalInfoRenderer) => (props) => (
  <UnifiedGameTile
    {...props}
    renderAdditionalInfo={additionalInfoRenderer}
    customClassName="football-tile"
  />
);

// Baseball tile with diamond and inning info
export const createBaseballTile = (additionalInfoRenderer) => (props) => (
  <UnifiedGameTile
    {...props}
    renderAdditionalInfo={additionalInfoRenderer}
    customClassName="baseball-tile"
  />
);

// Basketball tile with win probability
export const createBasketballTile = (additionalInfoRenderer) => (props) => (
  <UnifiedGameTile
    {...props}
    renderAdditionalInfo={additionalInfoRenderer}
    customClassName="basketball-tile"
  />
);

// Hockey tile with goalie info
export const createHockeyTile = (additionalInfoRenderer) => (props) => (
  <UnifiedGameTile
    {...props}
    renderAdditionalInfo={additionalInfoRenderer}
    customClassName="hockey-tile"
  />
);

// Soccer tile with timeline
export const createSoccerTile = (additionalInfoRenderer) => (props) => (
  <UnifiedGameTile
    {...props}
    renderAdditionalInfo={additionalInfoRenderer}
    customClassName="soccer-tile"
  />
);

/**
 * Factory function to create sport-specific tiles
 */
export const createSportTile = (sport, additionalInfoRenderer = null) => {
  const sportLower = sport.toLowerCase();
  
  switch (sportLower) {
    case 'football':
      return createFootballTile(additionalInfoRenderer);
    case 'baseball':
      return createBaseballTile(additionalInfoRenderer);
    case 'basketball':
      return createBasketballTile(additionalInfoRenderer);
    case 'hockey':
      return createHockeyTile(additionalInfoRenderer);
    case 'soccer':
      return createSoccerTile(additionalInfoRenderer);
    default:
      return (props) => <UnifiedGameTile {...props} customClassName={`${sportLower}-tile`} />;
  }
};

export default UnifiedGameTile;