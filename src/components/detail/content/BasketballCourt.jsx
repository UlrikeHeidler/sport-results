import React, { useMemo, useState, useCallback } from 'react';
import courtSvg from '../../../../public/basketball-court.svg';
import './BasketballCourt.css';

// ESPN NBA full-court coordinates:
// x = 0..50  (court width, sideline to sideline, feet)
// y = 0..94  (court length, left baseline → right baseline, feet)
// SVG viewBox: 0 0 940 500  (landscape: width=length, height=width)
// Sentinel for free-throw / unknown positions
const COURT_W = 940;
const COURT_H = 500;
const SENTINEL = -214748340;

const isValidCoord = (c) =>
  c?.x != null && c.x !== SENTINEL && c.y !== SENTINEL;

function toSvg(x, y) {
  return {
    sx: (y / 94) * COURT_W,
    sy: (x / 50) * COURT_H,
  };
}

// Normalize a shot onto a designated half of the court.
// Away team → left half (y stays ≤ 47); home team → right half (y stays ≥ 47).
// When a team shot from the other half (halftime switch), mirror across mid-court.
function normalizeToSide(rawX, rawY, side) {
  // side === 'left':  away team, should have y in 0..47
  // side === 'right': home team, should have y in 47..94
  if (side === 'left'  && rawY > 47) return toSvg(rawX, 94 - rawY);
  if (side === 'right' && rawY < 47) return toSvg(rawX, 94 - rawY);
  return toSvg(rawX, rawY);
}

function getSide(play, game) {
  if (!game) return null;
  const tid = String(play.team?.id ?? '');
  if (String(game.homeTeam?.id) === tid) return 'right';
  if (String(game.awayTeam?.id) === tid) return 'left';
  return null;
}

export const PERIOD_LABEL = (p) =>
  p > 4 ? (p === 5 ? 'OT' : `OT${p - 4}`) : `Q${p}`;

export function classifyPlay(play) {
  const t = (play.type?.text || '').toLowerCase();
  if (play.scoringPlay && play.scoreValue > 0) {
    if (t.includes('free throw')) return 'freethrow';
    if (play.scoreValue === 3 || t.includes('three') || t.includes('3-point')) return 'three';
    return 'two';
  }
  if (play.shootingPlay) return 'missed';
  if (t.includes('rebound')) return 'rebound';
  if (t.includes('foul')) return 'foul';
  if (t.includes('timeout')) return 'timeout';
  if (t.includes('turnover') || t.includes('steal')) return 'turnover';
  if (t.includes('substitution') || t === 'sub') return 'sub';
  return 'other';
}

const PLAY_COLORS = {
  freethrow: '#68d391',
  three:     '#f6ad55',
  two:       '#63b3ed',
  missed:    '#718096',
  rebound:   '#76e4f7',
  foul:      '#fc8181',
  timeout:   '#b794f4',
  turnover:  '#fc8181',
  sub:       '#cbd5e0',
  other:     '#cbd5e0',
};

export function getPlayTeamLogo(play, game) {
  if (!game) return null;
  const tid = String(play.team?.id ?? '');
  if (tid) {
    if (String(game.homeTeam?.id) === tid) return game.homeTeam?.logo ?? null;
    if (String(game.awayTeam?.id) === tid) return game.awayTeam?.logo ?? null;
  }
  return null;
}

export function TeamLogo({ logo, size = 16 }) {
  return (
    <span className="bball-play-logo-slot" style={{ width: size, height: size }}>
      {logo && <img src={logo} alt="" className="bball-play-logo" style={{ width: size, height: size }} />}
    </span>
  );
}

// ── Shot markers ──────────────────────────────────────────────────────────────

function LogoMarker({ sx, sy, logo, opacity, r = 9, onActivate, onDeactivate }) {
  const clipId = `bbc-${Math.round(sx * 10)}-${Math.round(sy * 10)}`;
  return (
    <g
      transform={`translate(${sx},${sy})`}
      opacity={opacity}
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onClick={onActivate}
    >
      <defs>
        <clipPath id={clipId}>
          <circle r={r} />
        </clipPath>
      </defs>
      <circle r={r} fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
      {logo
        ? <image href={logo} x={-r} y={-r} width={r * 2} height={r * 2}
            clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid meet" />
        : <circle r={r * 0.6} fill="#3182ce" />
      }
      <circle r={r + 4} fill="transparent" />
    </g>
  );
}

