import { useState, useCallback, useEffect } from 'react';
import BaseGameTile from './BaseGameTile';
import { useSoccerTimeline } from '../../hooks/useSoccerTimeline';
import './GameTiles.soccer.css';
import { isGameOngoing } from '../../services/gameUtils';

// Return the display icon for a timeline event type, or null if it shouldn't appear in the scorer list
function getEventIcon(typeText) {
  const t = (typeText ?? '').toLowerCase();
  if (t.includes('goal') || t.includes('scored')) return '⚽';
  if (t.includes('yellow')) return '🟨';
  if (t.includes('red')) return '🟥';
  return null;
}

// Strip common ESPN verb prefixes so we show only the player name
function cleanDescription(desc) {
  if (!desc) return '';
  return desc
    .replace(/^goal[!]?\s*(scored\s+)?by\s+/i, '')
    .replace(/^goal[!]?\s*[-:]\s*/i, '')
    .replace(/^goal[!]\s*/i, '')
    .replace(/^goal\s+/i, '')
    .replace(/^(yellow|red)\s+card\s+(shown\s+to\s+|for\s+)?/i, '')
    // Strip leading score summary like "Brazil 1, Japan 1. " before the actual description
    .replace(/^[^,\n]+\s\d+,\s*[^.\n]+\s\d+\.\s+/, '')
    .trim();
}

