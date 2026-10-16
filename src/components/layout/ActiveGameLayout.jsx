import React from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import GameTile from '../game-tiles/GameTileFactory';
import DetailPane from '../detail/DetailPane';

const GamesGrid = ({
  games,
  settings,
  recordsOverlay,
  pinnedIds,
  togglePin,
  isInDetailMode,
  toggleDetailMode
}) => (
  <DragDropContext>
    <Droppable droppableId="games">
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="games-grid"
        >
          {games.map((game, index) => {
            const gameKey = `${game.league}-${game.id}`;
            const overlay = recordsOverlay[gameKey];
            const enrichedGame = overlay ? {
              ...game,
              homeTeam: game.homeTeam
                ? { ...game.homeTeam, record: game.homeTeam.record ?? overlay.homeRecord }
                : game.homeTeam,
              awayTeam: game.awayTeam
                ? { ...game.awayTeam, record: game.awayTeam.record ?? overlay.awayRecord }
                : game.awayTeam,
            } : game;

            return (
              <GameTile
                key={gameKey}
                game={{ ...enrichedGame, refreshInterval: settings.refreshInterval }}
                index={index}
                colorCoding={settings.colorCoding}
                isDragDisabled={false}
                draggableId={gameKey}
                showTeamForm={settings.showTeamForm}
                isPinned={pinnedIds.has(gameKey)}
                onTogglePin={() => togglePin(gameKey)}
                isInDetailMode={isInDetailMode(gameKey)}
                onToggleDetailMode={() => toggleDetailMode(gameKey)}
              />
            );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);

const GameDetailPane = ({
  game,
  settings,
  pinnedIds,
  togglePin,
  toggleDetailMode,
  onRecordsUpdate
}) => {
  const gameKey = `${game.league}-${game.id}`;

  return (
    <DetailPane
      game={game}
      colorCoding={settings.colorCoding}
      showTeamForm={settings.showTeamForm}
      isPinned={pinnedIds.has(gameKey)}
      onTogglePin={() => togglePin(gameKey)}
      onClose={() => toggleDetailMode(gameKey)}
      refreshInterval={settings.refreshInterval}
      onRecordsUpdate={(homeRecord, awayRecord) =>
        onRecordsUpdate(gameKey, homeRecord, awayRecord)
      }
    />
  );
};

const NoGames = ({ selectedLeagues, inSplitPane = false }) => (
  <div className="no-games">
    {inSplitPane ? (
      <>
        <div className="no-games-icon">📋</div>
        <p>No other games</p>
      </>
    ) : selectedLeagues.length === 0 ? (
      <div>
        <div className="no-games-icon">🏟️</div>
        <h3>Select a league to view games</h3>
        <p>Choose from NFL, NHL, FCS, FBS, MLB, or Bundesliga above to see live scores and schedules.</p>
      </div>
    ) : (
      <div>
        <div className="no-games-icon">📅</div>
        <h3>No games scheduled</h3>
        <p>There are no games scheduled for the selected leagues in the next 4 days.</p>
      </div>
    )}
  </div>
);

const GamesContent = ({
  filteredGames,
  settings,
  recordsOverlay,
  pinnedIds,
  activeDetailKeys,
  togglePin,
  isInDetailMode,
  toggleDetailMode,
  onRecordsUpdate
}) => {
  if (filteredGames.length === 0) {
    return <NoGames selectedLeagues={settings.selectedLeagues} />;
  }

  const detailGames = activeDetailKeys
    .map(key => filteredGames.find(game => `${game.league}-${game.id}` === key))
    .filter(Boolean);
  const gridGames = filteredGames.filter(
    game => !activeDetailKeys.includes(`${game.league}-${game.id}`)
  );
  const renderGrid = games => (
    <GamesGrid
      games={games}
      settings={settings}
      recordsOverlay={recordsOverlay}
      pinnedIds={pinnedIds}
      togglePin={togglePin}
      isInDetailMode={isInDetailMode}
      toggleDetailMode={toggleDetailMode}
    />
  );

  if (detailGames.length === 0) return renderGrid(filteredGames);

  return (
    <div className="split-layout">
      <div className="split-left">
        <GameDetailPane
          game={detailGames[0]}
          settings={settings}
          pinnedIds={pinnedIds}
          togglePin={togglePin}
          toggleDetailMode={toggleDetailMode}
          onRecordsUpdate={onRecordsUpdate}
        />
      </div>
      <div className="split-right">
        {detailGames.length >= 2 ? (
          <GameDetailPane
            game={detailGames[1]}
            settings={settings}
            pinnedIds={pinnedIds}
            togglePin={togglePin}
            toggleDetailMode={toggleDetailMode}
            onRecordsUpdate={onRecordsUpdate}
          />
        ) : (
          <div className="split-grid-pane">
            {gridGames.length > 0 ? renderGrid(gridGames) : (
              <NoGames selectedLeagues={settings.selectedLeagues} inSplitPane />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ActiveGameLayout = ({
  filteredGames,
  settings,
  loading,
  error,
  useIncrementalMode,
  updateFrequency,
  liveGamesCount,
  onForceRefresh,
  recordsOverlay,
  pinnedIds,
  activeDetailKeys,
  togglePin,
  isInDetailMode,
  toggleDetailMode,
  onRecordsUpdate
}) => (
  <main className="container">
    {loading && (
      <div className="loading">
        <div className="loading-spinner">⏳</div>
        Loading games... {useIncrementalMode ? '(Incremental Mode)' : '(Traditional Mode)'}
      </div>
    )}

    {error && (
      <div className="error">
        <div className="error-icon">❌</div>
        {error}
        <button onClick={onForceRefresh} className="retry-button">
          Try Again
        </button>
      </div>
    )}

    {!loading && !error && (
      <GamesContent
        filteredGames={filteredGames}
        settings={settings}
        recordsOverlay={recordsOverlay}
        pinnedIds={pinnedIds}
        activeDetailKeys={activeDetailKeys}
        togglePin={togglePin}
        isInDetailMode={isInDetailMode}
        toggleDetailMode={toggleDetailMode}
        onRecordsUpdate={onRecordsUpdate}
      />
    )}

    <div className="app-info">
      <div className="refresh-info">
        <p>
          🔄 {useIncrementalMode
            ? `Smart updates: ${updateFrequency}`
            : `Updates every ${settings.refreshInterval} seconds`}
        </p>
        {useIncrementalMode && liveGamesCount > 0 && (
          <p>🔴 {liveGamesCount} live game{liveGamesCount !== 1 ? 's' : ''} active</p>
        )}
      </div>
    </div>
  </main>
);

export default ActiveGameLayout;
