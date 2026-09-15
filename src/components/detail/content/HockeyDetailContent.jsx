import React from 'react';
import './DetailContent.css';

const PERIOD_LABEL = p => p === 4 ? 'OT' : p === 5 ? 'SO' : `P${p}`;

function LineScore({ scoring, teams }) {
  if (!scoring?.length) return null;

  const periods = [...new Set(scoring.map(s => s.period?.number).filter(Boolean))];
  const maxPeriod = Math.max(...periods, 3);
  const cols = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  const away = teams?.find(t => t.homeAway === 'away');
  const home = teams?.find(t => t.homeAway === 'home');

  // Goals per period per team
  const goals = { away: {}, home: {} };
  scoring.forEach(s => {
    const p = s.period?.number;
    if (!p) return;
    const side = s.team?.homeAway ?? (s.homeScore !== undefined ? 'home' : 'away');
    goals[side][p] = (goals[side][p] ?? 0) + 1;
  });

  const lastScore = scoring.at(-1) ?? {};

  return (
    <div className="linescore-wrap">
      <table className="linescore">
        <thead>
          <tr>
            <th></th>
            {cols.map(p => <th key={p}>{PERIOD_LABEL(p)}</th>)}
            <th className="total-col">T</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{away?.team?.abbreviation ?? 'AWY'}</td>
            {cols.map(p => <td key={p}>{goals.away[p] ?? 0}</td>)}
            <td className="total-col">{lastScore.awayScore ?? '—'}</td>
          </tr>
          <tr>
            <td>{home?.team?.abbreviation ?? 'HME'}</td>
            {cols.map(p => <td key={p}>{goals.home[p] ?? 0}</td>)}
            <td className="total-col">{lastScore.homeScore ?? '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Goals({ plays }) {
  const goals = plays?.filter(p => p.scoringPlay) ?? [];
  if (!goals.length) return null;
  return (
    <>
      <div className="detail-section-title">Goals</div>
      <ul className="score-plays">
        {goals.map((g, i) => (
          <li key={i} className="score-play">
            <span className="score-play-badge">{PERIOD_LABEL(g.period?.number ?? 1)}</span>
            <span className="score-play-text">{g.text ?? g.participants?.map(p => p.athlete?.shortName).join(', ') ?? '—'}</span>
            <span className="score-play-score">{g.awayScore ?? ''}–{g.homeScore ?? ''}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Shots({ teams }) {
  const away = teams?.find(t => t.homeAway === 'away');
  const home = teams?.find(t => t.homeAway === 'home');
  const aSh = away?.statistics?.find(s => s.name === 'saves')?.displayValue
    ?? away?.statistics?.find(s => s.name === 'shots')?.displayValue;
  const hSh = home?.statistics?.find(s => s.name === 'saves')?.displayValue
    ?? home?.statistics?.find(s => s.name === 'shots')?.displayValue;
  if (!aSh && !hSh) return null;
  return (
    <>
      <div className="detail-section-title">Shots on Goal</div>
      <div className="team-stats">
        <div className="stat-row">
          <span className="stat-row-away">{aSh ?? '—'}</span>
          <span className="stat-row-label">SOG</span>
          <span className="stat-row-home">{hSh ?? '—'}</span>
        </div>
      </div>
    </>
  );
}

const HockeyDetailContent = ({ data }) => (
  <>
    <LineScore scoring={data?.scoringPlays} teams={data?.boxscore?.teams} />
    <Goals plays={data?.plays ?? data?.scoringPlays} />
    <Shots teams={data?.boxscore?.teams} />
  </>
);

export default HockeyDetailContent;
