import React from 'react';
import BaseGameTile from './BaseGameTile';
import './GameTiles.baseball.css';

const BaseballGameTile = (props) => {
  const { game } = props;
  
  // Baseball-specific additional info renderer with base-diamond visualization
  const renderAdditionalInfo = () => {
    // defensive: if there is no situation data, don't render the section
    if (!game.situation) return null;

    const s = game.situation;

    return (
      <div className="baseball-info">
        {s.inning && (
          <div className="inning-info" aria-hidden>
            <span className="inning">{s.isTopInning ? '▲' : '▼'} {s.inning}</span>
          </div>
        )}

        <div className="baseball-situation-row">
          {/* Diamond visualization: first, second, third bases */}
          <div className="baseball-diamond" role="img" aria-label={`Runners on bases: ${s.onFirst ? 'first ' : ''}${s.onSecond ? 'second ' : ''}${s.onThird ? 'third' : ''}`}>
            <svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              {/* diamond outline */}
              <rect x="4" y="4" width="44" height="44" rx="5" ry="5" transform="rotate(45 26 26)" fill="none" stroke="var(--border-color)" strokeWidth="2" />
              {/* second base (top) */}
              <circle cx="26" cy="10" r="5" className={`base second ${s.onSecond ? 'occupied' : 'empty'}`} />
              {/* first base (right) */}
              <circle cx="42" cy="26" r="5" className={`base first ${s.onFirst ? 'occupied' : 'empty'}`} />
              {/* third base (left) */}
              <circle cx="10" cy="26" r="5" className={`base third ${s.onThird ? 'occupied' : 'empty'}`} />
            </svg>
          </div>

          {/* Numeric count: balls-strikes-outs */}
          <div className="count-info" aria-hidden>
            <span className="count">{s.balls != null ? s.balls : '-'}-{s.strikes != null ? s.strikes : '-'}</span>
            <span className="outs">{s.outs != null ? `${s.outs} out${s.outs !== 1 ? 's' : ''}` : '—'}</span>
          </div>
        </div>

      </div>
    );
  };

  // Optional: Custom score renderer for baseball-specific scoring display
  const renderScore = (team, isHome, animations = {}) => {
    const animationClass = animations && animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : '';
    return (
      <div className={`team-score ${animationClass}`}>
        {team.score || '0'}
        {game.situation?.inningScores?.[isHome ? 'home' : 'away'] && (
          <div className="inning-scores">
            {game.situation.inningScores[isHome ? 'home' : 'away'].join(' ')}
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
};

export default BaseballGameTile;