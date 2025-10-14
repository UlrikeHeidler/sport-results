import React from 'react';
import BaseGameTile from './BaseGameTile';

const SoccerGameTile = (props) => {
  const { game } = props;

  // Soccer-specific additional info renderer
  const renderAdditionalInfo = () => {
    if (!game.situation) return null;
    
    return (
      <div className="soccer-info">
        {game.situation.matchTime && (
          <div className="match-time">
            <span className="time">{game.situation.matchTime}'</span>
            {game.situation.addedTime && (
              <span className="added-time">+{game.situation.addedTime}</span>
            )}
          </div>
        )}
        {game.situation.period === 'Halftime' && (
          <div className="halftime">HT</div>
        )}
        {game.situation.yellowCards || game.situation.redCards ? (
          <div className="cards">
            {game.situation.yellowCards > 0 && (
              <span className="yellow-cards">🟨 {game.situation.yellowCards}</span>
            )}
            {game.situation.redCards > 0 && (
              <span className="red-cards">🟥 {game.situation.redCards}</span>
            )}
          </div>
        ) : null}
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
};

export default SoccerGameTile;