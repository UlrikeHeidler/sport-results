import React from 'react';
import BaseGameTile from './BaseGameTile';
import { getDownSuffix } from '../../utils/gameHelpers';
import './GameTiles.football.css';
import { debug } from '../../utils/logger';

// Inline SVG football, oriented vertically, tilted by possession
const FootballIcon = ({ possession }) => {
  const rotation = possession === 'away' ? 45 : possession === 'home' ? -45 : 0;
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      style={{ transform: `rotate(${rotation}deg)`, display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <path d="M10,1 C17,4 17,16 10,19 C3,16 3,4 10,1 Z" fill="#8B4513" stroke="white" strokeWidth="0.8" />
      <line x1="10" y1="2.5" x2="10" y2="17.5" stroke="#c8924a" strokeWidth="0.7" />
      <line x1="7" y1="7.5"  x2="13" y2="7.5"  stroke="white" strokeWidth="1" />
      <line x1="6.5" y1="10" x2="13.5" y2="10" stroke="white" strokeWidth="1" />
      <line x1="7" y1="12.5" x2="13" y2="12.5" stroke="white" strokeWidth="1" />
    </svg>
  );
};

const FootballGameTile = (props) => {
  const { game } = props;

  const renderAdditionalInfo = (game) => {
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
    const downDistanceText = situation.downDistanceText
      ? `${situation.downDistanceText}`
      : (down ? `${down}${getDownSuffix(down)} & ${distance ?? '—'}` : '—');
    const possession = situation.possessionWhich ?? null;

    return (
      <div className="football-info compact">
        <div className="compact-row">
          <div className="down-display">{downDistanceText}</div>
        </div>
        <div className="compact-row">
          <div className="field-display compact-field">
            <div className="field-line compact-line">
              <div className="ball-marker compact-ball" style={{ left: `${100 - (ballPercent / 100) * 100}%` }}>
                <FootballIcon possession={possession} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseGameTile
      {...props}
      renderAdditionalInfo={() => renderAdditionalInfo(game)}
    />
  );
};

export default FootballGameTile;
