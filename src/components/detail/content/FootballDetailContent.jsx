import React from 'react';
import './DetailContent.css';

/* Helpers */
const statVal = (stats, name) =>
  stats?.find(s => s.name === name)?.displayValue ?? '—';

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
  if (!plays?.length) return null;
  return (
    <>
      <div className="detail-section-title">Scoring</div>
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
    </>
  );
}

function TeamStats({ teams }) {
  if (!teams?.length) return null;

  const away = teams.find(t => t.homeAway === 'away');
  const home = teams.find(t => t.homeAway === 'home');
  if (!away || !home) return null;

  const statKeys = [
    { name: 'totalYards', label: 'Total Yards' },
    { name: 'passingYards', label: 'Pass Yds' },
    { name: 'rushingYards', label: 'Rush Yds' },
    { name: 'turnovers', label: 'Turnovers' },
  ];

  const rows = statKeys.map(({ name, label }) => {
    const a = parseFloat(statVal(away.statistics, name)) || 0;
    const h = parseFloat(statVal(home.statistics, name)) || 0;
    const total = a + h || 1;
    return { label, a, h, aPct: (a / total) * 100, hPct: (h / total) * 100,
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

const FootballDetailContent = ({ data }) => {
  const teams = data?.boxscore?.teams;
  return (
    <>
      <LineScore scoring={data?.scoring} teams={teams} />
      <TeamStats teams={teams} />
      <ScoringPlays plays={data?.scoringPlays} />
    </>
  );
};

export default FootballDetailContent;
