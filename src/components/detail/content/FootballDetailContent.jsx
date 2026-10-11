import React, { useState, useMemo } from 'react';
import { getDownSuffix } from '../../../utils/gameHelpers';
import { LastPlay, resolveTeamLogo } from './LastPlay';
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

export function isHomeTeamPossession(driveTeam, homeTeam) {
  if (driveTeam?.id != null && homeTeam?.id != null && String(driveTeam.id) === String(homeTeam.id)) {
    return true;
  }
  if (driveTeam?.abbreviation && homeTeam?.abbreviation) {
    return driveTeam.abbreviation.toUpperCase() === homeTeam.abbreviation.toUpperCase();
  }
  return false;
}

export function yardsToFieldPosition(yardsToEndzone, isHomeDrive) {
  const yards = Number(yardsToEndzone);
  return Math.max(0, Math.min(100, isHomeDrive ? yards : 100 - yards));
}

export function getDriveFieldPosition(position, isHomeDrive, driveTeam, homeTeam, awayTeam) {
  if (position?.yardsToEndzone != null) {
    return yardsToFieldPosition(position.yardsToEndzone, isHomeDrive);
  }

  const textMatch = String(position?.text ?? '').trim().match(/^(.+?)\s+(\d+)$/);
  if (textMatch) {
    const label = textMatch[1].toUpperCase();
    const yards = Number(textMatch[2]);
    let ownSide = null;
    if (/^(OWN|OUR)$/.test(label)) ownSide = true;
    else if (/^(OPP|OPPONENT)$/.test(label)) ownSide = false;
    else if (driveTeam?.abbreviation && label === driveTeam.abbreviation.toUpperCase()) ownSide = true;
    else if (homeTeam?.abbreviation && label === homeTeam.abbreviation.toUpperCase()) {
      ownSide = isHomeTeamPossession(driveTeam, homeTeam);
    } else if (awayTeam?.abbreviation && label === awayTeam.abbreviation.toUpperCase()) {
      ownSide = isHomeTeamPossession(driveTeam, homeTeam) ? false : true;
    }

    if (ownSide !== null) {
      return isHomeDrive ? (ownSide ? 100 - yards : yards) : (ownSide ? yards : 100 - yards);
    }
  }

  const yardLine = position?.yardLine;
  const teamId = position?.team?.id;
  if (yardLine == null || teamId == null) return null;
  if (String(teamId) === String(awayTeam?.id)) return Number(yardLine);
  if (String(teamId) === String(homeTeam?.id)) return 100 - Number(yardLine);
  return null;
}

