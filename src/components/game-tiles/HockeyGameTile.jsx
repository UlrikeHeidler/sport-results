import React from 'react';
import BaseGameTile from './BaseGameTile';

const HockeyGameTile = (props) => {
  const { game } = props;

  // Hockey-specific additional info renderer
  const renderAdditionalInfo = () => {
    if (!game.situation) return null;
    // normalize shot counts for display
    const shotHome = getShotCount(true);
    const shotAway = getShotCount(false);

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

        {(shotHome != null || shotAway != null) && (
          <div className="shots-on-goal">
            <div className="shots away">SOG: {shotAway != null ? shotAway : '-'}</div>
            <div className="shots home">SOG: {shotHome != null ? shotHome : '-'}</div>
          </div>
        )}
      </div>
    );
  };

  // Customize score display for hockey (add SOG if available)
  const renderScore = (team, isHome, animations = {}) => {
    const animationClass = animations && animations[isHome ? 'homeScore' : 'awayScore'] ? 'score-changed' : '';
    const shotCount = getShotCount(isHome);
    
    return (
      <div className="hockey-score">
        <div className={`team-score ${animationClass}`}>
          {team.score || '0'}
        </div>
        {shotCount != undefined && (
          <div className="shots-count">({shotCount})</div>
        )}
      </div>
    );
  };

  // Helper to extract shot counts from various possible fields
  function getShotCount(isHome) {
    // priority: situation.shotCount.{home|away} -> situation.shots{Home/Away} -> game.teams.home.shots
    try {
      const s = game.situation || {};
      const side = isHome ? 'home' : 'away';

      // 1) normalized shotCount object
      if (s.shotCount && (s.shotCount[side] !== undefined && s.shotCount[side] !== null)) {
        return s.shotCount[side];
      }

      // 2) alternate keys
      const alt1 = isHome ? s.shotCountHome ?? s.shotsHome ?? s.sogHome : s.shotCountAway ?? s.shotsAway ?? s.sogAway;
      if (alt1 !== undefined && alt1 !== null) return alt1;

      // 3) from game.teams
      const teamObj = isHome ? (game.homeTeam || game.teams?.home) : (game.awayTeam || game.teams?.away);
      if (teamObj) {
        const tCandidates = [teamObj.shots, teamObj.shotsOnGoal, teamObj.sog, teamObj.statistics?.shots, teamObj.statistics?.sog];
        for (const c of tCandidates) {
          if (c !== undefined && c !== null) return c;
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  return (
    <BaseGameTile
      {...props}
      renderAdditionalInfo={renderAdditionalInfo}
      renderScore={renderScore}
    />
  );
};

export default HockeyGameTile;