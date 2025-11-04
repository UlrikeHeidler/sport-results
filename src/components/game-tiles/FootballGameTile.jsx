import React from 'react';
import BaseGameTile from './BaseGameTile';
import './GameTiles.football.css';
import { debug } from '../../utils/logger';

// Helper function to get ordinal suffix for numbers
const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

const FootballGameTile = (props) => {
  const { game } = props;

  // Verbose dev logging (no-op in production)
  debug('FootballGameTile props:', props);
  debug('FootballGameTile game data:', {
    id: game.id,
    league: game.league,
    situation: game.situation,
    teams: {
      home: game.homeTeam,
      away: game.awayTeam
    }
  });

  // Helper to check if team has possession
  const hasPossession = (team) => {
    return game.situation?.possession === team.name;
  };

  // No custom score renderer here — let BaseGameTile render scores so they remain visible

  // Football-specific additional info renderer (compact)
  const renderAdditionalInfo = (game) => {
    debug('Rendering football additional info for game:', game.id);
    debug('Rendering football additional info :', game.situation);
    const situation = game.situation;
    if (!situation) {
      debug('No situation data for game:', game.id);
      return null;
    }

    const down = situation.down ?? null;
    const distance = situation.distance ?? null;
    const yardLine = situation.yardLine ? parseInt(situation.yardLine) : null;
    const inOpponent = situation.fieldSide === 'opponent';
    const ballPercent = yardLine ? (inOpponent ? 50 + (50 - yardLine) : yardLine) : 50;
    // Prefer provided downDistanceText, otherwise construct from down & distance
    const downDistanceText = situation.downDistanceText
      ? `${situation.downDistanceText}`
      : (down ? `${down}${getDownSuffix(down)} & ${distance ?? '—'}` : '—');
   
  debug('Football situation:', { down, distance, yardLine, inOpponent, ballPercent, downDistanceText });

    return (
      <div className="football-info compact">
        <div className="compact-row">
          <div className="down-display">{downDistanceText}</div>
        </div>
        <div className="compact-row">
          <div className="field-display compact-field">
            <div className="field-line compact-line">
              <div className="ball-marker compact-ball" style={{ left: `${(100-(ballPercent / 100) * 100)}%` }} />
            </div>
          </div>
        </div>
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

  // Separate props for BaseGameTile - compute additional info at render time
  const baseGameProps = {
    ...props,
    renderAdditionalInfo: () => {
      debug('renderAdditionalInfo called in FootballGameTile');
      return renderAdditionalInfo(game);
    }
  };

  debug('Rendering FootballGameTile BaseGameTile with:', {
    hasRenderFunction: !!renderAdditionalInfo,
    gameHasSituation: !!game.situation
  });

  return (
    <>
      {/* Normal render through BaseGameTile */}
      <BaseGameTile {...baseGameProps} />
    </>
  );
};

export default FootballGameTile;