function FieldDriveVisual({ drive, teams, game }) {
  // SVG coordinate space: 0 0 120 80
  // x=0..10 = away EZ, x=10..110 = 100-yard field, x=110..120 = home EZ
  // All positions are normalised to "SVG yards from the away goal line" (0=away GL, 100=home GL).
  // Away team drives left→right (position increases). Home team drives right→left (position decreases).
  const EZ = 10, W = 120, H = 80, MID = H / 2;

  // Use game prop as authoritative home/away source so that mismatched boxscore
  // homeAway labels can't invert drive direction.
  const allBoxTeams = teams?.map(t => t.team).filter(Boolean) ?? [];
  const findById = (id) => allBoxTeams.find(t => t.id != null && String(t.id) === String(id));
  const homeTeam = findById(game?.homeTeam?.id) ?? teams?.find(t => t.homeAway === 'home')?.team;
  const awayTeam = findById(game?.awayTeam?.id) ?? teams?.find(t => t.homeAway === 'away')?.team;
  const awayColor = awayTeam?.color ? `#${awayTeam.color}` : '#1e293b';
  const homeColor = homeTeam?.color ? `#${homeTeam.color}` : '#1e293b';
  const awayLogo  = awayTeam?.logo;
  const homeLogo  = homeTeam?.logo;
  const toX = p => EZ + Math.max(0, Math.min(100, p));

  // Away team scores in the home EZ (right); home team scores in the away EZ (left).
  // yardsToEndzone always counts toward the SCORING end zone, so the mapping differs by team.
  const isHomeDrive = isHomeTeamPossession(drive.team, homeTeam);
  // Convert ESPN yardsToEndzone → SVG position (0=away GL, 100=home GL)
  // Away scores in home EZ (right=100): yte shrinks as they advance → pos = 100 - yte
  // Home scores in away EZ (left=0):    yte shrinks as they advance → pos = yte

  const startPos = (() => {
    return getDriveFieldPosition(drive.start, isHomeDrive, drive.team, homeTeam, awayTeam) ??
      (isHomeDrive ? 80 : 20);
  })();

  const plays = drive.plays ?? [];
  let curPos = startPos;
  const segments = plays.map((play, idx) => {
    let sp, ep;
    const startPosition = getDriveFieldPosition(play.start, isHomeDrive, drive.team, homeTeam, awayTeam);
    const endPosition = getDriveFieldPosition(play.end, isHomeDrive, drive.team, homeTeam, awayTeam);
    if (startPosition != null && endPosition != null) {
      sp = startPosition;
      ep = endPosition;
    } else {
      // Fallback: cumulative statYardage
      sp = curPos;
      const yards = play.statYardage ?? 0;
      ep = Math.max(0, Math.min(100, sp + (isHomeDrive ? -yards : yards)));
    }
    curPos = ep;
    const yardsGained = isHomeDrive ? sp - ep : ep - sp;
    return { sp, ep, idx, yardsGained };
  });
  const lastSegment = segments.at(-1) ?? null;
  const currentPosition = lastSegment?.ep ?? startPos;

  return (
    <div className="drive-field-wrapper">
    <svg viewBox={`0 0 ${W} ${H}`} className="drive-field-svg"
      preserveAspectRatio="none" aria-hidden="true">
      <defs>
      </defs>

      {/* Field: away EZ + 10 alternating yard bands + home EZ */}
      <rect x={0}        y={0} width={EZ} height={H} fill={awayColor} opacity={0.9} />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={(i + 1) * EZ} y={0} width={EZ} height={H}
          fill={i % 2 === 0 ? '#166534' : '#15803d'} />
      ))}
      <rect x={W - EZ}  y={0} width={EZ} height={H} fill={homeColor} opacity={0.9} />


      {/* 50-yard centre line */}
      <line x1={toX(50)} y1={0} x2={toX(50)} y2={H}
        stroke="white" strokeWidth={0.6} opacity={0.5} />


      <line
        className="drive-play-line"
        x1={toX(startPos)}
        y1={MID}
        x2={toX(currentPosition)}
        y2={MID}
        stroke="white"
        strokeWidth="10"
        strokeLinecap="butt"
      />
      {lastSegment?.yardsGained < 0 && (
        <line
          className="last-play-line"
          x1={toX(lastSegment.sp)}
          y1={MID}
          x2={toX(lastSegment.ep)}
          y2={MID}
          stroke="#ef4444"
          strokeWidth="10"
          strokeLinecap="butt"
        />
      )}
      {segments.length > 0 && (() => {
        const { sp, ep } = segments[segments.length - 1];
        const firstX = toX(Math.min(sp, ep));
        const secondX = toX(Math.max(sp, ep));
        const isZeroYardPlay = Math.abs(secondX - firstX) < 1;
        return (
          <g className="last-play-bounds">
            <line className="last-play-boundary" x1={firstX - (isZeroYardPlay ? 1 : 0)} y1={MID - 6} x2={firstX - (isZeroYardPlay ? 1 : 0)} y2={MID + 6} stroke="#7c3aed" strokeWidth="1.5" />
            <line className="last-play-boundary" x1={secondX + (isZeroYardPlay ? 1 : 0)} y1={MID - 6} x2={secondX + (isZeroYardPlay ? 1 : 0)} y2={MID + 6} stroke="#7c3aed" strokeWidth="1.5" />
          </g>
        );
      })()}
    </svg>
    {awayLogo && (
      <div className="ez-logo ez-logo-away">
        <img src={awayLogo} alt={awayTeam?.abbreviation ?? ''} />
      </div>
    )}
    {homeLogo && (
      <div className="ez-logo ez-logo-home">
        <img src={homeLogo} alt={homeTeam?.abbreviation ?? ''} />
      </div>
    )}
    {/* Yard numbers as HTML so they aren't distorted by the stretched SVG */}
    {[10,20,30,40,50,60,70,80,90].map(y => (
      <span key={y} className="yard-number" style={{ left: `calc(${(y + 10) / 120 * 100}%)` }}>{y > 50 ? 100 - y : y}</span>
    ))}
    </div>
  );
}

