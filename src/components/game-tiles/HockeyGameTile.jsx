import React, { useState, useEffect, useRef, useCallback } from 'react';
import BaseGameTile from './BaseGameTile';
import './GameTiles.hockey.css';
import { fetchGameSummary, normalizeGameSummary } from '../../services/sportsApi-fixed';

const HockeyGameTile = (props) => {
  const { game } = props;

  // Hockey-specific additional info renderer
  const renderAdditionalInfo = () => {
    if (!game.situation) return null;
    // normalize shot counts for display
    const shotHome = getShotCount(true);
    const shotAway = getShotCount(false);

    // period and clock info from status
    const status = game.status || {};
    const lastPlay = game.situation.lastPlay || null;
    const displayClock = status.displayClock || status.clock || null;
    const period = status.period || status.periodNumber || null;
    const periodLabel = (() => {
      if (!period) return null;
      if (status.type && typeof status.type === 'string' && status.type.toLowerCase().includes('shootout')) return 'SO';
      // numeric periods 1..3 -> P1..P3
      if (period === 4 || (status.type && String(status.type).toLowerCase().includes('overtime'))) return 'OT';
      return `P${period}`;
    })();

    return (
      <div className="hockey-info">
        {/* Period & clock */}
        {(periodLabel || displayClock) && false && (
          <div className="period-clock" aria-hidden>
            {periodLabel && <span className="period">{periodLabel}</span>}
            {displayClock && <span className="clock">{displayClock}</span>}
          </div>
        )}
        <div className="lastPlay" aria-hidden>
            {lastPlay && <span className="last-play">{lastPlay}</span>}
          </div>

        {game.situation.powerPlay && (
          <div
            className="power-play"
            role="status"
            aria-label={`Power play for ${game.situation.powerPlayTeam || ''}${game.situation.powerPlayTime ? `, ${game.situation.powerPlayTime} remaining` : ''}`}>
            <span className="power-play-text">
              Power Play: {game.situation.powerPlayTeam}
            </span>
            {game.situation.powerPlayTime && (
              <span className="power-play-time">{game.situation.powerPlayTime}</span>
            )}
          </div>
        )}

        {(shotHome != null || shotAway != null) && (
          <div className="shots-on-goal">
            <div className="shots away">SOG: {shotAway != null ? shotAway : '-'}</div>
            <div className="shots home">SOG: {shotHome != null ? shotHome : '-'}</div>
          </div>
        )}

        {/* On-demand details: empty net / goalie info */}
        {renderSummarySection()}
      </div>
    );
  };

  // local state for on-demand summary
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (summary || loadingSummary) return;
    try {
      setLoadingSummary(true);
      setSummaryError(null);
      const data = await fetchGameSummary((game.league || 'nhl').toLowerCase(), game.id);
      if (!data) {
        setSummaryError('Failed to load details');
        setLoadingSummary(false);
        return;
      }
      // normalize into compact shape
      const normalized = normalizeGameSummary(data);
      setSummary(normalized);
    } catch (err) {
      setSummaryError('Failed to load details');
    } finally {
      setLoadingSummary(false);
    }
  }, [game.id, game.league, loadingSummary, summary]);

  // Only fetch summary when the tile becomes visible. Use IntersectionObserver
  // when available; otherwise fall back to immediate fetch for older browsers
  const containerRef = useRef(null);
  useEffect(() => {
    const statusType = game?.status?.type || '';
    const isLive = statusType === 'STATUS_IN_PROGRESS' || String(statusType).toLowerCase().includes('in_progress');
    if (!isLive) return undefined;

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
  }, [fetchSummary, game?.status?.type]);

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

    return (
      <div className="summary-action">
        <button className="summary-btn" onClick={fetchSummary} disabled={loadingSummary}>
          {loadingSummary ? 'Loading details…' : 'Show details'}
        </button>
        {summaryError && <div className="summary-error">{summaryError}</div>}
      </div>
    );
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

  return (
    <div ref={containerRef}>
      <BaseGameTile
        {...props}
        renderAdditionalInfo={renderAdditionalInfo}
        renderScore={renderScore}
      />
    </div>
  );
};

export default HockeyGameTile;