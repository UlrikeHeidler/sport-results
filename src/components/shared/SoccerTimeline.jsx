import { useState, useCallback, useEffect } from 'react';
import '../game-tiles/GameTiles.soccer.css';

export function getTimelinePosition(minuteStr, overTime) {
  if (!minuteStr) return 0;
  const overtimeMatch = minuteStr.match(/^(\d+)[+'']?(?:\+|')?(\d+)?/);
  if (!overtimeMatch) return 0;
  const base = parseInt(overtimeMatch[1], 10);
  const added = overtimeMatch[2] ? parseInt(overtimeMatch[2], 10) : 0;
  const min = base + added;
  const max = overTime === 'overtime' ? 120 : 90;
  return Math.min(100, Math.round((min / max) * 100));
}

export function SoccerTimeline({ timeline, homeTeam, awayTeam, overTime = 'regular' }) {
  const [activeEventIdx, setActiveEventIdx] = useState(null);

  const handleEventClick = useCallback((idx, e) => {
    e.stopPropagation();
    setActiveEventIdx(prev => prev === idx ? null : idx);
  }, []);

  useEffect(() => {
    if (activeEventIdx === null) return;
    const dismiss = () => setActiveEventIdx(null);
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, [activeEventIdx]);

  if (!timeline?.length) return null;

  const renderEvent = (event, idx) => {
    const isActive = activeEventIdx === idx;
    const text = (event.type?.text ?? '').toLowerCase();
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

  return (
    <div className="soccer-timeline-outer">
      <div className="soccer-timeline-content">
        <div className="soccer-timeline-row soccer-timeline-home">
          <div className="soccer-timeline-logos">
            {homeTeam?.logo && (
              <img src={homeTeam.logo} alt={homeTeam.name + ' logo'}
                className="soccer-timeline-logo home" width={16} height={16}
                loading="lazy" decoding="async" onError={e => { e.target.style.display = 'none'; }} />
            )}
          </div>
          {timeline.map((event, idx) => event.team === homeTeam?.id ? renderEvent(event, idx) : null)}
        </div>
        <div className="soccer-timeline-line" />
        <div className="soccer-timeline-row soccer-timeline-away">
          <div className="soccer-timeline-logos">
            {awayTeam?.logo && (
              <img src={awayTeam.logo} alt={awayTeam.name + ' logo'}
                className="soccer-timeline-logo away" width={16} height={16}
                loading="lazy" decoding="async" onError={e => { e.target.style.display = 'none'; }} />
            )}
          </div>
          {timeline.map((event, idx) => event.team === awayTeam?.id ? renderEvent(event, idx) : null)}
        </div>
      </div>
    </div>
  );
}
