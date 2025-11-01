
import React from 'react';
import BaseGameTile from './BaseGameTile';
import './GameTiles.baseball.css';

const BaseballGameTile = (props) => {
  const { game } = props;

    // Optional: Custom score renderer for baseball-specific scoring display
  // Accepts team, isHome, animations, and situation (passed from BaseGameTile)
  const renderScore = (team, isHome, animations = {}, situation) => {
    const animationClass = animations && animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : '';
    return (
      <div className={`team-score ${animationClass}`}>
        {team.score || '0'}
        {situation?.inningScores?.[isHome ? 'home' : 'away'] && (
          <div className="inning-scores">
            {situation.inningScores[isHome ? 'home' : 'away'].join(' ')}
          </div>
        )}
      </div>
    );
  };
  
  // Baseball-specific additional info renderer with base-diamond visualization
  const renderAdditionalInfo = () => {
    // defensive: if there is no situation data, don't render the section
    if (!game.situation) return null;

    const s = game.situation;
    // console.log('Rendering baseball additional info for game:', game.id, s);
    // console.log('Baseball situation data:', s.currentBatter, s.currentPitcher);
    return (
      <div className="baseball-info condensed">
        <div className="baseball-info-row condensed">
          <div className="batter-pitcher-info condensed">
            {s.currentBatter && (
              <span className="batter-name" aria-label={`Current batter: ${s.currentBatter?.displayName}`}>
                <span className="label">At Bat:</span> <span className="name">{s.currentBatter?.displayName}</span> <br />
                <span className="stats">({s.currentBatterStats})</span>
              </span>
       
            )}
            <br />
            {s.currentPitcher && (
              <span className="pitcher-name" aria-label={`Current pitcher: ${s.currentPitcher?.displayName}`}>
                <span className="label">P:</span> <span className="name">{s.currentPitcher?.displayName}</span> <br />
                <span className="stats">({s.currentPitcherStats})</span>
              </span>
            )}
          </div>
          <div className="inning-diamond-group condensed">
            {s.inning && (
              <span className="inning-info" aria-hidden>
                <span className="inning">{s.isTopInning ? '▲' : '▼'} {s.inning}</span>
              </span>
            )}
            <span className="baseball-diamond" role="img" aria-label={`Runners on bases: ${s.onFirst ? 'first ' : ''}${s.onSecond ? 'second ' : ''}${s.onThird ? 'third' : ''}`}>
              <svg width="38" height="38" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="4" y="4" width="44" height="44" rx="5" ry="5" transform="rotate(45 26 26)" fill="#fff6" stroke="var(--border-color)" strokeWidth="2" />
                <circle cx="26" cy="10" r="5" className={`base second ${s.onSecond ? 'occupied' : 'empty'}`} />
                <circle cx="42" cy="26" r="5" className={`base first ${s.onFirst ? 'occupied' : 'empty'}`} />
                <circle cx="10" cy="26" r="5" className={`base third ${s.onThird ? 'occupied' : 'empty'}`} />
              </svg>
            </span>
            <span className="count-info condensed" aria-hidden>
              <span className="count">B:<b>{s.balls != null ? s.balls : '-'}</b> S:<b>{s.strikes != null ? s.strikes : '-'}</b></span>
              <span className="outs">O:<b>{s.outs != null ? `${s.outs}` : '—'}</b></span>
            </span>
          </div>
        </div>
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