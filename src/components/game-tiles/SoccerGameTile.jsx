import BaseGameTile from './BaseGameTile';
import { useSoccerTimeline } from '../../hooks/useSoccerTimeline';
import './GameTiles.soccer.css';

// Helper to convert minute string to percentage of match duration (0-100)
function getTimelinePosition(minuteStr) {
  // Try to parse the minute (e.g., '45+2', '90', '12')
  if (!minuteStr) return 0;
  const base = parseInt(minuteStr, 10);
  let min = isNaN(base) ? 0 : base;
  // Cap at 120 for extra time, else 90
  const max = min > 90 ? 120 : 90;
  let percent = Math.min(100, Math.round((min / max) * 100));
  return percent;
}


const SoccerGameTile = (props) => {
  const { game, refreshInterval = 30 } = props;
  const timeline = useSoccerTimeline(game.league, game.id, refreshInterval);
  console.log(game.id,'SoccerGameTile timeline:', timeline);
  const renderAdditionalInfo = () => {
    return (
      <div className="soccer-info">
        {/* Timeline */}
        {timeline && timeline.length > 0 && (
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
                  {timeline.map((event, idx) =>
                    event.team === game.homeTeam.id ? (
                      <span
                        key={idx}
                        className={`timeline-event timeline-${event.type.text.toLowerCase().replace(/\s/g, '-')}`.trim()}
                        style={{ left: `calc(${getTimelinePosition(event.minute)}% - 1em)` }}
                        title={`${event.minute} - ${event.description}`}
                      >
                        {event.minute && <span className="timeline-minute">{event.minute}</span>}
                        {event.type.text.toLowerCase().includes('goal') && '⚽'}
                        {event.type.text.toLowerCase().includes('yellow') && '🟨'}
                        {event.type.text.toLowerCase().includes('red') && '🟥'}
                        {event.type.text.toLowerCase().includes('substitution') && '🔄'}
                      </span>
                    ) : null
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
                  {timeline.map((event, idx) =>
                    event.team === game.awayTeam.id ? (
                      <span
                        key={idx}
                        className={`timeline-event timeline-${event.type.text.toLowerCase().replace(/\s/g, '-')}`.trim()}
                        style={{ left: `calc(${getTimelinePosition(event.minute)}% - 1em)` }}
                        title={`${event.minute} - ${event.description}`}
                      >
                        {event.minute && <span className="timeline-minute">{event.minute}</span>}
                        {event.type.text.toLowerCase().includes('goal') && '⚽'}
                        {event.type.text.toLowerCase().includes('yellow') && '🟨'}
                        {event.type.text.toLowerCase().includes('red') && '🟥'}
                        {event.type.text.toLowerCase().includes('substitution') && '🔄'}
                      </span>
                    ) : null
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
