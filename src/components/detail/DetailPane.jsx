import React, { useMemo } from 'react';
import GameTile from '../game-tiles/GameTileFactory';
import { useGameDetail } from '../../hooks/useGameDetail';
import { isGameOngoing } from '../../config/constants';
import FootballDetailContent from './content/FootballDetailContent';
import BaseballDetailContent from './content/BaseballDetailContent';
import HockeyDetailContent from './content/HockeyDetailContent';
import BasketballDetailContent from './content/BasketballDetailContent';
import SoccerDetailContent from './content/SoccerDetailContent';
import './DetailPane.css';

const FOOTBALL_LEAGUES  = new Set(['nfl', 'fbs', 'fcs']);
const BASEBALL_LEAGUES  = new Set(['mlb', 'wbc']);
const HOCKEY_LEAGUES    = new Set(['nhl']);
const BASKETBALL_LEAGUES = new Set(['nba', 'ncaam', 'ncaaw']);
const SOCCER_LEAGUES    = new Set(['mls', 'bundesliga1', 'bundesliga2', 'dfb_pokal', 'ucl', 'fifa_world']);

function DetailContent({ game, data, loading, error }) {
  if (loading && !data) {
    return <div className="detail-loading"><span>⏳</span> Loading detail stats…</div>;
  }
  if (error) {
    return <div className="detail-error">Could not load detail stats ({error})</div>;
  }
  if (!data) return null;

  const league = (game.league || '').toLowerCase();

  console.log('DetailContent', { league, data });

  if (FOOTBALL_LEAGUES.has(league))   return <FootballDetailContent data={data} />;
  if (BASEBALL_LEAGUES.has(league))   return <BaseballDetailContent data={data} game={game} />;
  if (HOCKEY_LEAGUES.has(league))     return <HockeyDetailContent data={data} />;
  if (BASKETBALL_LEAGUES.has(league)) return <BasketballDetailContent data={data} />;
  if (SOCCER_LEAGUES.has(league))     return <SoccerDetailContent data={data} />;

  return <div className="detail-error">No detail view available for {league.toUpperCase()}</div>;
}

function getOverallRecord(competitors, homeAway) {
  const comp = competitors?.find(c => c.homeAway === homeAway);
  return comp?.record?.find(r => r.type === 'total')?.summary ?? null;
}

const DetailPane = ({
  game,
  colorCoding,
  showTeamForm,
  isPinned,
  onTogglePin,
  onClose
}) => {
  // For live games, re-fetch the summary whenever the at-bat situation changes
  const refreshKey = useMemo(() => {
    if (!isGameOngoing(game.status)) return null;
    const s = game.situation;
    if (!s) return null;
    return `${s.currentBatter?.id}-${s.outs}-${s.inning}-${s.isTopInning}-${s.balls}-${s.strikes}`;
  }, [game.status, game.situation]);

  const { data, loading, error } = useGameDetail(game, refreshKey);
  const leagueLabel = (game.league || '').toUpperCase();

  const competitors = data?.header?.competitions?.[0]?.competitors ?? [];
  const gameWithRecords = competitors.length ? {
    ...game,
    homeTeam: { ...game.homeTeam, record: getOverallRecord(competitors, 'home') },
    awayTeam: { ...game.awayTeam, record: getOverallRecord(competitors, 'away') },
  } : game;

  return (
    <div className="detail-pane">
      <div className="detail-pane-header">
        <span className="detail-pane-label">
          {leagueLabel && <span className="detail-pane-league">{leagueLabel}</span>}
          Detail View
        </span>
        <button
          className="detail-pane-close"
          onClick={onClose}
          title="Close detail view"
          aria-label="Close detail view"
        >
          ✕
        </button>
      </div>

      <div className="detail-tile-wrapper">
        <GameTile
          game={gameWithRecords}
          index={0}
          colorCoding={colorCoding}
          isDragDisabled={true}
          showTeamForm={showTeamForm}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
        />
      </div>

      <div className="detail-content">
        <DetailContent game={game} data={data} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default DetailPane;
