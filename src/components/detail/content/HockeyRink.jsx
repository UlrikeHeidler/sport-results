import React, { useMemo, useState, useCallback } from 'react';
import rinkSvg from '../../../../public/bg-rink.svg';
import './HockeyRink.css';

// ESPN hockey coordinates: x = -100..100 (left goal → right goal), y = -42.5..42.5 (top boards → bottom boards)
// SVG viewBox: 0 0 443 200
const RINK_W = 443;
const RINK_H = 200;

function toSvg(x, y) {
  return {
    sx: ((x + 100) / 200) * RINK_W,
    sy: ((y + 42.5) / 85) * RINK_H,
  };
}

const PERIOD_LABEL = p => p === 4 ? 'OT' : p === 5 ? 'SO' : `P${p}`;

function classifyPlay(play) {
  const t = (play.type?.text || '').toLowerCase();
  if (play.scoringPlay || t === 'goal') return 'goal';
  if (t.includes('shot on')) return 'shot';
  if (t.includes('missed')) return 'missed';
  if (t.includes('blocked')) return 'blocked';
  if (t.includes('hit')) return 'hit';
  if (t.includes('penalty')) return 'penalty';
  if (t.includes('faceoff') || t.includes('face-off')) return 'faceoff';
  if (t.includes('giveaway')) return 'giveaway';
  if (t.includes('takeaway')) return 'takeaway';
  return 'other';
}

const MARKER_CFG = {
  goal:     { color: '#1a1a1a', r: 4   },
  shot:     { color: '#3182ce', r: 2.5 },
  missed:   { color: '#90cdf4', r: 2   },
  blocked:  { color: '#718096', r: 2   },
  hit:      { color: '#ed8936', r: 2.5 },
  penalty:  { color: '#d97706', r: 2.5 },
  faceoff:  { color: '#a0aec0', r: 1.5 },
  giveaway: { color: '#805ad5', r: 1.5 },
  takeaway: { color: '#68d391', r: 1.5 },
  other:    { color: '#cbd5e0', r: 1.5 },
};

// Hockey puck viewed from a slight angle — two stacked ellipses with a highlight
function PuckMarker({ sx, sy, alpha, onActivate, onDeactivate }) {
  return (
    <g transform={`translate(${sx},${sy})`} opacity={alpha}
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
      onMouseEnter={onActivate} onMouseLeave={onDeactivate}
      onClick={onActivate}
    >
      <ellipse rx="5" ry="3" fill="#111" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
      <ellipse rx="5" ry="1.8" cy="-1.1" fill="#2d2d2d" />
      <ellipse rx="2.2" ry="0.5" cx="-0.5" cy="-1.5" fill="rgba(255,255,255,0.18)" />
      {/* Invisible larger hit area */}
      <ellipse rx="8" ry="6" fill="transparent" />
    </g>
  );
}

// Referee whistle — oval body + short tube + tiny ball
function WhistleMarker({ sx, sy, alpha, onActivate, onDeactivate }) {
  return (
    <g transform={`translate(${sx},${sy})`} opacity={alpha}
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
      onMouseEnter={onActivate} onMouseLeave={onDeactivate}
      onClick={onActivate}
    >
      <ellipse rx="3.2" ry="2.2" fill="#d97706" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
      <rect x="2.8" y="-0.75" width="2.8" height="1.5" rx="0.6" fill="#b45309" />
      <ellipse cx="5.6" ry="0.75" rx="0.5" fill="#92400e" />
      <circle cy="0.3" r="0.8" fill="rgba(254,215,0,0.55)" />
      <ellipse rx="7" ry="5" fill="transparent" />
    </g>
  );
}

function Marker({ play, alpha, onActivate, onDeactivate }) {
  const c = play.coordinate;
  if (c?.x == null || c?.y == null) return null;

  const { sx, sy } = toSvg(c.x, c.y);
  const kind = classifyPlay(play);

  if (kind === 'goal') return <PuckMarker sx={sx} sy={sy} alpha={alpha} onActivate={onActivate} onDeactivate={onDeactivate} />;
  if (kind === 'penalty') return <WhistleMarker sx={sx} sy={sy} alpha={alpha} onActivate={onActivate} onDeactivate={onDeactivate} />;

  const { color, r } = MARKER_CFG[kind] ?? MARKER_CFG.other;
  return (
    <g opacity={alpha} style={{ cursor: 'pointer', pointerEvents: 'all' }}
      onMouseEnter={onActivate} onMouseLeave={onDeactivate}
      onClick={onActivate}
    >
      <circle cx={sx} cy={sy} r={r} fill={color} stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
      <circle cx={sx} cy={sy} r={Math.max(r + 3, 6)} fill="transparent" />
    </g>
  );
}

