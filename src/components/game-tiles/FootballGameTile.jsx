import React from 'react';
import BaseGameTile from './BaseGameTile';
import './FootballTile.css';

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

  // Minimal logging
  console.log('FootballGameTile:', game.id, 'situation?', !!game.situation);

  // Helper to check if team has possession
  const hasPossession = (team) => {
    return game.situation?.possession === team.name;
  };

  // No custom score renderer here — let BaseGameTile render scores so they remain visible

  // Football-specific additional info renderer (compact)
  const renderAdditionalInfo = () => {
    const s = game.situation;
    if (!s) return null;

    const down = s.down ?? null;
    const distance = s.distance ?? null;
    const yardLine = s.yardLine ? parseInt(s.yardLine) : null;
    const inOpponent = s.fieldSide === 'opponent';
    const ballPercent = yardLine ? (inOpponent ? 50 + (50 - yardLine) : yardLine) : 50;

    return (
      <div className="football-info compact">
        <div className="compact-row">
          <div className="down-display">{down ? `${down}${getOrdinalSuffix(down)} & ${distance || '-'}` : '—'}</div>
          <div className="field-display compact-field">
            <div className="field-line compact-line">
              <div className="ball-marker compact-ball" style={{ left: `${(ballPercent / 100) * 100}%` }} />
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

  return (
    <BaseGameTile
      {...props}
      renderAdditionalInfo={renderAdditionalInfo}
    />
  );
};

export default FootballGameTile;