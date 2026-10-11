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
  if (!commentary?.length) return <div className="detail-empty">Commentary unavailable</div>;
  const entries = [...commentary]
    .filter(c => c.text)
    .reverse();
  if (!entries.length) return <div className="detail-empty">Commentary unavailable</div>;

  return (
    <div className="live-ticker">
      {entries.map((c, i) => (
        <div key={i} className="ticker-entry">
          <span className="ticker-time">{c.time?.displayValue ?? ''}</span>
          <span className="ticker-text">{c.text}</span>
        </div>
      ))}
    </div>
  );
}

function MatchStats({ teams }) {
  const away = teams?.find(t => t.homeAway === 'away');
  const home = teams?.find(t => t.homeAway === 'home');
  if (!away || !home) return <div className="detail-empty">Match stats unavailable</div>;

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

  if (!rows.length) return <div className="detail-empty">Match stats unavailable</div>;

  return (
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

function getPlayerStat(player, name) {
  const stat = player.stats?.find(item => item.name === name);
  return Number(stat?.value ?? stat?.displayValue) || 0;
}

function getPlayerLine(player, separateAttackingMidfield) {
  const position = `${player.position?.name ?? ''} ${player.position?.abbreviation ?? ''}`.toLowerCase();
  if (position.includes('goalkeeper') || /\b(g|gk)\b/.test(position)) return 'Goalkeeper';
  if (/\b(cb|cd|lb|rb|lwb|rwb|df|def)\b|defender|back/.test(position)) return 'Defence';
  if (/\b(f|fw|st|cf|lf|rf|lw|rw|att)\b|forward|striker|winger/.test(position)) return 'Forwards';
  if (separateAttackingMidfield && (position.includes('attacking') || /\b(am|am-l|am-r|cam|cam-l|cam-r)\b/.test(position))) {
    return 'Attacking Midfield';
  }
  if (/\b(cm|cdm|cam|lm|rm|dm|am|mf|mid)\b|midfield/.test(position)) return 'Midfield';
  return 'Other';
}

function getPlayerSide(player) {
  const position = `${player.position?.name ?? ''} ${player.position?.abbreviation ?? ''}`.toLowerCase();
  if (/left back|\blb\b|\blwb\b/.test(position)) return -3;
  if (/right back|\brb\b|\brwb\b/.test(position)) return 3;
  if (/center left|cd-l|cb-l/.test(position)) return -1;
  if (/center right|cd-r|cb-r/.test(position)) return 1;
  if (/\bleft\b|-l\b/.test(position)) return -1;
  if (/\bright\b|-r\b/.test(position)) return 1;
  return 0;
}

function getTeamAccent(team) {
  const toHex = color => {
    const value = color?.replace(/^#/, '');
    return /^[0-9a-f]{6}$/i.test(value ?? '') ? `#${value}` : null;
  };
  const luminance = hex => {
    const channels = hex.slice(1).match(/.{2}/g).map(value => parseInt(value, 16) / 255);
    const [red, green, blue] = channels.map(value =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const colors = [toHex(team?.color), toHex(team?.alternateColor)].filter(Boolean);
  return colors.find(color => luminance(color) <= 0.18) ?? '#1f2937';
}

function getPlayerStatus(player) {
  if (player.subbedIn && player.subbedOut) return 'Subbed in/out';
  if (player.subbedIn) return 'Subbed in';
  if (player.subbedOut) return 'Subbed out';
  if (player.starter) return 'Starter';
  return 'Bench';
}

function PlayerIndicators({ player }) {
  const goals = getPlayerStat(player, 'totalGoals');
  const yellowCards = getPlayerStat(player, 'yellowCards');
  const redCards = getPlayerStat(player, 'redCards');

  return (
    <span className="soccer-player-indicators">
      {goals > 0 && (
        <span className="soccer-player-goals" aria-label={`${goals} goals`} title={`${goals} goals`}>
          <span aria-hidden="true">⚽</span>{goals > 1 && ` ${goals}`}
        </span>
      )}
      {yellowCards > 0 && (
        <span className="soccer-player-card soccer-player-card--yellow" aria-label={`${yellowCards} yellow cards`} title={`${yellowCards} yellow cards`}>
          <span className="soccer-card-shape" aria-hidden="true" />{yellowCards > 1 && ` ${yellowCards}`}
        </span>
      )}
      {redCards > 0 && (
        <span className="soccer-player-card soccer-player-card--red" aria-label={`${redCards} red cards`} title={`${redCards} red cards`}>
          <span className="soccer-card-shape" aria-hidden="true" />{redCards > 1 && ` ${redCards}`}
        </span>
      )}
    </span>
  );
}

function TeamLineup({ roster }) {
  const players = roster.roster ?? [];
  const starters = players.filter(player => player.starter);
  const formationParts = (roster.formation ?? '').split('-');
  const separateAttackingMidfield = formationParts.slice(1, -1).length > 1;
  const lineOrder = [
    'Forwards',
    ...(separateAttackingMidfield ? ['Attacking Midfield'] : []),
    'Midfield',
    'Other',
    'Defence',
    'Goalkeeper',
  ];
  const lines = lineOrder
    .map(name => ({
      name,
      players: starters
        .filter(player => getPlayerLine(player, separateAttackingMidfield) === name)
        .sort((a, b) => getPlayerSide(a) - getPlayerSide(b) || Number(a.formationPlace) - Number(b.formationPlace)),
    }))
    .filter(line => line.players.length);
  const orderedPlayers = [...players].sort((a, b) => Number(b.starter) - Number(a.starter));
  const color = getTeamAccent(roster.team);

  return (
    <section
      className="soccer-lineup"
      style={{ '--soccer-team-color': color }}
      aria-label={`${roster.team?.displayName ?? 'Team'} lineup`}
    >
      <div className="soccer-lineup-heading">
        <h2>{roster.team?.displayName ?? 'Team'}</h2>
        {roster.formation && <span>Formation {roster.formation}</span>}
      </div>
      <div className="soccer-lineup-layout">
        <div className="soccer-pitch" role="group" aria-label={`${roster.formation ?? ''} formation pitch`}>
          {lines.length ? lines.map(line => (
            <div
              className={`soccer-pitch-line soccer-pitch-line--${line.name.toLowerCase().replace(/\s+/g, '-')}`}
              key={line.name}
              role="group"
              aria-label={line.name}
            >
              {line.players.map(player => (
                <div
                  className="soccer-pitch-player"
                  key={player.athlete?.id ?? `${player.jersey}-${player.athlete?.displayName}`}
                  title={`${player.jersey ?? '—'} ${player.athlete?.displayName ?? ''}`}
                  aria-label={`Number ${player.jersey ?? 'unknown'}, ${player.athlete?.displayName ?? 'Unknown player'}`}
                >
                  <span className="soccer-pitch-number">{player.jersey ?? '—'}</span>
                  <span className="soccer-pitch-name">{player.athlete?.lastName ?? player.athlete?.displayName}</span>
                </div>
              ))}
            </div>
          )) : <div className="soccer-pitch-empty">Starting lineup unavailable</div>}
        </div>
        <div className="soccer-roster-wrap">
          <div className="soccer-roster-heading">
            <span>Players</span><span>Status</span>
          </div>
          {orderedPlayers.length ? orderedPlayers.map((player, index) => {
            const status = getPlayerStatus(player);
            const name = player.athlete?.displayName ?? 'Unknown player';
            return (
              <div
                className="soccer-roster-row"
                key={player.athlete?.id ?? `${player.jersey}-${index}`}
              >
                <span className="soccer-roster-number">{player.jersey ?? '—'}</span>
                <span className="soccer-roster-name" title={name}>{name}</span>
                <span className="soccer-roster-position" title={player.position?.name ?? ''}>
                  {player.position?.abbreviation ?? '—'}
                </span>
                <PlayerIndicators player={player} />
                <span className={`soccer-roster-status soccer-roster-status--${status.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
                  {status}
                </span>
              </div>
            );
          }) : <div className="detail-empty">Roster unavailable</div>}
        </div>
      </div>
    </section>
  );
}

const SoccerDetailContent = ({ data, game }) => {
  const [activeTab, setActiveTab] = React.useState('commentary');
  const events = getEvents(data);
  const teams  = data?.boxscore?.teams;
  const rosters = data?.rosters ?? [];
  const tabs = [
    { key: 'commentary', label: 'Commentary' },
    { key: 'stats', label: 'Match Stats' },
    ...rosters.map((roster, index) => ({
      key: `team-${roster.team?.id ?? index}`,
      label: roster.team?.abbreviation ?? roster.team?.shortDisplayName ?? roster.team?.displayName ?? `Team ${index + 1}`,
      roster,
    })),
  ];
  const selectedTab = tabs.some(tab => tab.key === activeTab) ? activeTab : 'commentary';

  const detailState = data?.header?.competitions?.[0]?.status?.type?.state;
  const isLive = detailState ? detailState === 'in' : (game?.status?.state === 'in');
  const overTime = game?.status?.type?.includes('OVERTIME') ? 'overtime' : 'regular';

  const lastEvent = events.length ? events[events.length - 1] : null;
  const latestCommentary = [...(data?.commentary ?? [])].filter(item => item.text).at(-1);
  const lastPlay = latestCommentary ?? lastEvent;
  const lastPlayLogo = resolveTeamLogo(lastPlay, game) ?? resolveTeamLogo(lastEvent, game);
  const lastPlayTime = lastPlay?.time?.displayValue ?? lastPlay?.clock?.displayValue ?? null;
  const lastPlayText = lastPlay?.text ?? lastPlay?.shortText ?? null;

  const timeline = toTimelineEvents(data?.keyEvents);

  return (
    <>
      {isLive && <LastPlay logo={lastPlayLogo} time={lastPlayTime} text={lastPlayText} />}
      {!isLive && (
        <SoccerTimeline
          timeline={timeline}
          homeTeam={game?.homeTeam}
          awayTeam={game?.awayTeam}
          overTime={overTime}
        />
      )}
      <KeyEvents events={events} teams={teams} />
      <div className="detail-tabs" role="tablist" aria-label="Soccer match details">
        {tabs.map(tab => (
          <button
            className={`detail-tab${selectedTab === tab.key ? ' detail-tab--active' : ''}`}
            id={`soccer-tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={selectedTab === tab.key}
            aria-controls={`soccer-panel-${tab.key}`}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {selectedTab === 'commentary' && (
        <div role="tabpanel" id="soccer-panel-commentary" aria-labelledby="soccer-tab-commentary">
          <MatchEvents commentary={data?.commentary} />
        </div>
      )}
      {selectedTab === 'stats' && (
        <div
          role="tabpanel"
          id="soccer-panel-stats"
          aria-labelledby="soccer-tab-stats"
        >
          <MatchStats teams={teams} />
        </div>
      )}
      {selectedTab.startsWith('team-') && (
        <div
          role="tabpanel"
          id={`soccer-panel-${selectedTab}`}
          aria-labelledby={`soccer-tab-${selectedTab}`}
        >
          <TeamLineup roster={tabs.find(tab => tab.key === selectedTab)?.roster ?? {}} />
        </div>
      )}
    </>
  );
};

export default SoccerDetailContent;
