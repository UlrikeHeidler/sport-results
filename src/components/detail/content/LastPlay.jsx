import React from 'react';
import './LastPlay.css';

// Resolve a team logo from play.team.id against the game object.
// Works across sports as long as the team id field is populated.
export function resolveTeamLogo(play, game) {
  if (!game || !play) return null;
  const tid = String(play.team?.id ?? play.team?.teamId ?? '');
  if (!tid) return null;
  if (String(game.homeTeam?.id) === tid) return game.homeTeam?.logo ?? null;
  if (String(game.awayTeam?.id) === tid) return game.awayTeam?.logo ?? null;
  return null;
}

export function LastPlay({ logo, time, text }) {
  if (!text) return null;
  return (
    <div className="last-play">
      <span className="last-play-label">Last Play</span>
      <div className="last-play-body">
        {logo && <img src={logo} alt="" className="last-play-logo" />}
        {time && <span className="last-play-time">{time}</span>}
        <span className="last-play-text">{text}</span>
      </div>
    </div>
  );
}
