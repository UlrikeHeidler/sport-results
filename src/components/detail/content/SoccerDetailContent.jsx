import React from 'react';
import './DetailContent.css';

const getEvents = (data) => data?.keyEvents ?? data?.plays ?? [];

const KEY_EVENT_TYPES = new Set([
  'goal', 'goal---free-kick', 'goal---own-goal', 'goal---header',
  'penalty---scored', 'penalty---missed',
  'yellow-card', 'red-card', 'yellow-red-card',
  'substitution',
]);

function eventIcon(e) {
  const t = e.type?.type ?? '';
  if (t.startsWith('goal') || t === 'penalty---scored') return '⚽';
  if (t === 'penalty---missed') return '✗';
  if (t === 'yellow-card') return '🟨';
  if (t === 'red-card' || t === 'yellow-red-card') return '🟥';
  if (t === 'substitution') return '↕';
  if (e.scoringPlay) return '⚽';
  return '•';
}

function eventPlayer(e) {
  const t = e.type?.type ?? '';
  const p0 = e.participants?.[0]?.athlete?.displayName;
  const p1 = e.participants?.[1]?.athlete?.displayName;
  if (t === 'substitution' && p0 && p1) return `${p0} / ${p1}`;
  return p0 ?? e.shortText ?? '';
}

// Two-column timeline: away on left, home on right, icon+minute in center
function KeyEvents({ events, teams }) {
  const away = teams?.find(t => t.homeAway === 'away')?.team;
  const home = teams?.find(t => t.homeAway === 'home')?.team;

  const filtered = events.filter(e =>
    (e.scoringPlay || KEY_EVENT_TYPES.has(e.type?.type)) && e.clock?.displayValue
  );
  if (!filtered.length) return null;

  return (
    <>
      <div className="detail-section-title">Key Events</div>
      <div className="key-events">
        {filtered.map((e, i) => {
          const isAway = e.team?.id === away?.id;
          const isHome = e.team?.id === home?.id;
          const player = eventPlayer(e);
          return (
            <div key={i} className="ke-row">
              <span className={`ke-side ke-side--away${isAway ? ' ke-side--active' : ''}`}>
                {isAway ? player : ''}
              </span>
              <span className="ke-mid">
                <span className="ke-icon">{eventIcon(e)}</span>
                <span className="ke-min">{e.clock.displayValue}</span>
              </span>
              <span className={`ke-side ke-side--home${isHome ? ' ke-side--active' : ''}`}>
                {isHome ? player : ''}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ShotMap — tabled for now
function ShotMap({ commentary, teams }) { ... }
*/

function MatchEvents({ commentary }) {
  if (!commentary?.length) return null;
  const entries = [...commentary]
    .filter(c => c.text)
    .reverse();
  if (!entries.length) return null;

  return (
    <>
      <div className="detail-section-title">Commentary</div>
      <div className="live-ticker">
        {entries.map((c, i) => (
          <div key={i} className="ticker-entry">
            <span className="ticker-time">{c.time?.displayValue ?? ''}</span>
            <span className="ticker-text">{c.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function MatchStats({ teams }) {
  const away = teams?.find(t => t.homeAway === 'away');
  const home = teams?.find(t => t.homeAway === 'home');
  if (!away || !home) return null;

  const statKeys = [
    { name: 'possessionPct',  label: 'Possession %' },
    { name: 'totalShots',     label: 'Shots' },
    { name: 'shotsOnTarget',  label: 'On Target' },
    { name: 'foulsCommitted', label: 'Fouls' },
    { name: 'wonCorners',     label: 'Corners' },
    { name: 'offsides',       label: 'Offsides' },
  ];

  const statVal = (team, name) =>
    team.statistics?.find(s => s.name === name)?.displayValue ?? null;

  const rows = statKeys.map(({ name, label }) => {
    const a = statVal(away, name);
    const h = statVal(home, name);
    if (a === null && h === null) return null;
    const an = parseFloat(a) || 0;
    const hn = parseFloat(h) || 0;
    const total = an + hn || 1;
    return { label, a: a ?? '—', h: h ?? '—', aPct: (an / total) * 100, hPct: (hn / total) * 100 };
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
          <React.Fragment key={r.label}>
            <div className="stat-row">
              <span className="stat-row-away">{r.a}</span>
              <span className="stat-row-label">{r.label}</span>
              <span className="stat-row-home">{r.h}</span>
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

const SoccerDetailContent = ({ data }) => {
  const events = getEvents(data);
  const teams  = data?.boxscore?.teams;

  return (
    <>
      <KeyEvents events={events} teams={teams} />
      <MatchEvents commentary={data?.commentary} />
      <MatchStats teams={teams} />
    </>
  );
};

export default SoccerDetailContent;
