import React from 'react';
import './DetailContent.css';

function LineScore({ scoring, teams }) {
  if (!scoring?.length) return null;

  const periods = [...new Set(scoring.map(s => s.period?.number).filter(Boolean))];
  const maxPeriod = Math.max(...periods, 4);
  const cols = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  let prevHome = 0, prevAway = 0;
  const homeByPeriod = {}, awayByPeriod = {};
  [...scoring].sort((a, b) => (a.period?.number ?? 0) - (b.period?.number ?? 0)).forEach(s => {
    const p = s.period?.number;
    if (!p) return;
    homeByPeriod[p] = (s.homeScore ?? 0) - prevHome;
    awayByPeriod[p] = (s.awayScore ?? 0) - prevAway;
    prevHome = s.homeScore ?? prevHome;
    prevAway = s.awayScore ?? prevAway;
  });

  const lastScore = scoring.at(-1) ?? {};
  const away = teams?.find(t => t.homeAway === 'away');
  const home = teams?.find(t => t.homeAway === 'home');

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
            <td>{away?.team?.abbreviation ?? 'AWY'}</td>
            {cols.map(p => <td key={p}>{awayByPeriod[p] ?? '—'}</td>)}
            <td className="total-col">{lastScore.awayScore ?? '—'}</td>
          </tr>
          <tr>
            <td>{home?.team?.abbreviation ?? 'HME'}</td>
            {cols.map(p => <td key={p}>{homeByPeriod[p] ?? '—'}</td>)}
            <td className="total-col">{lastScore.homeScore ?? '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const STAT_KEYS = [
  { name: 'fieldGoalsMade-fieldGoalsAttempted', label: 'FG', format: v => v },
  { name: 'threePointFieldGoalsMade-threePointFieldGoalsAttempted', label: '3PT', format: v => v },
  { name: 'freeThrowsMade-freeThrowsAttempted', label: 'FT', format: v => v },
  { name: 'reboundsTotal', label: 'REB', format: v => v },
  { name: 'assists', label: 'AST', format: v => v },
  { name: 'turnovers', label: 'TO', format: v => v },
];

function TeamStats({ teams }) {
  if (!teams?.length) return null;
  const away = teams.find(t => t.homeAway === 'away');
  const home = teams.find(t => t.homeAway === 'home');
  if (!away || !home) return null;

  const statVal = (team, name) => {
    const s = team.statistics?.find(s => s.name === name);
    return s?.displayValue ?? '—';
  };

  const rows = STAT_KEYS.map(({ name, label }) => ({
    label, a: statVal(away, name), h: statVal(home, name)
  })).filter(r => r.a !== '—' || r.h !== '—');

  if (!rows.length) return null;

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
          <div key={r.label} className="stat-row">
            <span className="stat-row-away">{r.a}</span>
            <span className="stat-row-label">{r.label}</span>
            <span className="stat-row-home">{r.h}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const BasketballDetailContent = ({ data }) => (
  <>
    <LineScore scoring={data?.scoring} teams={data?.boxscore?.teams} />
    <TeamStats teams={data?.boxscore?.teams} />
  </>
);

export default BasketballDetailContent;
