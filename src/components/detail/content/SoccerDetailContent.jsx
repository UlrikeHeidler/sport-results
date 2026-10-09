import React from 'react';
import { LastPlay, resolveTeamLogo } from './LastPlay';
import { SoccerTimeline } from '../../shared/SoccerTimeline';
import './DetailContent.css';

const getEvents = (data) => data?.keyEvents ?? data?.plays ?? [];

const KEY_EVENT_TYPES = new Set([
  'goal', 'goal---free-kick', 'goal---own-goal', 'goal---header',
  'penalty---scored', 'penalty---missed',
  'yellow-card', 'red-card', 'yellow-red-card',
  'substitution',
]);

function isVarCancelled(e) {
  const type = (e.type?.type ?? '').toLowerCase();
  if (type.includes('var') || type.includes('disallowed') || type.includes('cancelled')) return true;
  if (e.cancelled === true || e.disallowed === true) return true;
  const text = ((e.text ?? '') + ' ' + (e.shortText ?? '')).toLowerCase();
  return text.includes('var') || text.includes('ruled out') || text.includes('disallowed') || text.includes('goal cancelled');
}

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

function KeyEventEntry({ e }) {
  const varCancelled = isVarCancelled(e);
  return (
    <div className="ke-entry">
      <span className="ke-icon" style={varCancelled ? { opacity: 0.2 } : undefined}>{eventIcon(e)}</span>
      <span className="ke-min">{e.clock.displayValue}</span>
      <span className="ke-player">{eventPlayer(e)}</span>
    </div>
  );
}

// Two independent columns: away events left, home events right
function KeyEvents({ events, teams }) {
  const away = teams?.find(t => t.homeAway === 'away')?.team;
  const home = teams?.find(t => t.homeAway === 'home')?.team;

  const filtered = events.filter(e =>
    (e.scoringPlay || KEY_EVENT_TYPES.has(e.type?.type)) && e.clock?.displayValue
  );
  if (!filtered.length) return null;

  const awayEvents = filtered.filter(e => e.team?.id === away?.id);
  const homeEvents = filtered.filter(e => e.team?.id === home?.id);

  return (
    <>
      <div className="detail-section-title">Key Events</div>
      <div className="key-events-cols">
        <div className="ke-col ke-col--away">
          <div className="ke-col-header">{away?.abbreviation ?? 'Away'}</div>
          {awayEvents.map((e, i) => <KeyEventEntry key={i} e={e} />)}
        </div>
        <div className="ke-col ke-col--home">
          <div className="ke-col-header">{home?.abbreviation ?? 'Home'}</div>
          {homeEvents.map((e, i) => <KeyEventEntry key={i} e={e} />)}
        </div>
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

const TIMELINE_EVENT_TYPES = new Set(['goal', 'yellow card', 'red card', 'substitution']);

function toTimelineEvents(keyEvents) {
  if (!keyEvents?.length) return [];
  return keyEvents
    .filter(e => {
      const t = (e.type?.text ?? '').toLowerCase();
      return TIMELINE_EVENT_TYPES.has(t) ||
        t.includes('goal') || t.includes('yellow') || t.includes('red');
    })
    .map(e => ({
      minute: e.clock?.displayValue || e.period?.displayValue || '',
      type: e.type,
      team: e.team?.id || '',
      description: e.text || '',
      varCancelled: isVarCancelled(e),
    }));
}

const SoccerDetailContent = ({ data, game }) => {
  const events = getEvents(data);
  const teams  = data?.boxscore?.teams;

  const detailState = data?.header?.competitions?.[0]?.status?.type?.state;
  const isLive = detailState ? detailState === 'in' : (game?.status?.state === 'in');
  const overTime = game?.status?.type?.includes('OVERTIME') ? 'overtime' : 'regular';

  const lastEvent = events.length ? events[events.length - 1] : null;
  const lastPlayLogo = resolveTeamLogo(lastEvent, game);
  const lastPlayTime = lastEvent?.clock?.displayValue ?? null;
  const lastPlayText = lastEvent?.text ?? lastEvent?.shortText ?? null;

  const timeline = toTimelineEvents(data?.keyEvents);

  return (
    <>
      {isLive && <LastPlay logo={lastPlayLogo} time={lastPlayTime} text={lastPlayText} />}
      {isLive && (
        <SoccerTimeline
          timeline={timeline}
          homeTeam={game?.homeTeam}
          awayTeam={game?.awayTeam}
          overTime={overTime}
        />
      )}
      <KeyEvents events={events} teams={teams} />
      <MatchEvents commentary={data?.commentary} />
      <MatchStats teams={teams} />
    </>
  );
};

export default SoccerDetailContent;
