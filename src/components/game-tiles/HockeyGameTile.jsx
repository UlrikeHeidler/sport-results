import React, { useState, useEffect, useRef, useCallback } from 'react';
import BaseGameTile from './BaseGameTile';
import './GameTiles.hockey.css';
import { fetchGameSummary, normalizeGameSummary } from '../../services/sportsApi';
import { isGameOngoing } from '../../config/constants';
import { isShootoutInProgress, ShootoutTracker } from '../shared/ShootoutTracker';

const HockeyGameTile = (props) => {
  const { game, refreshInterval = 30 } = props;

  // Hockey-specific additional info renderer
  const renderAdditionalInfo = () => {
    if (!game.situation && !summary && !shootoutData) return null;
    const situation = game.situation || {};
    const shotHome = getShotCount(true);
    const shotAway = getShotCount(false);
    const lastPlay = situation.lastPlay || null;
    const lastPlayTeam = situation.lastPlayTeam || null;
    const lastPlayEvent = Array.isArray(situation.timeline)
      ? [...situation.timeline].reverse().find(event => event.text === lastPlay)
      : null;
    const lastPlayMarker = lastPlayEvent?.type === 'goal'
      ? '🥅'
      : lastPlayEvent?.type === 'penalty'
        ? '🚫'
        : null;
    let eventLogo = null;

    if (lastPlayTeam == game.awayTeam?.id) {
        eventLogo = game.awayTeam?.logo;
    } else if (lastPlayTeam == game.homeTeam?.id) {
        eventLogo = game.homeTeam?.logo;
    }

    return (
      <div className="hockey-info">
        {shootoutInProgress
          ? <ShootoutTracker plays={shootoutData?.plays} game={game} compact />
          : (
            <div className="hockey-last-play" aria-hidden>
              {lastPlayMarker && (
                <span className="hockey-last-play-marker" aria-hidden="true">
                  {lastPlayMarker}
                </span>
              )}
              {eventLogo && (
                <img
                  src={eventLogo}
                  alt={lastPlayTeam + ' logo'}
                  className="nhl-timeline-logo"
                  width={16}
                  height={16}
                  loading="lazy"
                  decoding="async"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              {lastPlay && <span className="hockey-last-play-text">{lastPlay}</span>}
            </div>
          )}
        {(shotHome != null || shotAway != null) && (
          <div className="shots-on-goal">
            <div className="shots away">SOG: {shotAway != null ? shotAway : '-'}</div>
            <div className="shots home">SOG: {shotHome != null ? shotHome : '-'}</div>
          </div>
        )}
        {renderSummarySection()}
      </div>
    );
  };

  // local state for on-demand summary
  const [summary, setSummary] = useState(null);
  const [shootoutData, setShootoutData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const shootoutInProgress = isShootoutInProgress(game, shootoutData?.header);

  const fetchSummary = useCallback(async (force = false) => {
    if ((!force && summary) || loadingSummary) return;
    try {
      setLoadingSummary(true);

      const data = await fetchGameSummary((game.league || 'nhl').toLowerCase(), game.id);
      if (!data) {
        setLoadingSummary(false);
        return;
      }
      // normalize into compact shape
      const normalized = normalizeGameSummary(data);
      setSummary(normalized);
      setShootoutData({
        plays: Array.isArray(data.plays) ? data.plays : [],
        header: data.header,
      });
    } catch (err) {
      console.error('Failed to load hockey game summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  }, [game.id, game.league, loadingSummary, summary]);

  useEffect(() => {
    if (!isGameOngoing(game?.status) || !shootoutData) return undefined;

    const intervalSeconds = shootoutInProgress
      ? 5
      : Math.min(Math.max(5, Number(refreshInterval) || 30), 15);
    const intervalMs = intervalSeconds * 1000;
    const interval = setInterval(() => fetchSummary(true), intervalMs);
    return () => clearInterval(interval);
  }, [fetchSummary, game?.status, refreshInterval, shootoutData, shootoutInProgress]);

  // Only fetch summary when the tile becomes visible. Use IntersectionObserver
  // when available; otherwise fall back to immediate fetch for older browsers
  const containerRef = useRef(null);
  useEffect(() => {
    if (!isGameOngoing(game?.status)) return undefined;

    const el = containerRef.current;
    if (!el) return undefined;

    // If IntersectionObserver isn't available (SSR environment or old browsers), fetch immediately
    if (typeof IntersectionObserver === 'undefined') {
      fetchSummary();
      return undefined;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          fetchSummary();
          obs.disconnect();
          break;
        }
      }
    }, { threshold: 0.1 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchSummary, game?.status]);

  const renderSummarySection = () => {
    // If we already have parsed summary data, render goalie/EN info
    if (summary) {
      const homeInfo = summary.teams?.home || null;
      const awayInfo = summary.teams?.away || null;

      return (
        <div className="hockey-summary">
          <div className="goalie-info">
            {homeInfo?.goalie && <div className="goalie home">Home Goalie: {homeInfo.goalie.name} {homeInfo.goalie.saves != null ? `${homeInfo.goalie.saves} saves` : ''}{homeInfo.goalie.shots != null ? ` (${homeInfo.goalie.shots} shots)` : ''}</div>}
            {awayInfo?.goalie && <div className="goalie away">Away Goalie: {awayInfo.goalie.name} {awayInfo.goalie.saves != null ? `${awayInfo.goalie.saves} saves` : ''}{awayInfo.goalie.shots != null ? ` (${awayInfo.goalie.shots} shots)` : ''}</div>}
          </div>
          <div className="empty-net-info">
            {homeInfo?.emptyNet && <div className="en home">Empty Net (Home)</div>}
            {awayInfo?.emptyNet && <div className="en away">Empty Net (Away)</div>}
          </div>
        </div>
      );
    }

    return null;
  };

  // Customize score display for hockey (add SOG if available)
  const renderScore = (team, isHome, animations = {}) => {
    const animationClass = animations && animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : '';
    const shotCount = getShotCount(isHome);
    
    return (
      <div className="hockey-score">
        <div className={`team-score ${animationClass}`}>
          {team.score || '0'}
        </div>
        {shotCount != undefined && (
          <div className="shots-count">({shotCount})</div>
        )}
      </div>
    );
  };

  // Helper to extract shot counts from various possible fields
  function getShotCount(isHome) {
    // priority: situation.shotCount.{home|away} -> situation.shots{Home/Away} -> game.teams.home.shots
    try {
      const s = game.situation || {};
      const side = isHome ? 'home' : 'away';

      // 1) normalized shotCount object
      if (s.shotCount && (s.shotCount[side] !== undefined && s.shotCount[side] !== null)) {
        return s.shotCount[side];
      }

      // 2) alternate keys
      const alt1 = isHome ? s.shotCountHome ?? s.shotsHome ?? s.sogHome : s.shotCountAway ?? s.shotsAway ?? s.sogAway;
      if (alt1 !== undefined && alt1 !== null) return alt1;

      // 3) from game.teams
      const teamObj = isHome ? (game.homeTeam || game.teams?.home) : (game.awayTeam || game.teams?.away);
      if (teamObj) {
        const tCandidates = [teamObj.shots, teamObj.shotsOnGoal, teamObj.sog, teamObj.statistics?.shots, teamObj.statistics?.sog];
        for (const c of tCandidates) {
          if (c !== undefined && c !== null) return c;
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  const powerPlaySituation = summary?.situation || game.situation || {};
  const powerPlayTeamName = String(powerPlaySituation.powerPlayTeamId ?? powerPlaySituation.powerPlayTeam ?? '').toLowerCase();
  const powerPlayTeam = [game.awayTeam || game.teams?.away, game.homeTeam || game.teams?.home]
    .find(team => [team?.id, team?.name, team?.displayName, team?.abbreviation]
      .some(value => value != null && String(value).toLowerCase() === powerPlayTeamName));

  return (
    <div ref={containerRef}>
      <BaseGameTile
        {...props}
        powerPlayTeamId={powerPlaySituation.powerPlay ? powerPlaySituation.powerPlayTeamId ?? powerPlayTeam?.id : null}
        renderAdditionalInfo={renderAdditionalInfo}
        renderScore={renderScore}
      />
    </div>
  );
};

export default HockeyGameTile;