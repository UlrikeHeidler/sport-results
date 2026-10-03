import React from 'react';
import BaseGameTile from './BaseGameTile';
import { getDownSuffix } from '../../utils/gameHelpers';
import './GameTiles.football.css';
import { debug } from '../../utils/logger';

// 🏈 emoji tilted to show possession direction
// home = tip points upper-right (-30°), away = tip points upper-left (+30°)
const FootballIcon = ({ possession }) => {
  const rotation = possession === 'home' ? -360 : -90;
  return (
    <span
      style={{ transform: `rotate(${rotation}deg)`, display: 'block', fontSize: '20px', lineHeight: 1 }}
      aria-hidden="true"
    >
      🏈
    </span>
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
    const possession = situation.possessionWhich ?? null;
    const isHalftime = /halftime/i.test(game.status?.type ?? '');
    const hasPossession = !!possession && !isHalftime;

    const downDistanceText = isHalftime
      ? 'Halftime'
      : situation.downDistanceText
        ? `${situation.downDistanceText}`
        : (down ? `${down}${getDownSuffix(down)} & ${distance ?? '—'}` : '—');

    return (
      <div className="football-info compact">
        <div className="compact-row">
          <div className="down-display">{downDistanceText}</div>
        </div>
        <div className="compact-row">
          <div className="field-display compact-field">
            <div className="field-line compact-line">
              {hasPossession && (
                <div className="ball-marker compact-ball" style={{ left: `${100 - (ballPercent / 100) * 100}%` }}>
                  <FootballIcon possession={possession} />
                </div>
              )}
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
