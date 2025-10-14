import React from 'react';
import BaseGameTile from './BaseGameTile';

const FootballGameTile = (props) => {
  const { game } = props;

  // Custom score renderer for football
  const renderScore = (team, isHome, animations = {}) => {
    const animationClass = animations && animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : '';
    const quarterScores = game.situation?.quarterScores?.[isHome ? 'home' : 'away'] || [];
    
    return (
      <div className="football-score">
        <div className={`team-score ${animationClass}`}>
          {team.score || '0'}
        </div>
        {quarterScores.length > 0 && (
          <div className="quarter-scores">
            {quarterScores.map((score, i) => (
              <span key={i} className="quarter-score">Q{i+1}: {score}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Football-specific additional info renderer
  const renderAdditionalInfo = () => {
    if (!game.situation) return null;
    
    return (
      <div className="football-info">
        {game.situation.possession && (
          <div className="possession-info">
            <span className="possession-indicator">🏈</span>
            <span className="possession-team">{game.situation.possession}</span>
          </div>
        )}
        {game.situation.down && (
          <div className="down-distance">
            <span className="down">{game.situation.down}{getDownSuffix(game.situation.down)} & {game.situation.distance}</span>
            {game.situation.yardLine && (
              <span className="yard-line">at {game.situation.yardLine}</span>
            )}
          </div>
        )}
        {game.situation.redZone && (
          <div className="red-zone-indicator">🔴 Red Zone</div>
        )}
      </div>
    );
  };

  // Helper to get the correct suffix for downs
  const getDownSuffix = (down) => {
    if (down === 1) return 'st';
    if (down === 2) return 'nd';
    if (down === 3) return 'rd';
    return 'th';
  };

  return (
    <BaseGameTile
      {...props}
      renderAdditionalInfo={renderAdditionalInfo}
    />
  );
};

export default FootballGameTile;