import { useState, useCallback, useEffect } from 'react';
import BaseGameTile from './BaseGameTile';
import { useSoccerTimeline } from '../../hooks/useSoccerTimeline';
import './GameTiles.soccer.css';
import { isGameOngoing } from '../../services/gameUtils';

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

  const handleEventClick = useCallback((idx, e) => {
    e.stopPropagation();
    setActiveEventIdx(prev => prev === idx ? null : idx);
  }, []);

  // Dismiss popup when clicking anywhere outside a timeline event
  useEffect(() => {
    if (activeEventIdx === null) return;
    const dismiss = () => setActiveEventIdx(null);
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, [activeEventIdx]);

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
    return (
      <div className="soccer-info">
        {/* Timeline */}
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
      </div>
    );
  };

  // Customize score display for soccer (add penalty shootout if needed)
  const renderScore = (team, isHome, animations = {}) => {
    const animationClass = animations && animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : '';
    return (
      <div className="soccer-score">
        <div className={`team-score ${animationClass}`}>
          {team.score || '0'}
        </div>
        {game.situation?.penalties && (
          <div className="penalties">
            ({team.penalties || 0})
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