// Legend uses inline SVG snippets so the puck/whistle look matches the map
function LegendPuck() {
  return (
    <svg width="14" height="10" viewBox="-7 -5 14 10" style={{ display: 'block', flexShrink: 0 }}>
      <ellipse rx="5" ry="3" fill="#111" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
      <ellipse rx="5" ry="1.8" cy="-1.1" fill="#2d2d2d" />
      <ellipse rx="2.2" ry="0.5" cx="-0.5" cy="-1.5" fill="rgba(255,255,255,0.18)" />
    </svg>
  );
}

function LegendWhistle() {
  return (
    <svg width="18" height="10" viewBox="-4 -4 18 8" style={{ display: 'block', flexShrink: 0 }}>
      <ellipse rx="3.2" ry="2.2" fill="#d97706" />
      <rect x="2.8" y="-0.75" width="2.8" height="1.5" rx="0.6" fill="#b45309" />
      <ellipse cx="5.6" ry="0.75" rx="0.5" fill="#92400e" />
      <circle cy="0.3" r="0.8" fill="rgba(254,215,0,0.55)" />
    </svg>
  );
}

const LEGEND = [
  { kind: 'goal',     label: 'Goal',     custom: <LegendPuck /> },
  { kind: 'shot',     label: 'Shot'    },
  { kind: 'hit',      label: 'Hit'     },
  { kind: 'penalty',  label: 'Penalty',  custom: <LegendWhistle /> },
  { kind: 'giveaway', label: 'Giveaway' },
];

// Resolve the team logo for a play using homeAway, team id, or participant team id
function getPlayTeamLogo(play, game) {
  if (!game) return null;

  const ha = play.team?.homeAway;
  if (ha === 'home') return game.homeTeam?.logo ?? null;
  if (ha === 'away') return game.awayTeam?.logo ?? null;

  // Fallback: match by team id (play.team.id or play.team.teamId)
  const tid = String(play.team?.id ?? play.team?.teamId ?? '');
  if (tid) {
    if (String(game.homeTeam?.id) === tid) return game.homeTeam?.logo ?? null;
    if (String(game.awayTeam?.id) === tid) return game.awayTeam?.logo ?? null;
  }

  // Last resort: check participant's team (used for goalie stops, hits, etc.)
  const ptid = String(play.participants?.[0]?.team?.id ?? play.participants?.[0]?.teamId ?? '');
  if (ptid) {
    if (String(game.homeTeam?.id) === ptid) return game.homeTeam?.logo ?? null;
    if (String(game.awayTeam?.id) === ptid) return game.awayTeam?.logo ?? null;
  }

  return null;
}

// Always renders a slot to keep the grid column intact; shows logo if available
function TeamLogo({ logo, size = 16 }) {
  return (
    <span className="play-team-logo-slot" style={{ width: size, height: size }}>
      {logo && <img src={logo} alt="" className="play-team-logo" style={{ width: size, height: size }} />}
    </span>
  );
}

function RinkTooltip({ tooltip, game }) {
  const { play, pctX, pctY } = tooltip;
  const time = [
    PERIOD_LABEL(play.period?.number ?? 1),
    play.clock?.displayValue,
  ].filter(Boolean).join(' ');
  const logo = getPlayTeamLogo(play, game);

  const flipX = pctX > 0.65;
  const flipY = pctY > 0.6;

  const style = {
    left:   flipX ? 'auto' : `calc(${pctX * 100}% + 8px)`,
    right:  flipX ? `calc(${(1 - pctX) * 100}% + 8px)` : 'auto',
    top:    flipY ? 'auto' : `calc(${pctY * 100}% + 6px)`,
    bottom: flipY ? `calc(${(1 - pctY) * 100}% + 6px)` : 'auto',
  };

  return (
    <div className="rink-tooltip" style={style} onMouseEnter={(e) => e.stopPropagation()}>
      <div className="rink-tooltip-header">
        {logo && <TeamLogo logo={logo} size={18} />}
        {time && <span className="rink-tooltip-time">{time}</span>}
      </div>
      <div className="rink-tooltip-type">{play.type?.text ?? '—'}</div>
      {play.text && <div className="rink-tooltip-desc">{play.text}</div>}
    </div>
  );
}