function CurrentDriveVisual({ data, teams, game }) {
  const drive = data?.drives?.current ?? null;
  if (!drive?.plays?.length) return null;

  const teamLookup = {};
  teams?.forEach(t => { if (t.team?.id) teamLookup[t.team.id] = t.team; });

  const teamInfo     = teamLookup[drive.team?.id];
  const logo         = teamInfo?.logo;
  const abbr         = teamInfo?.abbreviation ?? drive.team?.abbreviation ?? '';
  const result       = drive.shortDisplayResult ?? drive.displayResult ?? null;
  const numPlays     = drive.offensivePlays ?? drive.plays?.length ?? 0;
  const yards        = drive.yards ?? 0;
  const lastPlay     = drive.plays?.[drive.plays.length - 1];
  const situation    = data?.situation ?? data?.header?.competitions?.[0]?.situation ?? null;
  const sitDown      = situation?.down ?? lastPlay?.end?.down ?? null;
  const sitDistance  = situation?.distance ?? lastPlay?.end?.distance ?? null;
  const sitText      = situation?.downDistanceText ?? lastPlay?.end?.downDistanceText ?? lastPlay?.start?.downDistanceText ?? null;
  const downDistText = sitText ?? (sitDown ? `${sitDown}${getDownSuffix(sitDown)} & ${sitDistance ?? '—'}` : null);

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
        {downDistText && <span className="current-drive-situation">{downDistText}</span>}
      </div>
      <FieldDriveVisual drive={drive} teams={teams} game={game} />
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

export function getFootballLastPlay(data) {
  const currentDrivePlay = data?.drives?.current?.plays?.at(-1) ?? null;
  if (currentDrivePlay?.text) return currentDrivePlay;

  const previousDrivePlay = data?.drives?.previous?.at(-1)?.plays?.at(-1) ?? null;
  if (previousDrivePlay?.text) return previousDrivePlay;

  return data?.scoringPlays?.at(-1) ?? null;
}

const FootballDetailContent = ({ data, game }) => {
  const teams = data?.boxscore?.teams;
  const [activeTab, setActiveTab] = useState('scoring');
  const [statsTab, setStatsTab] = useState('team');

  const detailState = data?.header?.competitions?.[0]?.status?.type?.state;
  const isLive = detailState ? detailState === 'in' : (game?.status?.state === 'in');

  const lastPlay = useMemo(() => getFootballLastPlay(data), [data]);
  const lastPlayLogo = resolveTeamLogo(lastPlay, game);
  const periodLabel = (p) => p > 4 ? 'OT' : `Q${p}`;
  const lastPlayTime = lastPlay
    ? `${periodLabel(lastPlay.period?.number ?? 1)} ${lastPlay.clock?.displayValue ?? ''}`.trim()
    : null;

  return (
    <>
      {isLive && <LastPlay logo={lastPlayLogo} time={lastPlayTime} text={lastPlay?.text} />}
      <LineScore scoring={data?.scoring} teams={teams} />
      <CurrentDriveVisual data={data} teams={teams} game={game} />
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
      
    </>
  );
};

export default FootballDetailContent;
