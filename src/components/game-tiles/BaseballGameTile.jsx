import React from 'react';
import BaseGameTile from './BaseGameTile';

const BaseballGameTile = (props) => {
  const { game } = props;
  
  // Baseball-specific additional info renderer
  const renderAdditionalInfo = () => {
    console.log('BaseballGameTile rendering additional info with situation:', game.situation);
    if (!game.situation) return null;
    
    return (
      <div className="baseball-info">
        {game.situation.inning && (
          <div className="inning-info">
            <span className="inning">
              {game.situation.isTopInning ? '▲' : '▼'} {game.situation.inning}
            </span>
          </div>
        )}
        {game.situation.balls !== undefined && (
          <div className="count-info">
            <span className="count">{game.situation.balls}-{game.situation.strikes}</span>
            <span className="outs">{game.situation.outs} out{game.situation.outs !== 1 ? 's' : ''}</span>
          </div>
        )}
        {game.situation.onBase && (
          <div className="bases-info">
            {game.situation.onFirst && <span className="on-base first">1B</span>}
            {game.situation.onSecond && <span className="on-base second">2B</span>}
            {game.situation.onThird && <span className="on-base third">3B</span>}
          </div>
        )}
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