export function PlayList({ plays, game }) {
  if (!plays?.length) return null;

  const filtered = useMemo(() =>
    [...plays]
      .reverse()
      .filter(p => {
        const t = (p.type?.text || '').toLowerCase();
        return p.text
          && !t.includes('period')
          && !t.includes('game start')
          && !t.includes('game end')
          && !t.includes('end game')
          && !t.includes('end of game')
          && !t.startsWith('end ');
      }),
  [plays]);

  if (!filtered.length) return null;

  return (
    <div className="hockey-plays-wrap">
      <div className="detail-section-title">Play by Play</div>
      <ul className="hockey-plays">
        {filtered.map((play, i) => {
          const kind = classifyPlay(play);
          const { color } = MARKER_CFG[kind] ?? MARKER_CFG.other;
          const logo = getPlayTeamLogo(play, game);
          return (
            <li key={play.id ?? i} className={`hockey-play${play.scoringPlay ? ' is-goal' : ''}`}>
              <span className="hockey-play-dot" style={{ background: color }} />
              <span className="hockey-play-time">
                {PERIOD_LABEL(play.period?.number ?? 1)}
                {play.clock?.displayValue ? ` ${play.clock.displayValue}` : ''}
              </span>
              <TeamLogo logo={logo} size={14} />
              <span className="hockey-play-body">
                <span className="hockey-play-type">{play.type?.text ?? '—'}</span>
                {play.text && <span className="hockey-play-desc">{play.text}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { classifyPlay, MARKER_CFG, PERIOD_LABEL, getPlayTeamLogo, TeamLogo };


export function HockeyRink({ plays = [], isLive, game }) {
  const [tooltip, setTooltip] = useState(null);

  const markers = useMemo(() => {
    const withCoord = plays.filter(p => p.coordinate?.x != null);
    if (isLive) return withCoord.slice(-10);
    return withCoord.filter(p => p.scoringPlay);
  }, [plays, isLive]);

  const handleActivate = useCallback((play) => {
    const { sx, sy } = toSvg(play.coordinate.x, play.coordinate.y);
    setTooltip({ play, pctX: sx / RINK_W, pctY: sy / RINK_H });
  }, []);

  const handleDeactivate = useCallback(() => setTooltip(null), []);

  return (
    <div className="hockey-rink-wrap">
      <div className="detail-section-title">
        {isLive ? 'Last 10 Events' : 'Goal Positions'}
      </div>
      <div className="hockey-rink-container" onMouseLeave={handleDeactivate}>
        <img src={rinkSvg} alt="Hockey rink" className="hockey-rink-bg" />
        {markers.length > 0 && (
          <svg className="hockey-rink-overlay" viewBox="0 0 443 200" style={{ pointerEvents: 'none' }}>
            <rect width="443" height="200" fill="transparent" style={{ pointerEvents: 'none' }} />
            {markers.map((play, i) => (
              <Marker
                key={play.id ?? i}
                play={play}
                alpha={isLive ? 0.45 + (i / markers.length) * 0.55 : 1}
                onActivate={() => handleActivate(play)}
                onDeactivate={handleDeactivate}
              />
            ))}
          </svg>
        )}
        {markers.length === 0 && (
          <div className="hockey-rink-empty">No position data available</div>
        )}
        {tooltip && <RinkTooltip tooltip={tooltip} game={game} />}
      </div>
      <div className="hockey-rink-legend">
        {LEGEND.map(({ kind, label, custom }) => (
          <span key={kind} className="rink-legend-item">
            {custom
              ? custom
              : <span className="rink-legend-dot" style={{ background: MARKER_CFG[kind].color }} />
            }
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