function MissedMarker({ sx, sy, opacity, onActivate, onDeactivate }) {
  const s = 5;
  return (
    <g
      transform={`translate(${sx},${sy})`}
      opacity={opacity}
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onClick={onActivate}
    >
      <line x1={-s} y1={-s} x2={s} y2={s} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      <line x1={s} y1={-s} x2={-s} y2={s} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      <circle r={9} fill="transparent" />
    </g>
  );
}

function CourtTooltip({ tooltip, game }) {
  const { play, pctX, pctY } = tooltip;
  const time = [PERIOD_LABEL(play.period?.number ?? 1), play.clock?.displayValue].filter(Boolean).join(' ');
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
    <div className="court-tooltip" style={style}>
      <div className="court-tooltip-header">
        {logo && <img src={logo} className="court-tooltip-logo" alt="" />}
        {time && <span className="court-tooltip-time">{time}</span>}
      </div>
      <div className="court-tooltip-type">{play.type?.text ?? '—'}</div>
      {play.text && <div className="court-tooltip-desc">{play.text}</div>}
    </div>
  );
}

export function BasketballCourt({ plays = [], isLive, game }) {
  const [tooltip, setTooltip] = useState(null);

  // Pre-compute normalised SVG coordinates for every shot.
  // Away team → left half (svg x 0..470), home team → right half (svg x 470..940).
  // Shots taken from the "wrong" half (halftime switch) are mirrored across mid-court.
  const markers = useMemo(() => {
    const shots = plays.filter(p => p.shootingPlay && isValidCoord(p.coordinate));
    const display = isLive ? shots.slice(-10) : shots;
    const n = display.length;
    return display.map((play, idx) => {
      const { x: rx, y: ry } = play.coordinate;
      const side = getSide(play, game);
      const { sx, sy } = side ? normalizeToSide(rx, ry, side) : toSvg(rx, ry);
      return {
        play, sx, sy,
        made: play.scoringPlay && play.scoreValue > 0,
        alpha: isLive
          ? 0.35 + (idx / Math.max(n - 1, 1)) * 0.65
          : (play.scoringPlay ? 1 : 0.7),
      };
    });
  }, [plays, isLive, game]);

  const handleActivate = useCallback((sx, sy, play) => {
    setTooltip({ play, pctX: sx / COURT_W, pctY: sy / COURT_H });
  }, []);
  const handleDeactivate = useCallback(() => setTooltip(null), []);

  const madeCount  = markers.filter(m => m.made).length;
  const totalCount = markers.length;

  const awayAbbr = game?.awayTeam?.abbreviation ?? 'Away';
  const homeAbbr = game?.homeTeam?.abbreviation ?? 'Home';

  return (
    <div className="bball-court-wrap">
      <div className="detail-section-title">
        {isLive ? 'Last 10 Shots' : 'Shot Chart'}
        {!isLive && totalCount > 0 && (
          <span className="bball-court-count">
            {madeCount}/{totalCount} FG ({Math.round((madeCount / totalCount) * 100)}%)
          </span>
        )}
      </div>
      <div className="bball-court-container" onMouseLeave={handleDeactivate}>
        <img src={courtSvg} alt="Basketball court" className="bball-court-bg" />
        <svg
          className="bball-court-overlay"
          viewBox={`0 0 ${COURT_W} ${COURT_H}`}
          style={{ pointerEvents: 'none' }}
        >
          <rect width={COURT_W} height={COURT_H} fill="transparent" style={{ pointerEvents: 'none' }} />

          {/* Team labels at each baseline */}
          <text
            x={30} y={COURT_H / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
            fontWeight="700"
            fill="rgba(0,0,0,0.18)"
            transform={`rotate(-90, 30, ${COURT_H / 2})`}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {awayAbbr}
          </text>
          <text
            x={COURT_W - 30} y={COURT_H / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
            fontWeight="700"
            fill="rgba(0,0,0,0.18)"
            transform={`rotate(90, ${COURT_W - 30}, ${COURT_H / 2})`}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {homeAbbr}
          </text>

          {/* Missed shots underneath so logos appear on top */}
          {markers.filter(m => !m.made).map(({ play, sx, sy, alpha }, i) => (
            <MissedMarker
              key={play.id ?? `miss-${i}`}
              sx={sx} sy={sy} opacity={alpha}
              onActivate={() => handleActivate(sx, sy, play)}
              onDeactivate={handleDeactivate}
            />
          ))}
          {/* Made shots (logos) on top */}
          {markers.filter(m => m.made).map(({ play, sx, sy, alpha }, i) => {
            const logo = getPlayTeamLogo(play, game);
            return (
              <LogoMarker
                key={play.id ?? `made-${i}`}
                sx={sx} sy={sy} logo={logo} opacity={alpha}
                onActivate={() => handleActivate(sx, sy, play)}
                onDeactivate={handleDeactivate}
              />
            );
          })}
        </svg>
        {totalCount === 0 && (
          <div className="bball-court-empty">No shot data available</div>
        )}
        {tooltip && <CourtTooltip tooltip={tooltip} game={game} />}
      </div>
      <div className="bball-court-legend">
        <span className="bball-legend-item bball-legend-team">{awayAbbr} ← left</span>
        <span className="bball-legend-item">
          <svg width="16" height="16" viewBox="-8 -8 16 16">
            <circle r="7" fill="white" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
            <circle r="4" fill="#3182ce" />
          </svg>
          Made
        </span>
        <span className="bball-legend-item">
          <svg width="16" height="16" viewBox="-8 -8 16 16">
            <line x1="-5" y1="-5" x2="5" y2="5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
            <line x1="5" y1="-5" x2="-5" y2="5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Missed
        </span>
        <span className="bball-legend-item bball-legend-team">right → {homeAbbr}</span>
      </div>
    </div>
  );
}

// ── Play-by-play list ─────────────────────────────────────────────────────────

const SKIP_TYPES = new Set([
  'end of period', 'start of period', 'end period', 'start period',
  'period start', 'period end', 'end of game', 'start of game',
  'game start', 'game end', 'end game', 'official timeout',
]);

function shouldSkip(play) {
  const t = (play.type?.text || '').toLowerCase();
  if (SKIP_TYPES.has(t)) return true;
  if (t.startsWith('end ') && !play.text) return true;
  return false;
}

export function PlayList({ plays, game }) {
  if (!plays?.length) return null;

  const filtered = useMemo(() =>
    [...plays].reverse().filter(p => p.text && !shouldSkip(p)),
  [plays]);

  if (!filtered.length) return null;

  return (
    <ul className="bball-plays">
      {filtered.map((play, i) => {
        const kind = classifyPlay(play);
        const color = PLAY_COLORS[kind] ?? PLAY_COLORS.other;
        const logo = getPlayTeamLogo(play, game);
        const isScoring = play.scoringPlay && play.scoreValue > 0;
        return (
          <li key={play.id ?? i} className={`bball-play${isScoring ? ' is-score' : ''}`}>
            <span className="bball-play-dot" style={{ background: color }} />
            <span className="bball-play-time">
              {PERIOD_LABEL(play.period?.number ?? 1)}
              {play.clock?.displayValue ? ` ${play.clock.displayValue}` : ''}
            </span>
            <TeamLogo logo={logo} size={14} />
            <span className="bball-play-body">
              <span className="bball-play-type">{play.type?.text ?? '—'}</span>
              {play.text && <span className="bball-play-desc">{play.text}</span>}
            </span>
            {isScoring && (
              <span className="bball-play-score">{play.awayScore}–{play.homeScore}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ScoringList({ plays, game }) {
  if (!plays?.length) return null;

  const scoring = useMemo(() =>
    [...plays].reverse().filter(p => p.scoringPlay && p.scoreValue > 0),
  [plays]);

  if (!scoring.length) return <div className="bball-empty-tab">No scoring plays recorded yet.</div>;

  return (
    <ul className="bball-plays">
      {scoring.map((play, i) => {
        const kind = classifyPlay(play);
        const color = PLAY_COLORS[kind] ?? PLAY_COLORS.two;
        const logo = getPlayTeamLogo(play, game);
        const time = [PERIOD_LABEL(play.period?.number ?? 1), play.clock?.displayValue].filter(Boolean).join(' ');
        return (
          <li key={play.id ?? i} className="bball-play is-score">
            <span className="bball-play-dot" style={{ background: color }} />
            <span className="bball-play-time">{time}</span>
            <TeamLogo logo={logo} size={14} />
            <span className="bball-play-body">
              <span className="bball-play-type">{play.type?.text ?? '—'}</span>
              {play.text && <span className="bball-play-desc">{play.text}</span>}
            </span>
            <span className="bball-play-score">{play.awayScore}–{play.homeScore}</span>
          </li>
        );
      })}
    </ul>
  );
}

export { PLAY_COLORS };
