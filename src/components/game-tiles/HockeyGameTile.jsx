import React from 'react';
import BaseGameTile from './BaseGameTile';

const HockeyGameTile = (props) => {
  const { game } = props;

  // Hockey-specific additional info renderer
  const renderAdditionalInfo = () => {
    if (!game.situation) return null;
    
    return (
      <div className="hockey-info">
        {game.situation.powerPlay && (
          <div className="power-play">
            <span className="power-play-text">
              Power Play: {game.situation.powerPlayTeam}
            </span>
            {game.situation.powerPlayTime && (
              <span className="power-play-time">{game.situation.powerPlayTime}</span>
            )}
          </div>
        )}
        {game.situation.shotCount && (
          <div className="shots-on-goal">
            <div className="shots away">SOG: {game.situation.shotCount.away}</div>
            <div className="shots home">SOG: {game.situation.shotCount.home}</div>
          </div>
        )}
      </div>
    );
  };

  // Customize score display for hockey (add SOG if available)
  const renderScore = (team, isHome, animations = {}) => {
    const animationClass = animations && animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : '';
    const shotCount = game.situation?.shotCount?.[isHome ? 'home' : 'away'];
    
    return (
      <div className="hockey-score">
        <div className={`team-score ${animationClass}`}>
          {team.score || '0'}
        </div>
        {shotCount !== undefined && (
          <div className="shots-count">({shotCount})</div>
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

export default HockeyGameTile;