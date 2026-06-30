
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
  
  const renderLinescore = () => {
    const ls = game.linescores;
    if (!ls) return null;
    const innings = Math.max(ls.home.length, ls.away.length);
    if (innings === 0) return null;
    const cols = Array.from({ length: innings }, (_, i) => i);
    return (
      <table className="linescore-table" aria-label="Linescore">
        <thead>
          <tr>
            <th className="ls-team-col" />
            {cols.map(i => <th key={i}>{i + 1}</th>)}
            <th className="ls-total">R</th>
            <th className="ls-total">H</th>
            <th className="ls-total">E</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="ls-team-col">{game.awayTeam.abbreviation}</td>
            {cols.map(i => <td key={i}>{ls.away[i] ?? ''}</td>)}
            <td className="ls-total">{game.awayTeam.score}</td>
            <td className="ls-total">{game.awayTeam.hits ?? '-'}</td>
            <td className="ls-total">{game.awayTeam.errors ?? '-'}</td>
          </tr>
          <tr>
            <td className="ls-team-col">{game.homeTeam.abbreviation}</td>
            {cols.map(i => <td key={i}>{ls.home[i] ?? ''}</td>)}
            <td className="ls-total">{game.homeTeam.score}</td>
            <td className="ls-total">{game.homeTeam.hits ?? '-'}</td>
            <td className="ls-total">{game.homeTeam.errors ?? '-'}</td>
          </tr>
        </tbody>
      </table>
    );
  };

  // Baseball-specific additional info renderer with base-diamond visualization
  const renderAdditionalInfo = () => {
    const s = game.situation;
    if (!s && !game.linescores) return null;

    return (
      <div className="baseball-info condensed">
        {renderLinescore()}
        {s && (
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
                <span className="inning-info">
                  <span className="inning">{s.isTopInning ? '▲' : '▼'} {s.inning}</span>
                </span>
              )}
              <div className="diamond-count-stack">
                <span className="baseball-diamond" role="img" aria-label={`Runners on bases: ${s.onFirst ? 'first ' : ''}${s.onSecond ? 'second ' : ''}${s.onThird ? 'third' : ''}`}>
                  <svg width="38" height="38" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <rect x="4" y="4" width="44" height="44" rx="5" ry="5" transform="rotate(45 26 26)" fill="#fff6" stroke="var(--border-color)" strokeWidth="2" />
                    <circle cx="26" cy="10" r="5" className={`base second ${s.onSecond ? 'occupied' : 'empty'}`} />
                    <circle cx="42" cy="26" r="5" className={`base first ${s.onFirst ? 'occupied' : 'empty'}`} />
                    <circle cx="10" cy="26" r="5" className={`base third ${s.onThird ? 'occupied' : 'empty'}`} />
                  </svg>
                </span>
                <div className="outs-dots" aria-label={`${s.outs ?? 0} out${s.outs !== 1 ? 's' : ''}`}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className={`out-dot${i < (s.outs ?? 0) ? ' out' : ''}`} aria-hidden="true" />
                  ))}
                </div>
                <div
                  className="count-display"
                  aria-label={`${s.balls ?? 0} balls, ${s.strikes ?? 0} strikes`}
                >
                  {s.balls ?? '-'}-{s.strikes ?? '-'}
                </div>
              </div>
            </div>
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