// Helper to convert minute string to percentage of match duration (0-100)
function getTimelinePosition(minuteStr, overTime) {
  // Handles minute strings like "90'+3'", "45+2", "90", "12"
  if (!minuteStr) return 0;
  let min = 0;
  let max = 90;
  // Match patterns like 90'+3', 45+2, 90+3, etc.
  const overtimeMatch = minuteStr.match(/^(\d+)[+'’]?(?:\+|’)?(\d+)?/);
  if (overTime === 'overtime') {
    const base = parseInt(overtimeMatch[1], 10);
    const added = overtimeMatch[2] ? parseInt(overtimeMatch[2], 10) : 0;
    min = base + added;
    // Cap at 120 for extra time, else 90
    max=120;

  } else {
    // fallback: try to parse as integer
    const base = parseInt(minuteStr, 10);
    min = isNaN(base) ? 0 : base;
  }
  let percent = Math.min(100, Math.round((min / max) * 100));
  return percent;
}


const SoccerGameTile = (props) => {
  const { game, refreshInterval = 30 } = props;
  const timeline = useSoccerTimeline(game.league, game.id, refreshInterval);
  const [activeEventIdx, setActiveEventIdx] = useState(null);
  const [activeScorerKey, setActiveScorerKey] = useState(null);

  const handleEventClick = useCallback((idx, e) => {
    e.stopPropagation();
    setActiveScorerKey(null);
    setActiveEventIdx(prev => prev === idx ? null : idx);
  }, []);

  const handleScorerClick = useCallback((key, e) => {
    e.stopPropagation();
    setActiveEventIdx(null);
    setActiveScorerKey(prev => prev === key ? null : key);
  }, []);

  // Dismiss popups when clicking anywhere outside
  useEffect(() => {
    if (activeEventIdx === null) return;
    const dismiss = () => setActiveEventIdx(null);
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, [activeEventIdx]);

  useEffect(() => {
    if (activeScorerKey === null) return;
    const dismiss = () => setActiveScorerKey(null);
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, [activeScorerKey]);

  const overTime = game.status?.type?.includes("OVERTIME") ? 'overtime' : 'regular';

  const renderTimelineEvent = (event, idx) => {
    const isActive = activeEventIdx === idx;
    const text = event.type.text.toLowerCase();
    return (
      <span
        key={idx}
        className={`timeline-event timeline-${text.replace(/\s/g, '-')}`.trim()}
        style={{ left: `calc(${getTimelinePosition(event.minute, overTime)}% - 1em)` }}
        onClick={(e) => handleEventClick(idx, e)}
      >
        {isActive && (
          <div className="timeline-popup">
            <strong>{event.minute}</strong> {event.description}
          </div>
        )}
        {event.minute && <span className="timeline-minute">{event.minute}</span>}
        {(text.includes('goal') || text.includes('scored')) && '⚽'}
        {text.includes('yellow card') && '🟨'}
        {text.includes('red card') && '🟥'}
        {text.includes('substitution') && '🔄'}
      </span>
    );
  };

  const renderAdditionalInfo = () => {
    // Goals and cards only — no substitutions in the scorer list
    const scorerEvents = timeline.filter(e => getEventIcon(e.type?.text ?? '') !== null);
    const homeScorers = scorerEvents.filter(e => e.team === game.homeTeam?.id);
    const awayScorers = scorerEvents.filter(e => e.team === game.awayTeam?.id);

    return (
      <div className="soccer-info">
        {/* Timeline — live games only */}
        {isGameOngoing(game.status) && (
          <div className="soccer-timeline-outer">
            <div className="soccer-timeline-content">
              <div className="soccer-timeline-row soccer-timeline-home">
                <div className="soccer-timeline-logos">
                  {game.homeTeam?.logo && (
                    <img
                      src={game.homeTeam.logo}
                      alt={game.homeTeam.name + ' logo'}
                      className="soccer-timeline-logo home"
                      width={16}
                      height={16}
                      loading="lazy"
                      decoding="async"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
                {timeline && timeline.length > 0 && timeline.map((event, idx) =>
                  event.team === game.homeTeam.id ? renderTimelineEvent(event, idx) : null
                )}
              </div>
              <div className="soccer-timeline-line" />
              <div className="soccer-timeline-row soccer-timeline-away">
                <div className="soccer-timeline-logos">
                  {game.awayTeam?.logo && (
                    <img
                      src={game.awayTeam.logo}
                      alt={game.awayTeam.name + ' logo'}
                      className="soccer-timeline-logo away"
                      width={16}
                      height={16}
                      loading="lazy"
                      decoding="async"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
                {timeline && timeline.length > 0 && timeline.map((event, idx) =>
                  event.team === game.awayTeam.id ? renderTimelineEvent(event, idx) : null
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scorer list — shown for final games, aligned with team columns */}
        {(homeScorers.length > 0 || awayScorers.length > 0) && (!isGameOngoing(game.status)) && (
          <div className="soccer-scorers">
            <div className="scorer-col scorer-col--away">
              {awayScorers.map((e, i) => {
                const key = `away-${i}`;
                const full = `${getEventIcon(e.type.text)} ${cleanDescription(e.description)}${e.minute ? ` ${e.minute}` : ''}`;
                return (
                  <span key={key} className="scorer-entry" onClick={(ev) => handleScorerClick(key, ev)}>
                    {activeScorerKey === key && <div className="scorer-popup">{full}</div>}
                    <span className="scorer-entry-text">{getEventIcon(e.type.text)}{e.minute && <> {e.minute}</>} {cleanDescription(e.description)}</span>
                  </span>
                );
              })}
            </div>
            <div className="scorer-col scorer-col--home">
              {homeScorers.map((e, i) => {
                const key = `home-${i}`;
                const full = `${getEventIcon(e.type.text)} ${cleanDescription(e.description)}${e.minute ? ` ${e.minute}` : ''}`;
                return (
                  <span key={key} className="scorer-entry" onClick={(ev) => handleScorerClick(key, ev)}>
                    {activeScorerKey === key && <div className="scorer-popup">{full}</div>}
                    <span className="scorer-entry-text">{getEventIcon(e.type.text)}{e.minute && <> {e.minute}</>} {cleanDescription(e.description)}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Customize score display for soccer (add penalty shootout if needed)
  const isPenaltyShootout = game.status?.type === 'STATUS_FINAL_PEN';
  const renderScore = (team, isHome, animations = {}) => {
    const animationClass = animations && animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : '';
    return (
      <div className="soccer-score">
        <div className={`team-score ${animationClass}`}>
          {team.score || '0'}
        </div>
        {isPenaltyShootout && team.shootoutScore != null && (
          <div className="penalties">
            ({team.shootoutScore})
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseGameTile
      {...props}
      renderAdditionalInfo={renderAdditionalInfo}
      renderScore={renderScore}
    />
  );
}

export default SoccerGameTile;
