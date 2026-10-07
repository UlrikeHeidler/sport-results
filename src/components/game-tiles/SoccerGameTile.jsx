import { useState, useCallback, useEffect } from 'react';
import BaseGameTile from './BaseGameTile';
import { useSoccerTimeline } from '../../hooks/useSoccerTimeline';
import { SoccerTimeline } from '../shared/SoccerTimeline';
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

const SoccerGameTile = (props) => {
  const { game, refreshInterval = 30 } = props;
  const timeline = useSoccerTimeline(game.league, game.id, refreshInterval);
  const [activeScorerKey, setActiveScorerKey] = useState(null);

  const handleScorerClick = useCallback((key, e) => {
    e.stopPropagation();
    setActiveScorerKey(prev => prev === key ? null : key);
  }, []);

  useEffect(() => {
    if (activeScorerKey === null) return;
    const dismiss = () => setActiveScorerKey(null);
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, [activeScorerKey]);

  const overTime = game.status?.type?.includes("OVERTIME") ? 'overtime' : 'regular';

  const renderAdditionalInfo = () => {
    const { isInDetailMode } = props;

    // Goals and cards only — no substitutions in the scorer list
    const scorerEvents = timeline.filter(e => getEventIcon(e.type?.text ?? '') !== null);
    const homeScorers = scorerEvents.filter(e => e.team === game.homeTeam?.id);
    const awayScorers = scorerEvents.filter(e => e.team === game.awayTeam?.id);

    const isFinished = !isGameOngoing(game.status);

    // In detail mode: nothing to show once the game is over (key events panel covers it)
    if (isInDetailMode && isFinished) return null;

    return (
      <div className="soccer-info">
        {/* Timeline — live games only */}
        {isGameOngoing(game.status) && (
          <SoccerTimeline
            timeline={timeline}
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
            overTime={overTime}
          />
        )}

        {/* Scorer list — finished games, tile mode only */}
        {(homeScorers.length > 0 || awayScorers.length > 0) && isFinished && !isInDetailMode && (
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
  const isPenaltyShootout = game.status?.type === 'STATUS_FINAL_PEN' ||
    game.status?.type === 'STATUS_PENALTIES' ||
    game.status?.type === 'STATUS_SHOOTOUT';
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
