import React, { useState } from 'react';
import './DetailContent.css';

/* Helpers */
const statVal = (stats, name) =>
  stats?.find(s => s.name === name)?.displayValue ?? '—';

const statLabel = (stats, name) =>
  stats?.find(s => s.name === name)?.label ?? '—';

function LineScore({ scoring, teams }) {
  if (!scoring?.length) return null;

  const periods = scoring.map(s => s.period?.number).filter(Boolean);
  const maxPeriod = Math.max(...periods, 4);
  const cols = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  // ESPN scoring gives cumulative scores; calculate per-period deltas
  const homeByPeriod = {};
  const awayByPeriod = {};
  let prevHome = 0, prevAway = 0;
  [...scoring].sort((a, b) => (a.period?.number ?? 0) - (b.period?.number ?? 0)).forEach(s => {
    const p = s.period?.number;
    if (!p) return;
    homeByPeriod[p] = (s.homeScore ?? 0) - prevHome;
    awayByPeriod[p] = (s.awayScore ?? 0) - prevAway;
    prevHome = s.homeScore ?? prevHome;
    prevAway = s.awayScore ?? prevAway;
  });

  const lastScore = scoring.at(-1) ?? {};
  const away = teams?.find(t => t.homeAway === 'away')?.team;
  const home = teams?.find(t => t.homeAway === 'home')?.team;

  return (
    <div className="linescore-wrap">
      <table className="linescore">
        <thead>
          <tr>
            <th></th>
            {cols.map(p => <th key={p}>{p > 4 ? 'OT' : `Q${p}`}</th>)}
            <th className="total-col">T</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{away?.abbreviation ?? 'AWY'}</td>
            {cols.map(p => <td key={p}>{awayByPeriod[p] ?? '—'}</td>)}
            <td className="total-col">{lastScore.awayScore ?? '—'}</td>
          </tr>
          <tr>
            <td>{home?.abbreviation ?? 'HME'}</td>
            {cols.map(p => <td key={p}>{homeByPeriod[p] ?? '—'}</td>)}
            <td className="total-col">{lastScore.homeScore ?? '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ScoringPlays({ plays }) {
  if (!plays?.length) return <div className="detail-empty">No scoring plays yet</div>;
  return (
    <ul className="score-plays">
      {plays.map((play, i) => (
        <li key={i} className="score-play">
          <span className="score-play-badge">
            {play.period?.number > 4 ? 'OT' : `Q${play.period?.number ?? '?'}`}
          </span>
          <span className="score-play-text">{play.text ?? play.type?.text ?? '—'}</span>
          <span className="score-play-score">
            {play.awayScore ?? play.score?.awayScore ?? ''}–{play.homeScore ?? play.score?.homeScore ?? ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ── Drive helpers ──────────────────────────────────────── */
function driveResultMeta(result = '') {
  const r = result.toUpperCase();
  if (r.includes('TD') || r === 'TOUCHDOWN')                               return { cls: 'drive-result--td',       label: result || 'TD' };
  if (r.includes('FG') || r === 'FIELD GOAL')                              return { cls: 'drive-result--fg',       label: result || 'FG' };
  if (r === 'INT' || r === 'INTERCEPTION' || r.includes('FUMBLE'))         return { cls: 'drive-result--turnover', label: result || 'TO' };
  if (r === 'SAFETY')                                                       return { cls: 'drive-result--safety',   label: result || 'Safety' };
  return { cls: 'drive-result--other', label: result || '—' };
}

function DriveRow({ drive, teamInfo }) {
  const [open, setOpen] = useState(false);
  const plays   = drive.plays ?? [];
  const logo    = teamInfo?.logo;
  const abbr    = teamInfo?.abbreviation ?? drive.team?.abbreviation ?? '?';
  const color   = teamInfo?.color ? `#${teamInfo.color}` : null;
  const period  = drive.start?.period?.number ?? drive.quarter?.number;
  const periodLabel = period > 4 ? 'OT' : period ? `Q${period}` : '';
  const startText   = drive.start?.text ?? '';
  const yards   = drive.yards ?? drive.yardGained ?? 0;
  const numPlays = drive.offensivePlays ?? plays.length;
  const result  = drive.shortDisplayResult ?? drive.result ?? drive.displayResult ?? '';
  const { cls: resCls, label: resLabel } = driveResultMeta(result);
  const isScoring = resCls === 'drive-result--td' || resCls === 'drive-result--fg' || resCls === 'drive-result--safety';

  return (
    <div className={`drive-row${isScoring ? ' drive-row--scoring' : ''}`}>
      {color && <span className="drive-accent" style={{ background: color }} />}
      <button
        className="drive-header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="drive-team-logo">
          {logo
            ? <img src={logo} alt={abbr} className="drive-logo-img" />
            : <span className="drive-logo-abbr">{abbr}</span>}
        </span>
        <span className="drive-period">{periodLabel}</span>
        <span className="drive-start">{startText}</span>
        <span className="drive-stats">
          <span className="drive-stat-num">{numPlays} pl · {yards} yds</span>
          <span className={`drive-result ${resCls}`}>{resLabel}</span>
        </span>
        <span className="drive-chevron" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && plays.length > 0 && (
        <ul className="drive-plays-list">
          {plays.map((play, i) => {
            const down = play.start?.down;
            const dist = play.start?.distance;
            const yds  = play.statYardage ?? play.yards ?? null;
            return (
              <li key={play.id ?? i} className={`drive-play${play.scoringPlay ? ' drive-play--scoring' : ''}`}>
                {down != null && dist != null
                  ? <span className="drive-play-down">{down}&amp;{dist}</span>
                  : <span className="drive-play-down" />}
                <span className="drive-play-text">{play.text ?? play.type?.text ?? '—'}</span>
                {yds != null && (
                  <span className={`drive-play-yards${yds > 0 ? ' drive-play-yards--pos' : yds < 0 ? ' drive-play-yards--neg' : ''}`}>
                    {yds > 0 ? `+${yds}` : yds}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Current Drive Field Visualization ─────────────────── */

// Parse "DET 14" / "Own 22" / "50" → absolute 0-100 field position (0=own EZ)
function parseStartPos(drive) {
  const text = (drive.start?.text ?? '').trim();
  const abbr = (drive.team?.abbreviation ?? '').toUpperCase();
  const m = text.match(/^([A-Za-z]+)\s+(\d+)$/);
  if (m) {
    const side = m[1].toUpperCase();
    const yard = parseInt(m[2]);
    return side === abbr ? yard : 100 - yard;
  }
  const nm = text.match(/(\d+)/);
  return nm ? Math.min(parseInt(nm[1]), 100) : 20;
}

function classifyDrivePlay(play) {
  const t = ((play.type?.text ?? '') + ' ' + (play.text ?? '')).toLowerCase();
  if (/penalty|flag|illegal|false start|holding|offside/i.test(t)) return 'penalty';
  if (/kickoff|kick off/i.test(t)) return 'kickoff';
  if (/punt/i.test(t)) return 'kick';
  if (/field goal/i.test(t)) return 'fg';
  if (/sack/i.test(t)) return 'rush'; // sack = negative rush, drawn as red arrow
  if (/pass|spike|incomplete/i.test(t)) return 'pass';
  return 'rush';
}

function FieldDriveVisual({ drive, teamLookup }) {
  // All plays share a single horizontal strip (80px total height).
  // Past plays → thin colored line. Current/last play → detailed graphic.
  const EZ = 10, W = 120, H = 90, MID = H / 2;
  const DRAW = 0.45;
  const toX = p => EZ + Math.max(0, Math.min(100, p));

  const startPos = parseStartPos(drive);
  const plays = drive.plays ?? [];

  let curPos = startPos;
  const segments = plays.map((play, idx) => {
    const sp = curPos;
    const yards = play.statYardage ?? 0;
    const ep = Math.max(0, Math.min(100, sp + yards));
    curPos = ep;
    return { play, type: classifyDrivePlay(play), sp, ep, idx };
  });

  const driveTeam = teamLookup?.[drive.team?.id];
  const oppTeam   = Object.values(teamLookup ?? {}).find(t => t.id !== drive.team?.id);
  const dColor    = driveTeam?.color ? `#${driveTeam.color}` : '#1e3a8a';
  const oColor    = oppTeam?.color   ? `#${oppTeam.color}`   : '#7f1d1d';
  const logoSz    = Math.min(8, EZ - 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="drive-field-svg" aria-hidden="true">
      <defs>
        <marker id="dfm-g"    markerWidth="3" markerHeight="3" refX="3" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3 Z" fill="rgba(255,255,255,0.85)"/></marker>
        <marker id="dfm-r"    markerWidth="3" markerHeight="3" refX="3" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3 Z" fill="#f87171"/></marker>
        <marker id="dfm-pass" markerWidth="3" markerHeight="3" refX="3" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3 Z" fill="#fbbf24"/></marker>
        <marker id="dfm-kick" markerWidth="3" markerHeight="3" refX="3" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3 Z" fill="#93c5fd"/></marker>
      </defs>

      {/* End zones */}
      <rect x={0}       y={0} width={EZ}  height={H} fill={dColor} opacity="0.65" />
      <rect x={EZ+100}  y={0} width={EZ}  height={H} fill={oColor} opacity="0.65" />
      {driveTeam?.logo
        ? <image href={driveTeam.logo} x={(EZ-logoSz)/2} y={(H-logoSz)/2} width={logoSz} height={logoSz} preserveAspectRatio="xMidYMid meet" opacity="0.9" />
        : <text x={5} y={H/2+1} textAnchor="middle" fontSize="2.5" fill="rgba(255,255,255,0.5)" fontWeight="700" transform={`rotate(-90 5 ${H/2})`}>{driveTeam?.abbreviation ?? ''}</text>}
      {oppTeam?.logo
        ? <image href={oppTeam.logo} x={EZ+100+(EZ-logoSz)/2} y={(H-logoSz)/2} width={logoSz} height={logoSz} preserveAspectRatio="xMidYMid meet" opacity="0.9" />
        : <text x={EZ+105} y={H/2+1} textAnchor="middle" fontSize="2.5" fill="rgba(255,255,255,0.5)" fontWeight="700" transform={`rotate(90 ${EZ+105} ${H/2})`}>{oppTeam?.abbreviation ?? ''}</text>}

      {/* Field */}
      <rect x={EZ} y={0} width={100} height={H} fill="#166534" />

      {/* Yard lines */}
      {[10,20,30,40,50,60,70,80,90].map(y => (
        <line key={y} x1={EZ+y} y1={0} x2={EZ+y} y2={H}
          stroke="white" strokeWidth={y===50 ? 0.6 : 0.25}
          opacity={y===50 ? 0.5 : 0.25} />
      ))}

      {/* Yard numbers */}
      {[10,20,30,40,50].map(y => (
        <React.Fragment key={y}>
          <text x={EZ+y} y={6} textAnchor="middle" fontSize="2.8" fill="rgba(255,255,255,0.3)" fontWeight="600">{y}</text>
          {y !== 50 && <text x={EZ+100-y} y={6} textAnchor="middle" fontSize="2.8" fill="rgba(255,255,255,0.3)" fontWeight="600">{y}</text>}
        </React.Fragment>
      ))}

      {/* Drive start marker */}
      <line x1={toX(startPos)} y1={0} x2={toX(startPos)} y2={H}
        stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="2,1.5" />

      {/* ── Past plays — thin lines with purple separators ── */}
      {segments.slice(0, -1).map(({ sp, ep, idx }) => {
        const x1 = toX(sp), x2 = toX(ep);
        const gain = ep >= sp;
        return (
          <g key={`past-${idx}`}>
            <line x1={x1} y1={MID - 1.5} x2={x1} y2={MID + 1.5} stroke="#7c3aed" strokeWidth="0.8" />
            <line x1={x1} y1={MID} x2={x2} y2={MID}
              stroke={gain ? 'rgba(255,255,255,0.8)' : '#ef4444'} strokeWidth="2.5" />
          </g>
        );
      })}

      {/* ── Current / last play — detailed graphic ── */}
      {segments.length > 0 && (() => {
        const { play, type, sp, ep } = segments[segments.length - 1];
        const x1 = toX(sp), x2 = toX(ep);
        const gain = ep >= sp;
        const drawAnim = `df-draw ${DRAW}s ease-out both`;

        // Start separator
        const separator = <line x1={x1} y1={MID - 1.5} x2={x1} y2={MID + 1.5} stroke="#7c3aed" strokeWidth="0.8" />;

        if (type === 'penalty') {
          return (
            <g>
              {separator}
              <line x1={x1} y1={MID - 14} x2={x1} y2={MID + 14}
                stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,1.5"
                style={{ opacity: 0, animation: 'df-fade .2s ease-out both' }} />
              <text x={x1} y={MID - 16} textAnchor="middle" fontSize="4" fill="#ef4444"
                style={{ opacity: 0, animation: 'df-fade .2s .1s both' }}>PEN</text>
            </g>
          );
        }

        if (type === 'pass') {
          const dist = Math.abs(x2 - x1);
          if (dist < 0.5) {
            // Incomplete — dashed arc forward + X at landing spot
            const reach = 12;
            const mx = x1 + reach / 2, peakY = MID - 12;
            const lx = x1 + reach;
            return (
              <g>
                {separator}
                <path d={`M${x1},${MID} Q${mx},${peakY} ${lx},${MID}`}
                  fill="none" stroke="rgba(200,200,200,0.7)" strokeWidth="1.2" strokeDasharray="2,1.5"
                  style={{ strokeDashoffset: 200, animation: drawAnim }} />
                <line x1={lx-2} y1={MID-2} x2={lx+2} y2={MID+2} stroke="rgba(200,200,200,0.9)" strokeWidth="1.2"
                  style={{ opacity: 0, animation: `df-fade .1s ${DRAW}s both` }} />
                <line x1={lx+2} y1={MID-2} x2={lx-2} y2={MID+2} stroke="rgba(200,200,200,0.9)" strokeWidth="1.2"
                  style={{ opacity: 0, animation: `df-fade .1s ${DRAW}s both` }} />
              </g>
            );
          }
          // Complete pass — arc with arrow
          const mx = (x1+x2)/2;
          const peakY = MID - Math.max(10, dist * 0.32);
          return (
            <g>
              {separator}
              <path d={`M${x1},${MID} Q${mx},${peakY} ${x2},${MID}`}
                fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#dfm-pass)"
                style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: drawAnim }} />
            </g>
          );
        }

        if (type === 'kick' || type === 'kickoff' || type === 'fg') {
          const touchback = /touchback/i.test(play.text ?? '');
          const kx1 = type === 'kickoff' ? toX(65) : x1;
          const kx2 = touchback ? (type === 'kickoff' ? EZ/2 : EZ+100+EZ/2) : x2;
          const mx = (kx1+kx2)/2;
          const dist = Math.abs(kx2-kx1);
          const peakY = MID - Math.max(14, dist * 0.5);
          return (
            <g>
              {separator}
              <path d={`M${kx1},${MID} Q${mx},${peakY} ${kx2},${MID}`}
                fill="none" stroke="#93c5fd" strokeWidth="1.5"
                strokeDasharray={touchback ? '2,1.5' : undefined}
                markerEnd={touchback ? undefined : 'url(#dfm-kick)'}
                style={{ strokeDashoffset: 300, animation: `df-draw ${(DRAW*1.4).toFixed(2)}s ease-in-out both` }} />
            </g>
          );
        }

        // Rush (default) — straight arrow
        const col = gain ? 'rgba(255,255,255,0.9)' : '#f87171';
        const markerId = gain ? 'url(#dfm-g)' : 'url(#dfm-r)';
        if (Math.abs(x2-x1) < 0.5) {
          return (
            <g>
              {separator}
              <circle cx={x1} cy={MID} r="2" fill={col}
                style={{ opacity: 0, animation: 'df-fade .1s both' }} />
            </g>
          );
        }
        return (
          <g>
            {separator}
            <line x1={x1} y1={MID} x2={gain ? x2-1.5 : x2+1.5} y2={MID}
              stroke={col} strokeWidth="2" markerEnd={markerId}
              style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: drawAnim }} />
          </g>
        );
      })()}
    </svg>
  );
}

function CurrentDriveVisual({ data, teams }) {
  const drive = data?.drives?.current ?? null;
  if (!drive?.plays?.length) return null;

  const teamLookup = {};
  teams?.forEach(t => { if (t.team?.id) teamLookup[t.team.id] = t.team; });

  const teamInfo = teamLookup[drive.team?.id];
  const logo     = teamInfo?.logo;
  const abbr     = teamInfo?.abbreviation ?? drive.team?.abbreviation ?? '';
  const result   = drive.shortDisplayResult ?? drive.displayResult ?? null;
  const numPlays = drive.offensivePlays ?? drive.plays?.length ?? 0;
  const yards    = drive.yards ?? 0;

  return (
    <div className="current-drive">
      <div className="current-drive-hdr">
        {logo
          ? <img src={logo} alt={abbr} className="current-drive-logo" />
          : <span className="current-drive-abbr">{abbr}</span>}
        <div className="current-drive-meta">
          <span className="current-drive-label">Drive in Progress</span>
          <span className="current-drive-stats">
            {numPlays} plays · {yards} yds{result ? ` · ${result}` : ''}
          </span>
        </div>
      </div>
      <FieldDriveVisual drive={drive} teamLookup={teamLookup} />
      <div className="drive-legend">
        <span className="drive-legend-item"><span className="dl dl-rush" />Rush</span>
        <span className="drive-legend-item"><span className="dl dl-sack" />Sack</span>
        <span className="drive-legend-item"><span className="dl dl-pass" />Pass</span>
        <span className="drive-legend-item"><span className="dl dl-incomplete" />Incomplete</span>
        <span className="drive-legend-item"><span className="dl dl-kick" />Kick/Punt</span>
        <span className="drive-legend-item"><span className="dl dl-penalty" />Penalty</span>
      </div>
      {(() => {
        const lastPlay = drive.plays?.[drive.plays.length - 1];
        return lastPlay?.text
          ? <div className="drive-last-play">{lastPlay.text}</div>
          : null;
      })()}
    </div>
  );
}

function DrivesList({ drives, teams }) {
  const all = [
    ...(drives?.previous ?? []),
    ...(drives?.current ? [drives.current] : []),
  ];
  if (!all.length) return <div className="detail-empty">No drive data available</div>;

  // Build logo/color lookup from boxscore teams (drives API doesn't include logos)
  const teamById = {};
  teams?.forEach(t => { if (t.team?.id) teamById[t.team.id] = t.team; });

  return (
    <div className="drives-list">
      {[...all].reverse().map((drive, i) => (
        <DriveRow
          key={drive.id ?? i}
          drive={drive}
          teamInfo={teamById[drive.team?.id] ?? null}
        />
      ))}
    </div>
  );
}

function TeamStats({ teams }) {
  if (!teams?.length) return null;

  const away = teams.find(t => t.homeAway === 'away');
  const home = teams.find(t => t.homeAway === 'home');
  if (!away || !home) return null;

  const statKeys = [
    { name: 'totalYards', label: 'Total Yards' },
    { name: 'netPassingYards', label: 'Pass Yds' },
    { name: 'rushingYards', label: 'Rush Yds' },
    { name: 'turnovers', label: 'Turnovers' },
  ];

  const rows = statKeys.map(({ name, label }) => {
    const a = parseFloat(statVal(away.statistics, name)) || 0;
    const h = parseFloat(statVal(home.statistics, name)) || 0;
    const labelText = statLabel(away.statistics, name) || statLabel(home.statistics, name) || label;
    const total = a + h || 1;
    return { label: labelText, a, h, aPct: (a / total) * 100, hPct: (h / total) * 100,
             aStr: statVal(away.statistics, name), hStr: statVal(home.statistics, name) };
  });

  return (
    <>
      <div className="detail-section-title">Team Stats</div>
      <div className="team-stats">
        <div className="stat-row">
          <span className="stat-row-away">{away.team?.abbreviation}</span>
          <span className="stat-row-label"></span>
          <span className="stat-row-home">{home.team?.abbreviation}</span>
        </div>
        {rows.map(r => (
          <React.Fragment key={r.label}>
            <div className="stat-row">
              <span className="stat-row-away">{r.aStr}</span>
              <span className="stat-row-label">{r.label}</span>
              <span className="stat-row-home">{r.hStr}</span>
            </div>
            <div className="stat-bar-wrap">
              <div className="stat-bar-away" style={{ width: `${r.aPct}%` }} />
              <div className="stat-bar-home" style={{ width: `${r.hPct}%` }} />
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

// Groups to show and the stat label whitelist (ESPN labels, order-sensitive)
const PS_GROUPS = [
  { key: 'passing',   label: 'Passing',   keep: ['C/ATT','YDS','TD','INT','RTG'] },
  { key: 'rushing',   label: 'Rushing',   keep: ['CAR','YDS','AVG','TD','LONG'] },
  { key: 'receiving', label: 'Receiving', keep: ['REC','YDS','AVG','TD','LONG'] },
  { key: 'defensive', label: 'Defense',   keep: ['TOT','SACKS','TFL','PD','INT'] },
];

function PlayerTeamCol({ group }) {
  if (!group?.athletes?.length) return <div className="ps-col" />;

  // Filter columns to the whitelist; record which indices to show
  const allLabels = group.labels ?? [];
  const keep = PS_GROUPS.find(g => g.key === group.name)?.keep ?? allLabels;
  const colIdx = keep
    .map(lbl => allLabels.indexOf(lbl))
    .filter(i => i !== -1);
  const shownLabels = colIdx.map(i => allLabels[i]);

  return (
    <div className="ps-col">
      <div className="ps-col-hdr">
        <span className="ps-pname" />
        {shownLabels.map((lbl, i) => <span key={i} className="ps-stat">{lbl}</span>)}
      </div>
      {group.athletes.map((a, i) => (
        <div key={i} className="ps-row">
          <span className="ps-pname">{a.athlete?.shortName ?? a.athlete?.displayName ?? '?'}</span>
          {colIdx.map((si, j) => <span key={j} className="ps-stat">{a.stats?.[si] || '—'}</span>)}
        </div>
      ))}
    </div>
  );
}

function PlayerStats({ players, teams }) {
  if (!players?.length) return null;

  const away = teams?.find(t => t.homeAway === 'away')?.team;
  const home = teams?.find(t => t.homeAway === 'home')?.team;
  const awayData = players.find(p => p.team?.id === away?.id);
  const homeData = players.find(p => p.team?.id === home?.id);

  return (
    <div className="player-stats">
      {PS_GROUPS.map(({ key, label }) => {
        const ag = awayData?.statistics?.find(s => s.name === key);
        const hg = homeData?.statistics?.find(s => s.name === key);
        if (!ag?.athletes?.length && !hg?.athletes?.length) return null;
        const ref = ag ?? hg;
        return (
          <div key={key} className="ps-group">
            <div className="ps-group-hdr">
              <span className="ps-group-title">{label}</span>
            </div>
            <div className="ps-cols">
              <PlayerTeamCol group={ag ? { ...ag, name: key } : null} />
              <PlayerTeamCol group={hg ? { ...hg, name: key } : null} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const FootballDetailContent = ({ data }) => {
  const teams = data?.boxscore?.teams;
  const [activeTab, setActiveTab] = useState('scoring');
  const [statsTab, setStatsTab] = useState('team');

  return (
    <>
      <LineScore scoring={data?.scoring} teams={teams} />
      <CurrentDriveVisual data={data} teams={teams} />
      <div className="stats-tab-toggle">
        <button
          className={`stats-tab${statsTab === 'team' ? ' stats-tab--active' : ''}`}
          onClick={() => setStatsTab('team')}
        >Team Stats</button>
        <button
          className={`stats-tab${statsTab === 'players' ? ' stats-tab--active' : ''}`}
          onClick={() => setStatsTab('players')}
        >Players</button>
      </div>
      {statsTab === 'team'    && <TeamStats teams={teams} />}
      {statsTab === 'players' && <PlayerStats players={data?.boxscore?.players} teams={teams} />}
      <div className="detail-tabs">
        <button
          className={`detail-tab${activeTab === 'scoring' ? ' detail-tab--active' : ''}`}
          onClick={() => setActiveTab('scoring')}
        >Scoring</button>
        <button
          className={`detail-tab${activeTab === 'drives' ? ' detail-tab--active' : ''}`}
          onClick={() => setActiveTab('drives')}
        >Drives</button>
      </div>
      {activeTab === 'scoring' && <ScoringPlays plays={data?.scoringPlays} />}
      {activeTab === 'drives' && <DrivesList drives={data?.drives} teams={teams} />}
    </>
  );
};

export default FootballDetailContent;
