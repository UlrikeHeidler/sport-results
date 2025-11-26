/**
 * Reusable TeamInfo component
 * Consolidates team display logic previously duplicated across game tiles
 */

import React from 'react';
import { getTeamForm, getFormColor } from '../../services/teamStats';
import './TeamInfo.css';

/**
 * TeamLogo component for consistent logo rendering
 */
export const TeamLogo = ({ team, size = 36 }) => {
  if (!team?.logo) return null;

  return (
    <img 
      src={team.logo}
      alt={`${team.name} logo`}
      className="team-logo"
      loading="lazy"
      decoding="async"
      width={size}
      height={size}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
};

/**
 * TeamForm component for displaying team's recent form
 */
export const TeamForm = ({ team, league, showForm = true }) => {
  if (!showForm || !team?.id) return null;

  const form = getTeamForm(team.id, league);
  
  return (
    <div className="team-form">
      {form.map((result, index) => (
        <span
          key={index}
          className="form-indicator"
          style={{
            backgroundColor: getFormColor(result),
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            display: 'inline-block',
            margin: '0 2px'
          }}
          title={result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
        />
      ))}
    </div>
  );
};

/**
 * TeamRanking component for displaying team rankings
 */
export const TeamRanking = ({ team }) => {
  if (team?.ranking == null || isNaN(team.ranking) || team.ranking >= 26) {
    return null;
  }

  return (
    <div className="team-ranking" title={`Ranked #${team.ranking}`}>
      #{team.ranking}
    </div>
  );
};

/**
 * PossessionIndicator component for football games
 */
export const PossessionIndicator = ({ team, game, isHome }) => {
  // Only show possession indicator for football (NFL, FBS, FCS, NCAAF, CFB, etc)
  const leagueOrSport = (game?.league || game?.sport || '');
  const isFootball = /football|fbs|fcs|ncaaf|nfl|cfb/i.test(leagueOrSport);
  
  if (!isFootball) return null;

  let hasPossession = false;
  const situation = game?.situation || null;
  
  if (situation) {
    if (situation.possessionWhich) {
      if (situation.possessionWhich === 'home') hasPossession = !!isHome;
      else if (situation.possessionWhich === 'away') hasPossession = !isHome;
    } else if (situation?.lastPlay && situation?.lastPlay?.team?.id) {
      if (situation.lastPlay.team.id === team?.id) hasPossession = true;
    } else {
      const poss = situation.possession || situation.possessionLabel || null;
      if (poss) {
        const normalize = v => (v == null ? '' : String(v).toLowerCase());
        const possNorm = normalize(poss);
        const teamNorms = [team?.abbreviation, team?.name, team?.displayName].map(normalize);
        if (teamNorms.includes(possNorm)) hasPossession = true;
      }
    }
  }

  if (!hasPossession) return null;

  return (
    <span className="possession-marker" aria-hidden title="Has possession">
      🏈
    </span>
  );
};

/**
 * TeamName component with possession indicator and tooltip
 */
export const TeamName = ({ team, game, isHome, showForm = true, showPossession = true }) => {
  const hasPossession = showPossession && game && isFootballGame(game);

  return (
    <div className="team-details">
      <div className={`team-name${hasPossession ? ' has-possession' : ''}`}>
        <span className="abbrev">{team?.abbreviation}</span>
        {showForm && <TeamForm team={team} league={game?.league} showForm={showForm} />}
        {showPossession && <PossessionIndicator team={team} game={game} isHome={isHome} />}
        <span className="tooltip">{team?.name}</span>
      </div>
    </div>
  );
};

/**
 * Complete TeamInfo component combining all team display elements
 */
export const TeamInfo = ({ 
  team, 
  game, 
  isHome = false, 
  showForm = true, 
  showRanking = true,
  showPossession = true,
  logoSize = 36 
}) => {
  return (
    <div className="team-info">
      <TeamLogo team={team} size={logoSize} />
      <TeamName 
        team={team} 
        game={game} 
        isHome={isHome} 
        showForm={showForm} 
        showPossession={showPossession} 
      />
      {showRanking && <TeamRanking team={team} />}
    </div>
  );
};

/**
 * Utility function to check if game is football
 */
const isFootballGame = (game) => {
  const leagueOrSport = (game?.league || game?.sport || '');
  return /football|fbs|fcs|ncaaf|nfl|cfb/i.test(leagueOrSport);
};

export default TeamInfo;