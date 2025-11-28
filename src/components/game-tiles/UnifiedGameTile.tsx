/**
 * Optimized Unified Game Tile Component
 * Enhanced with React.memo, useMemo, and performance optimizations
 */

import React, { memo, useMemo, useCallback } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useGameAnimations } from '../../hooks/useGameAnimations';
import { TeamInfo } from '../shared/TeamInfo';
import { getScoreComponent } from '../shared/TeamScore';
import {
  getDisplayStatus,
  getStatusClass,
  formatGameTime,
  getGameWinner,
  getSportFromLeague,
  getLeagueColors,
} from '../../utils/gameHelpers';
import { GameTileErrorBoundary } from '../ErrorBoundary';
import type { UnifiedGameTileProps, GameData, TeamData } from '../../types';
import { CSS_CLASSES } from '../../constants';
import './UnifiedGameTile.css';

/**
 * Memoized Game Status Header component
 */
const GameStatusHeader = memo<{
  game: GameData;
  leagueColors: ReturnType<typeof getLeagueColors>;
  colorCoding: boolean;
}>(({ game, leagueColors, colorCoding }) => {
  const { animations } = useGameAnimations(game);
  const statusClass = useMemo(() => getStatusClass(game.status), [game.status]);
  const displayStatus = useMemo(() => getDisplayStatus(game.status, game.situation), [game.status, game.situation]);

  const headerStyle = useMemo(() =>
    colorCoding ? {
      backgroundColor: leagueColors.primary,
      color: 'white',
    } : {},
  [colorCoding, leagueColors.primary],
  );

  return (
    <div className={`game-header ${game.id}`}>
      <span
        title={game.id}
        className="league-badge"
        style={headerStyle}
        aria-label={`${game.league} league game`}
      >
        {game.league}
      </span>

      {game.broadcast && (
        <div className="broadcast-info" aria-label={`Broadcast on ${game.broadcast}`}>
          {game.broadcast}
        </div>
      )}

      <span
        className={`game-status ${statusClass} ${animations.status ? 'status-changed' : ''}`}
        aria-live="polite"
        aria-label={`Game status: ${displayStatus}`}
      >
        {displayStatus}
      </span>
    </div>
  );
});

GameStatusHeader.displayName = 'GameStatusHeader';

/**
 * Memoized Teams Display component
 */
const TeamsDisplay = memo<{
  game: GameData;
  showTeamForm: boolean;
  animations: ReturnType<typeof useGameAnimations>['animations'];
}>(({ game, showTeamForm, animations }) => {
  const winner = useMemo(() => getGameWinner(game), [game]);
  const sport = useMemo(() => getSportFromLeague(game.league), [game.league]);
  const ScoreComponent = useMemo(() => getScoreComponent(sport), [sport]);

  const renderTeam = useCallback((team: TeamData, isHome: boolean) => {
    const isWinner = winner.winner && ((winner.winner === 'home' && isHome) || (winner.winner === 'away' && !isHome));

    return (
      <div
        className={`team${isWinner ? ' winner' : ''}`}
        role="group"
        aria-label={`${team.name} ${isHome ? 'home' : 'away'} team${isWinner ? ' (winner)' : ''}`}
      >
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
  }, [winner, ScoreComponent, game, showTeamForm, animations]);

  return (
    <div className="teams" role="group" aria-label="Game teams">
      {renderTeam(game.awayTeam, false)}
      <div className="vs" aria-hidden="true">@</div>
      {renderTeam(game.homeTeam, true)}
    </div>
  );
});

TeamsDisplay.displayName = 'TeamsDisplay';

/**
 * Memoized Game Time Display component
 */
const GameTimeDisplay = memo<{
  game: GameData;
}>(({ game }) => {
  const timeDisplay = useMemo(() =>
    formatGameTime(game.date, game.status, game.league),
  [game.date, game.status, game.league],
  );

  if (!timeDisplay) return null;

  return (
    <div className="game-time" aria-label={`Game time: ${timeDisplay}`}>
      {timeDisplay}
    </div>
  );
});

GameTimeDisplay.displayName = 'GameTimeDisplay';

/**
 * Memoized Additional Info Wrapper component
 */
const AdditionalInfoWrapper = memo<{
  game: GameData;
  renderAdditionalInfo?: () => React.ReactNode;
    }>(({ renderAdditionalInfo }) => {
      const additionalContent = useMemo(() => {
        return renderAdditionalInfo ? renderAdditionalInfo() : null;
      }, [renderAdditionalInfo]);

      if (!additionalContent) return null;

      return (
        <div className="additional-info-wrapper" role="complementary">
          {additionalContent}
        </div>
      );
    });

AdditionalInfoWrapper.displayName = 'AdditionalInfoWrapper';

/**
 * Main Unified Game Tile Component with performance optimizations
 */
export const UnifiedGameTile = memo<UnifiedGameTileProps>(({
  game,
  index,
  colorCoding = true,
  isDragDisabled = true,
  draggableId,
  showTeamForm = true,
  renderAdditionalInfo = null,
  customClassName = '',
  provided = null,
  snapshot = null,
}) => {
  const { animations } = useGameAnimations(game);

  // Memoize expensive calculations
  const leagueColors = useMemo(() => getLeagueColors(game.league), [game.league]);
  const statusClass = useMemo(() => getStatusClass(game.status), [game.status]);
  const sport = useMemo(() => getSportFromLeague(game.league), [game.league]);

  const tileStyle = useMemo(() =>
    colorCoding ? {
      borderLeft: `4px solid ${leagueColors.primary}`,
      backgroundColor: leagueColors.background,
    } : {},
  [colorCoding, leagueColors.primary, leagueColors.background],
  );

  const tileClassName = useMemo(() => [
    CSS_CLASSES.GAME_TILE,
    `sport-${sport.toLowerCase()}`,
    `league-${game.league.toLowerCase()}`,
    statusClass,
    isDragDisabled ? 'drag-disabled' : '',
    snapshot?.isDragging ? CSS_CLASSES.DRAGGING : '',
    customClassName,
  ].filter(Boolean).join(' '), [
    sport,
    game.league,
    statusClass,
    isDragDisabled,
    snapshot?.isDragging,
    customClassName,
  ]);

  const gameId = useMemo(() => draggableId || `${game.league}-${game.id}`, [draggableId, game.league, game.id]);

  const content = useMemo(() => (
    <div
      className={tileClassName}
      style={tileStyle}
      data-game-id={game.id}
      data-league={game.league}
      data-sport={sport}
      role="article"
      aria-label={`${game.awayTeam.name} vs ${game.homeTeam.name} game`}
      tabIndex={0}
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

      {renderAdditionalInfo && (
        <AdditionalInfoWrapper
          game={game}
          renderAdditionalInfo={renderAdditionalInfo}
        />
      )}
    </div>
  ), [
    tileClassName,
    tileStyle,
    game,
    sport,
    leagueColors,
    colorCoding,
    showTeamForm,
    animations,
    renderAdditionalInfo,
  ]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Could trigger game details modal or other action
    }
  }, []);

  // If provided and snapshot are passed, we're already wrapped in Draggable
  if (provided && snapshot) {
    return (
      <GameTileErrorBoundary>
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`game-wrapper ${snapshot.isDragging ? CSS_CLASSES.DRAGGING : ''}`}
          onKeyDown={handleKeyDown}
        >
          {content}
        </div>
      </GameTileErrorBoundary>
    );
  }

  // Otherwise, wrap in Draggable ourselves
  return (
    <GameTileErrorBoundary>
      <Draggable
        draggableId={gameId}
        index={index}
        isDragDisabled={isDragDisabled}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`game-wrapper ${snapshot.isDragging ? CSS_CLASSES.DRAGGING : ''}`}
            onKeyDown={handleKeyDown}
          >
            {content}
          </div>
        )}
      </Draggable>
    </GameTileErrorBoundary>
  );
});

