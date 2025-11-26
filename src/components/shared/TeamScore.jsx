/**
 * Reusable TeamScore component
 * Consolidates score display logic with animation support
 */

import React from 'react';
import { useScoreAnimations } from '../../hooks/useGameAnimations';
import './TeamScore.css';

/**
 * Basic score display component
 */
export const ScoreDisplay = ({ 
  score, 
  animationClass = '', 
  className = 'team-score',
  'aria-label': ariaLabel 
}) => {
  return (
    <div 
      className={`${className} ${animationClass}`.trim()}
      aria-label={ariaLabel}
    >
      {score || '0'}
    </div>
  );
};

/**
 * Enhanced team score component with animations
 */
export const TeamScore = ({ 
  team, 
  game, 
  isHome, 
  animations = {},
  showQuarterScores = false,
  showInningScores = false,
  className = 'team-score'
}) => {
  const score = team?.score || '0';
  const animationKey = isHome ? 'homeScore' : 'awayScore';
  const animationClass = animations[animationKey] ? 'score-changed' : '';

  // Get sport-specific additional score data
  const quarterScores = game?.situation?.quarterScores?.[isHome ? 'home' : 'away'] || [];
  const inningScores = game?.situation?.inningScores?.[isHome ? 'home' : 'away'] || [];

  return (
    <div className="team-score-container">
      <ScoreDisplay 
        score={score}
        animationClass={animationClass}
        className={className}
        aria-label={`${team?.name || 'Team'} score: ${score}`}
      />
      
      {/* Basketball quarter scores */}
      {showQuarterScores && quarterScores.length > 0 && (
        <div className="quarter-scores" aria-label="Quarter by quarter scores">
          {quarterScores.map((qScore, index) => (
            <span key={index} className="quarter-score">
              {qScore}
            </span>
          ))}
        </div>
      )}
      
      {/* Baseball inning scores */}
      {showInningScores && inningScores.length > 0 && (
        <div className="inning-scores" aria-label="Inning by inning scores">
          {inningScores.map((iScore, index) => (
            <span key={index} className="inning-score">
              {iScore}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Animated team score component using the animation hook
 */
export const AnimatedTeamScore = ({ 
  team, 
  game, 
  isHome, 
  showQuarterScores = false,
  showInningScores = false,
  className = 'team-score'
}) => {
  const { getScoreClass } = useScoreAnimations(game);
  
  return (
    <TeamScore
      team={team}
      game={game}
      isHome={isHome}
      animations={{ [isHome ? 'homeScore' : 'awayScore']: getScoreClass(isHome).includes('score-changed') }}
      showQuarterScores={showQuarterScores}
      showInningScores={showInningScores}
      className={`${className} ${getScoreClass(isHome)}`.trim()}
    />
  );
};

/**
 * Sport-specific score components
 */

// Baseball score with inning breakdown
export const BaseballScore = ({ team, game, isHome, animations = {} }) => (
  <TeamScore
    team={team}
    game={game}
    isHome={isHome}
    animations={animations}
    showInningScores={true}
    className="baseball-score"
  />
);

// Basketball score with quarter breakdown
export const BasketballScore = ({ team, game, isHome, animations = {} }) => (
  <TeamScore
    team={team}
    game={game}
    isHome={isHome}
    animations={animations}
    showQuarterScores={true}
    className="basketball-score"
  />
);

// Football score (standard)
export const FootballScore = ({ team, game, isHome, animations = {} }) => (
  <TeamScore
    team={team}
    game={game}
    isHome={isHome}
    animations={animations}
    className="football-score"
  />
);

// Hockey score (standard)
export const HockeyScore = ({ team, game, isHome, animations = {} }) => (
  <TeamScore
    team={team}
    game={game}
    isHome={isHome}
    animations={animations}
    className="hockey-score"
  />
);

// Soccer score (standard)
export const SoccerScore = ({ team, game, isHome, animations = {} }) => (
  <TeamScore
    team={team}
    game={game}
    isHome={isHome}
    animations={animations}
    className="soccer-score"
  />
);

/**
 * Score factory function to get appropriate score component for sport
 */
export const getScoreComponent = (sport) => {
  const sportLower = sport?.toLowerCase() || '';
  
  if (sportLower.includes('baseball') || sportLower === 'mlb') {
    return BaseballScore;
  }
  
  if (sportLower.includes('basketball') || sportLower === 'nba' || sportLower === 'ncaaw') {
    return BasketballScore;
  }
  
  if (sportLower.includes('football') || sportLower === 'nfl' || sportLower === 'fbs' || sportLower === 'fcs') {
    return FootballScore;
  }
  
  if (sportLower.includes('hockey') || sportLower === 'nhl') {
    return HockeyScore;
  }
  
  if (sportLower.includes('soccer') || sportLower.includes('bundesliga') || sportLower === 'mls' || sportLower === 'ucl') {
    return SoccerScore;
  }
  
  // Default to standard team score
  return TeamScore;
};

export default TeamScore;