import React from 'react';
import GameTile from '../game-tiles/GameTileFactory';
import { useGameDetail } from '../../hooks/useGameDetail';
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
  if (loading) {
    return <div className="detail-loading"><span>⏳</span> Loading detail stats…</div>;
  }
  if (error) {
    return <div className="detail-error">Could not load detail stats ({error})</div>;
  }
  if (!data) return null;

  const league = (game.league || '').toLowerCase();

  if (FOOTBALL_LEAGUES.has(league))   return <FootballDetailContent data={data} />;
  if (BASEBALL_LEAGUES.has(league))   return <BaseballDetailContent data={data} />;
  if (HOCKEY_LEAGUES.has(league))     return <HockeyDetailContent data={data} />;
  if (BASKETBALL_LEAGUES.has(league)) return <BasketballDetailContent data={data} />;
  if (SOCCER_LEAGUES.has(league))     return <SoccerDetailContent data={data} />;

  return <div className="detail-error">No detail view available for {league.toUpperCase()}</div>;
}

const DetailPane = ({
  game,
  colorCoding,
  showTeamForm,
  isPinned,
  onTogglePin,
  onClose
}) => {
  const { data, loading, error } = useGameDetail(game);
  const leagueLabel = (game.league || '').toUpperCase();

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
          game={game}
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
