import React from 'react';
import BaseGameTile from './BaseGameTile';
import './GameTiles.basketball.css';

const BasketballGameTile = (props) => {
  const { game } = props;

  // Basketball-specific additional info renderer
  const renderAdditionalInfo = () => {
    if (!game.situation) return null;
    
    return (
      <div className="basketball-info">
        {game.situation.shotClock && (
          <div className="shot-clock">
            Shot: {game.situation.shotClock}
          </div>
        )}
        {game.situation.teamFouls && (
          <div className="team-fouls">
            <div className="fouls away">Fouls: {game.situation.teamFouls.away}</div>
            <div className="fouls home">Fouls: {game.situation.teamFouls.home}</div>
          </div>
        )}
        {game.situation.bonus && (
          <div className="bonus-indicator">
            {game.situation.bonus.away && <span className="bonus away">B</span>}
            {game.situation.bonus.home && <span className="bonus home">B</span>}
          </div>
        )}
      </div>
    );
  };

  // Custom score display to show quarter points if available
  const renderScore = (team, isHome, animations = {}) => {
    const animationClass = animations && animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : '';
    const quarters = game.situation?.quarterScores?.[isHome ? 'home' : 'away'] || [];
    
    return (
      <div className="basketball-score">
        <div className={`team-score ${animationClass}`}>
          {team.score || '0'}
        </div>
        {quarters.length > 0 && (
          <div className="quarter-scores">
            {quarters.map((score, i) => (
              <span key={i} className="quarter-score">{score}</span>
            ))}
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

export default BasketballGameTile;