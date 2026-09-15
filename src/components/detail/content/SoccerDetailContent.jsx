import React from 'react';
import './DetailContent.css';

const CARD_ICONS = { yellow: '🟨', red: '🟥', yellowred: '🟥' };

function Goals({ plays }) {
  const goals = plays?.filter(p => p.scoringPlay) ?? [];
  if (!goals.length) return null;
  return (
    <>
      <div className="detail-section-title">Goals</div>
      <ul className="score-plays">
        {goals.map((g, i) => (
          <li key={i} className="score-play">
            <span className="score-play-badge">{g.clock?.displayValue ?? `${g.period?.number ?? ''}H`}</span>
            <span className="score-play-text">
              ⚽ {g.participants?.[0]?.athlete?.shortName ?? g.text ?? '—'}
            </span>
            <span className="score-play-score">{g.awayScore ?? ''}–{g.homeScore ?? ''}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Cards({ plays }) {
  const cards = plays?.filter(p =>
    p.type?.abbreviation === 'YC' || p.type?.abbreviation === 'RC' || p.type?.text?.toLowerCase().includes('card')
  ) ?? [];
  if (!cards.length) return null;
  return (
    <>
      <div className="detail-section-title">Cards</div>
      <ul className="score-plays">
        {cards.map((c, i) => {
          const cardType = c.type?.abbreviation === 'RC' ? 'red' : 'yellow';
          return (
            <li key={i} className="score-play">
              <span className="score-play-badge">{c.clock?.displayValue ?? ''}</span>
              <span className="score-play-text">
                {CARD_ICONS[cardType]} {c.participants?.[0]?.athlete?.shortName ?? c.text ?? '—'}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function MatchStats({ teams }) {
  const away = teams?.find(t => t.homeAway === 'away');
  const home = teams?.find(t => t.homeAway === 'home');
  if (!away || !home) return null;

  const statKeys = [
    { name: 'possessionPct', label: 'Possession %' },
    { name: 'totalShots', label: 'Shots' },
    { name: 'shotsOnTarget', label: 'On Target' },
    { name: 'fouls', label: 'Fouls' },
    { name: 'cornerKicks', label: 'Corners' },
  ];

  const statVal = (team, name) =>
    team.statistics?.find(s => s.name === name)?.displayValue ?? null;

  const rows = statKeys.map(({ name, label }) => {
    const a = statVal(away, name);
    const h = statVal(home, name);
    return a !== null || h !== null ? { label, a: a ?? '—', h: h ?? '—' } : null;
  }).filter(Boolean);

  if (!rows.length) return null;

  return (
    <>
      <div className="detail-section-title">Match Stats</div>
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

const SoccerDetailContent = ({ data }) => (
  <>
    <Goals plays={data?.plays} />
    <Cards plays={data?.plays} />
    <MatchStats teams={data?.boxscore?.teams} />
  </>
);

export default SoccerDetailContent;