UnifiedGameTile.displayName = 'UnifiedGameTile';

/**
 * Sport-specific tile creators using the unified base
 * All memoized for performance
 */

// Football tile with down and distance info
export const createFootballTile = (additionalInfoRenderer?: () => React.ReactNode) =>
  memo<Omit<UnifiedGameTileProps, 'renderAdditionalInfo' | 'customClassName'>>((props) => (
    <UnifiedGameTile
      {...props}
      renderAdditionalInfo={additionalInfoRenderer}
      customClassName="football-tile"
    />
  ));

// Baseball tile with diamond and inning info
export const createBaseballTile = (additionalInfoRenderer?: () => React.ReactNode) =>
  memo<Omit<UnifiedGameTileProps, 'renderAdditionalInfo' | 'customClassName'>>((props) => (
    <UnifiedGameTile
      {...props}
      renderAdditionalInfo={additionalInfoRenderer}
      customClassName="baseball-tile"
    />
  ));

// Basketball tile with win probability
export const createBasketballTile = (additionalInfoRenderer?: () => React.ReactNode) =>
  memo<Omit<UnifiedGameTileProps, 'renderAdditionalInfo' | 'customClassName'>>((props) => (
    <UnifiedGameTile
      {...props}
      renderAdditionalInfo={additionalInfoRenderer}
      customClassName="basketball-tile"
    />
  ));

// Hockey tile with goalie info
export const createHockeyTile = (additionalInfoRenderer?: () => React.ReactNode) =>
  memo<Omit<UnifiedGameTileProps, 'renderAdditionalInfo' | 'customClassName'>>((props) => (
    <UnifiedGameTile
      {...props}
      renderAdditionalInfo={additionalInfoRenderer}
      customClassName="hockey-tile"
    />
  ));

// Soccer tile with timeline
export const createSoccerTile = (additionalInfoRenderer?: () => React.ReactNode) =>
  memo<Omit<UnifiedGameTileProps, 'renderAdditionalInfo' | 'customClassName'>>((props) => (
    <UnifiedGameTile
      {...props}
      renderAdditionalInfo={additionalInfoRenderer}
      customClassName="soccer-tile"
    />
  ));

/**
 * Factory function to create sport-specific tiles
 */
export const createSportTile = (sport: string, additionalInfoRenderer?: () => React.ReactNode) => {
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
      return memo<Omit<UnifiedGameTileProps, 'renderAdditionalInfo' | 'customClassName'>>((props) =>
        <UnifiedGameTile {...props} customClassName={`${sportLower}-tile`} />,
      );
  }
};

export default UnifiedGameTile;
