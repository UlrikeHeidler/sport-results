import React, { useEffect, useRef, useState } from 'react';
import BaseGameTile from './BaseGameTile';
import './GameTiles.basketball.css';

const BasketballGameTile = (props) => {
  const { game } = props;

  // Win probability history state
  const [winProbHistory, setWinProbHistory] = useState([]);
  const lastPlayIdRef = useRef(null);

  // Accumulate win probability history as the game progresses
  useEffect(() => {
    const prob = game?.situation?.lastPlay?.probability;
    console.log(game.id, 'BasketballGameTile win probability data:', game?.situation);
    const playId = game?.situation?.lastPlay?.id;
    if (!prob || !playId) return;
    if (lastPlayIdRef.current === playId) return; // Don't add duplicate
    lastPlayIdRef.current = playId;
    setWinProbHistory(prev => [
      ...prev,
      {
        time: game?.situation?.time ?? null,
        home: prob.homeWinPercentage*100 ?? null,
        away: prob.awayWinPercentage*100 ?? null
      }
    ]);
  }, [game?.situation?.lastPlay?.id]);

  // Render SVG win probability graph
  // Render SVG win probability differential graph
  // Render SVG win probability differential graph (full width, x-axis = game time)
  const renderWinProbGraph = () => {
    if (!winProbHistory.length) return null;
    // Responsive width: fill parent
    const width = 420; // fallback, will use 100% style
    const height = 56;
    const pad = 6;
    // Use the already-available time in seconds for x-axis scaling
  const timesSec = winProbHistory.map((d, i) => typeof d.time === 'number' ? d.time : i * 24);
  const minTime = 0; // Always start at 0 (game start)
  const maxTime = Math.max(...timesSec); // Current game time
    // X scale: 0 (left) = minTime, width-pad*2 (right) = maxTime
    const xForTime = (sec) => {
      if (maxTime === minTime) return pad;
      return pad + ((sec - minTime) * (width - 2 * pad)) / (maxTime - minTime);
    };
    const centerY = pad + (height - 2 * pad) / 2;
    // Points for the differential line
    const points = winProbHistory.map((d, i) => {
      const sec = timesSec[i];
      const x = xForTime(sec);
      const diff = ((d.home ?? 50) / 100) - 0.5;
      const y = centerY - diff * (height - 2 * pad);
      return `${x},${y}`;
    }).join(' ');
    // Area for home favored (above center)
    const areaHome = winProbHistory.map((d, i) => {
      const sec = timesSec[i];
      const x = xForTime(sec);
      const diff = ((d.home ?? 50) / 100) - 0.5;
      const y = centerY - Math.max(0, diff) * (height - 2 * pad);
      return `${x},${y}`;
    }).join(' ');
    // Area for away favored (below center)
    const areaAway = winProbHistory.map((d, i) => {
      const sec = timesSec[i];
      const x = xForTime(sec);
      const diff = ((d.home ?? 50) / 100) - 0.5;
      const y = centerY - Math.min(0, diff) * (height - 2 * pad);
      return `${x},${y}`;
    }).join(' ');
    // X-axis ticks: show first, middle, last, format seconds as MM:SS
    // Show tick labels every 3 minutes (180 seconds)
    const formatSeconds = (s) => {
      if (typeof s !== 'number' || isNaN(s)) return '';
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${sec.toString().padStart(2, '0')}`;
    };
    const tickLabels = [];
    const tickInterval = 180; // 3 minutes
    const start = 0;
    const end = maxTime;
    for (let t = start; t <= end; t += tickInterval) {
      tickLabels.push({
        x: xForTime(t),
        label: formatSeconds(t)
      });
    }
    // Always show last tick at end if not already present
    if (tickLabels.length === 0 || tickLabels[tickLabels.length-1].label !== formatSeconds(end)) {
      tickLabels.push({
        x: xForTime(end),
        label: formatSeconds(end)
      });
    }
    return (
      <div className="win-prob-graph" style={{ margin: '0.5rem 0', width: '100%' }}>
        {/* <div style={{ fontSize: '0.8rem', marginBottom: 2 }} title="The x-axis shows game time (clock at each play/event)">Win Probability Differential <span style={{fontSize:'0.7em',color:'#888'}}>(x-axis: game time at each play)</span></div> */}
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: '#f8f9fa', borderRadius: 6, border: '1px solid #eee', width: '100%' }} preserveAspectRatio="none">
          {/* Fill area above center for home favored */}
          <polyline points={areaHome} fill="none" stroke="#667eea" strokeWidth="0" />
          <polygon points={`${areaHome} ${xForTime(timesSec[timesSec.length-1])},${centerY} ${xForTime(timesSec[0])},${centerY}`}
            fill="#e3eafe" opacity="0.6" />
          {/* Fill area below center for away favored */}
          <polyline points={areaAway} fill="none" stroke="#d32f2f" strokeWidth="0" />
          <polygon points={`${areaAway} ${xForTime(timesSec[timesSec.length-1])},${centerY} ${xForTime(timesSec[0])},${centerY}`}
            fill="#ffd6d6" opacity="0.6" />
          {/* Differential line */}
          <polyline points={points} fill="none" stroke="#333" strokeWidth="2" />
          {/* Center axis (50/50) */}
          <line x1={pad} y1={centerY} x2={width-pad} y2={centerY} stroke="#bbb" strokeWidth="1" strokeDasharray="2,2" />
          {/* X-axis ticks/labels */}
          {tickLabels.map((tick, i) => (
            <g key={i}>
              <line x1={tick.x} y1={height-pad} x2={tick.x} y2={height-pad+4} stroke="#bbb" strokeWidth="1" />
              <text x={tick.x} y={height} fontSize="9" textAnchor="middle" fill="#888">{tick.label}</text>
            </g>
          ))}
        </svg>
        {/* <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: 2 }}>
          <span style={{ color: '#667eea' }}>Home Favored</span>
          <span style={{ color: '#d32f2f' }}>Away Favored</span>
        </div> */ }
      </div>
    );
  };

  // Basketball-specific additional info renderer
  const renderAdditionalInfo = () => {
    console.log(game.id, 'Rendering basketball additional info with situation:', game.situation);
    if (!game.situation) return null;
    return (
      <div className="basketball-info">
        {renderWinProbGraph()}
        {/* {game.situation.lastPlay && game.situation.lastPlay?.text && (
          <div className="last-play">
            Last Play: {game.situation.lastPlay?.text}
          </div>
        )} */}
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