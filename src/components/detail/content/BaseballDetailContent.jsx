import React, { useState } from 'react';
import './DetailContent.css';

/* ── Helpers ────────────────────────────────────────────── */

// homeAway is on boxscore.teams[], not on boxscore.players[]; match by team id
function resolveHomeAway(players, teams) {
  const idToHomeAway = {};
  teams?.forEach(t => { if (t.team?.id) idToHomeAway[t.team.id] = t.homeAway; });
  return (players ?? []).map(p => ({ ...p, homeAway: idToHomeAway[p.team?.id] ?? p.homeAway }));
}

/* ── Pitch / at-bat helpers ─────────────────────────────── */

function isPitchEvent(text = '') {
  return /^Pitch \d+\s*:/i.test(text);
}

// "Pitch 1 :" marks the first pitch of a new at-bat
function isFirstPitchOfAtBat(text = '') {
  return /^Pitch 1\s*:/i.test(text);
}

function classifyPitch(text = '') {
  const desc = text.includes(':') ? text.split(':').slice(1).join(':').trim() : text;
  const d = desc.toLowerCase();
  if (/ball in play/i.test(d))      return { cls: 'pitch--inplay', label: '✕' };
  if (/^ball\b/.test(d) || /intentional ball/.test(d)) return { cls: 'pitch--ball', label: 'B' };
  if (/in play/.test(d))            return { cls: 'pitch--inplay', label: '✕' };
  if (/swinging/.test(d))           return { cls: 'pitch--swing',  label: 'S' };
  if (/looking|called/.test(d))     return { cls: 'pitch--called', label: 'C' };
  if (/foul/.test(d))               return { cls: 'pitch--foul',   label: 'F' };
  if (/pitchout/.test(d))           return { cls: 'pitch--ball',   label: 'P' };
  return { cls: 'pitch--other', label: '·' };
}

function classifyOutcome(text = '') {
  const t = text.toLowerCase();
  if (t.includes('home run') || t.includes('homers'))                   return { code: 'HR',  cls: 'outcome--hr' };
  if (t.includes('triple'))                                              return { code: '3B',  cls: 'outcome--extra' };
  if (t.includes('double play'))                                         return { code: 'GDP', cls: 'outcome--out' };
  if (t.includes('double'))                                              return { code: '2B',  cls: 'outcome--extra' };
  if (t.includes('single') || t.includes('singles'))                    return { code: '1B',  cls: 'outcome--hit' };
  if (t.includes('intentionally walks') || t.includes('intentional w')) return { code: 'IBB', cls: 'outcome--walk' };
  if (t.includes('hit by pitch'))                                        return { code: 'HBP', cls: 'outcome--walk' };
  if (t.includes('walks') || t.includes('walked'))                      return { code: 'W',   cls: 'outcome--hit' };
  if (t.includes('struck out') || t.includes('strikes out') || t.includes('called out on strikes')) return { code: 'K', cls: 'outcome--k' };
  if (t.includes('sacrifice fly'))                                       return { code: 'SF',  cls: 'outcome--sac' };
  if (t.includes('sacrifice'))                                           return { code: 'SAC', cls: 'outcome--sac' };
  if (t.includes('reaches on') || (t.includes('error') && !t.includes('pitching error'))) return { code: 'E', cls: 'outcome--error' };
  if (t.includes('fouled out'))                                                     return { code: 'FO',  cls: 'outcome--out' };
  if (t.includes('flied out') || t.includes('flies out') || t.includes('fly out')) return { code: 'FLY', cls: 'outcome--out' };
  if (t.includes('lined out') || t.includes('lines out'))               return { code: 'LO',  cls: 'outcome--out' };
  if (t.includes('popped out') || t.includes('pops out'))               return { code: 'PO',  cls: 'outcome--out' };
  if (t.includes('grounded out') || t.includes('grounds out') || t.includes('ground out')) return { code: 'GO', cls: 'outcome--out' };
  if (t.includes("fielder's choice") || t.includes('force out') || t.includes('forced out')) return { code: 'FC', cls: 'outcome--out' };
  return null;
}

// Extract batter name — text before the first action verb
function extractBatterName(text = '') {
  const m = text.match(/^(.+?)\s+(struck|lined|grounded|walked|doubled|singled|tripled|homered|flied|popped|reached|reaches|safe|hit\b|hits|hit by|sacrificed|fouled|flew|bunted|was intentionally|intentionally walked|scored|out\s)/i);
  return m ? m[1] : null;
}

const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
function ordinal(n) { return ORDINAL[n] ?? `${n}th`; }

/* ── Group plays → innings → away/home at-bat columns ──── */
function groupHalf(plays) {
  const atBats = [];
  let pitches = [];
  for (const play of plays) {
    const t = play.text ?? '';
    if (!t) continue;
    if (isPitchEvent(t)) {
      if (pitches.length > 0 && isFirstPitchOfAtBat(t)) {
        atBats.push({ result: null, pitches });
        pitches = [];
      }
      pitches.push(play);
    } else {
      // Only close the at-bat for recognizable results. Mid-at-bat baserunning events
      // (pickoffs, steals, wild pitches, pitching changes) have no outcome and no
      // batter name — skipping them keeps their pitches attached to the correct at-bat.
      const hasOutcome = classifyOutcome(t) !== null;
      const hasBatter  = extractBatterName(t) !== null;
      if (hasOutcome || hasBatter || play.scoringPlay) {
        atBats.push({ result: play, pitches });
        pitches = [];
      }
    }
  }
  if (pitches.length > 0) atBats.push({ result: null, pitches });
  return atBats.filter(ab => ab.result || ab.pitches.length > 0);
}

function buildInnings(plays) {
  const inningMap   = new Map();
  const inningOrder = [];
  let half = 'away';

  const ensure = n => {
    if (!inningMap.has(n)) {
      inningMap.set(n, { away: [], home: [], topSeen: false, middleSeen: false, bottomSeen: false, endSeen: false });
      inningOrder.push(n);
    }
    return inningMap.get(n);
  };

  for (const play of plays) {
    const t = play.text ?? '';
    const n = play.period?.number ?? 0;

    if (/^top of the/i.test(t))    { half = 'away'; ensure(n).topSeen    = true; continue; }
    if (/^middle of the/i.test(t)) { ensure(n).middleSeen = true; continue; }
    if (/^bottom of the/i.test(t)) { half = 'home'; ensure(n).bottomSeen = true; continue; }
    if (/^end of the/i.test(t))    { ensure(n).endSeen    = true; continue; }
    if (/\bpitches to\b/i.test(t)) { continue; }

    ensure(n)[half].push(play);
  }

  return inningOrder.map(n => {
    const { away: awayPlays, home: homePlays, middleSeen, bottomSeen, endSeen } = inningMap.get(n);
    const away = groupHalf(awayPlays);
    const home = groupHalf(homePlays);
    // 'middle': transition markers seen but no home at-bats have arrived yet
    const state = endSeen                    ? 'end'
                : home.length > 0            ? 'bottom'
                : middleSeen || bottomSeen   ? 'middle'
                :                             'top';
    return { inning: n, away, home, state };
  });
}

/* ── Pitch dot ──────────────────────────────────────────── */
function PitchDot({ text }) {
  const { cls } = classifyPitch(text);
  return <span className={`pitch-dot ${cls}`} title={text} />;
}

/* ── At-bat card — single row ───────────────────────────── */
function AtBatCard({ result, pitches }) {
  const outcome   = result ? (classifyOutcome(result.text) ?? (result.scoringPlay ? { code: 'H', cls: 'outcome--hit' } : null)) : null;
  const batter    = result ? extractBatterName(result.text) : null;
  const isScoring = result?.scoringPlay;
  const isLive    = !result;

  // Drop unclassifiable events with no batter and no pitches
  if (!batter && !outcome && pitches.length === 0) return null;

  return (
    <div className={`pbp-card${isScoring ? ' pbp-card--scoring' : ''}${isLive ? ' pbp-card--live' : ''}`}>
      {batter && <span className="pbp-batter" title={result?.text ?? ''}>{batter}</span>}
      {pitches.length > 0 && (
        <div className="pbp-pitches">
          {pitches.map((p, i) => <PitchDot key={i} text={p.text} />)}
        </div>
      )}
      {outcome
        ? <span className={`pbp-outcome ${outcome.cls}`}>{outcome.code}</span>
        : isLive && pitches.length > 0 && <span className="pbp-outcome outcome--live">…</span>}
      {isScoring && result.awayScore != null && (
        <span className="pbp-score">{result.awayScore}–{result.homeScore}</span>
      )}
    </div>
  );
}

/* ── Inning section ─────────────────────────────────────── */
function HalfColumn({ atBats, label }) {
  return (
    <div className="pbp-half">
      <div className="pbp-half-label">{label}</div>
      <div className="pbp-cards">
        {atBats.map((ab, i) => (
          <AtBatCard key={i} result={ab.result} pitches={ab.pitches} />
        ))}
        {atBats.length === 0 && <div className="pbp-half-empty">—</div>}
      </div>
    </div>
  );
}

const INNING_STATE = {
  top:    { label: '▲ Top',    cls: 'inning-state--top'    },
  middle: { label: '— Mid',    cls: 'inning-state--mid'    },
  bottom: { label: '▼ Bot',    cls: 'inning-state--bottom' },
  end:    { label: '✓ Final',  cls: 'inning-state--end'    },
};

function InningGroup({ inning, away, home, awayAbbr, homeAbbr, state }) {
  const hasRuns   = [...away, ...home].some(ab => ab.result?.scoringPlay);
  const stateInfo = INNING_STATE[state] ?? INNING_STATE.top;
  return (
    <div className="pbp-inning">
      <div className={`pbp-inning-header${hasRuns ? ' pbp-inning-header--scoring' : ''}`}>
        <span>{ordinal(inning)} Inning</span>
        <span className={`pbp-inning-state ${stateInfo.cls}`}>{stateInfo.label}</span>
        {hasRuns && <span className="pbp-inning-dot" />}
      </div>
      <div className="pbp-columns">
        <HalfColumn atBats={away} label={awayAbbr} />
        <div className="pbp-column-divider" />
        <HalfColumn atBats={home} label={homeAbbr} />
      </div>
    </div>
  );
}

/* ── Play-by-play view ──────────────────────────────────── */
function PlayByPlayView({ plays, teams }) {
  const innings   = buildInnings(plays ?? []);
  const awayAbbr  = teams?.find(t => t.homeAway === 'away')?.team?.abbreviation ?? 'Away';
  const homeAbbr  = teams?.find(t => t.homeAway === 'home')?.team?.abbreviation ?? 'Home';
  if (!innings.length) return <div className="detail-empty">No plays yet</div>;
  return (
    <div className="pbp-wrap">
      {[...innings].reverse().map(({ inning, away, home, state }) => (
        <InningGroup
          key={inning}
          inning={inning}
          away={away}
          home={home}
          state={state}
          awayAbbr={awayAbbr}
          homeAbbr={homeAbbr}
        />
      ))}
    </div>
  );
}

/* ── Scoring list (simple) ──────────────────────────────── */
function ScoringList({ plays }) {
  const scoring = plays.filter(p => p.scoringPlay);
  if (!scoring.length) return <div className="detail-empty">No scoring plays yet</div>;
  return (
    <ul className="score-plays">
      {scoring.map((p, i) => (
        <li key={i} className="score-play">
          <span className="score-play-badge">{p.period?.number ?? '?'}</span>
          <span className="score-play-text">{p.text ?? '—'}</span>
          <span className="score-play-score">
            {p.awayScore != null ? `${p.awayScore}–${p.homeScore ?? ''}` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ── Plays section (tabbed) ─────────────────────────────── */
function PlaysSection({ plays, teams, activeTab, onTabChange }) {
  const all = plays ?? [];
  if (!all.length) return null;

  return (
    <>
      <div className="detail-tabs">
        {[['scoring', 'Scoring'], ['pbp', 'Play-by-Play']].map(([key, label]) => (
          <button
            key={key}
            className={`detail-tab${activeTab === key ? ' detail-tab--active' : ''}`}
            onClick={() => onTabChange(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {activeTab === 'scoring'
        ? <ScoringList plays={all} />
        : <PlayByPlayView plays={all} teams={teams} />}
    </>
  );
}

/* ── Pitching decisions ─────────────────────────────────── */
function PitchingDecisions({ players }) {
  const decisions = [];
  players?.forEach(p => {
    p.statistics?.find(s => s.type === 'pitching')?.athletes?.forEach(a => {
      const note = a.notes?.find(n => n.type === 'pitchingDecision');
      if (note) decisions.push({ name: a.athlete?.displayName ?? '—', text: note.text });
    });
  });
  if (!decisions.length) return null;
  return (
    <>
      <div className="detail-section-title">Decision</div>
      <ul className="score-plays">
        {decisions.map((d, i) => {
          const badge = d.text?.startsWith('W') ? 'W' : d.text?.startsWith('L') ? 'L' : 'SV';
          return (
            <li key={i} className="score-play">
              <span className="score-play-badge">{badge}</span>
              <span className="score-play-text">{d.name}</span>
              <span className="score-play-score">{d.text}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ── Player stat table (batting or pitching) ────────────── */
const BATTING_HIGHLIGHT  = new Set(['H', 'HR', 'RBI', 'AVG', 'OBP', 'hits', 'homeRuns', 'RBIs', 'avg', 'onBasePct']);
const PITCHING_HIGHLIGHT = new Set(['IP', 'K', 'ERA', 'fullInnings.partInnings', 'strikeouts']);

function PlayerTable({ statGroup, type, currentBatterId, currentPitcherId }) {
  if (!statGroup) return null;

  const keys     = statGroup.keys ?? [];
  const labels   = statGroup.labels ?? keys;
  const athletes = statGroup.athletes ?? [];
  const totals   = statGroup.totals ?? [];

  if (!athletes.length) return null;

  const highlight = type === 'batting' ? BATTING_HIGHLIGHT : PITCHING_HIGHLIGHT;
  const activeId  = type === 'batting' ? currentBatterId : currentPitcherId;

  return (
    <div className="boxscore-wrap">
      <table className="boxscore-table">
        <thead>
          <tr>
            <th>Name</th>
            {labels.map((l, i) => <th key={i}>{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {athletes.map((a, i) => {
            const isActive = activeId && a.athlete?.id === activeId;
            return (
            <tr key={i} className={isActive ? 'current-player' : ''}>
              <td>{a.athlete?.shortName ?? a.athlete?.displayName ?? '—'}</td>
              {keys.map((k, j) => (
                <td key={j} className={highlight.has(k) ? 'highlight-col' : ''}>
                  {a.stats?.[j] ?? '—'}
                </td>
              ))}
            </tr>
            );
          })}
          {totals.length > 0 && (
            <tr className="totals-row">
              <td>Totals</td>
              {totals.map((v, j) => (
                <td key={j} className={highlight.has(keys[j]) ? 'highlight-col' : ''}>
                  {v || '—'}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Team box score (batters + pitchers) ────────────────── */
function TeamBoxScore({ playerEntry, currentBatterId, currentPitcherId }) {
  if (!playerEntry) return null;

  // Real ESPN uses s.type; mock data used s.name — support both
  const batting  = playerEntry.statistics?.find(s => (s.type ?? s.name) === 'batting');
  const pitching = playerEntry.statistics?.find(s => (s.type ?? s.name) === 'pitching');

  return (
    <>
      {batting && (
        <>
          <div className="detail-section-title">Batting</div>
          <PlayerTable statGroup={batting} type="batting" currentBatterId={currentBatterId} />
        </>
      )}
      {pitching && (
        <>
          <div className="detail-section-title">Pitching</div>
          <PlayerTable statGroup={pitching} type="pitching" currentPitcherId={currentPitcherId} />
        </>
      )}
    </>
  );
}

/* ── Tabbed box score ───────────────────────────────────── */
function BoxScore({ players, teams, currentBatterId, currentPitcherId }) {
  const [activeTab, setActiveTab] = useState('away');

  const resolved = resolveHomeAway(players, teams);
  if (!resolved.length) return null;

  const away = resolved.find(p => p.homeAway === 'away');
  const home = resolved.find(p => p.homeAway === 'home');

  if (!away && !home) return null;

  const awayAbbr = away?.team?.abbreviation ?? teams?.find(t => t.homeAway === 'away')?.team?.abbreviation ?? 'AWY';
  const homeAbbr = home?.team?.abbreviation ?? teams?.find(t => t.homeAway === 'home')?.team?.abbreviation ?? 'HME';

  const tabs = [
    { key: 'away', label: awayAbbr, entry: away },
    { key: 'home', label: homeAbbr, entry: home },
  ].filter(t => t.entry);

  return (
    <>
      <div className="detail-section-title">Box Score</div>
      <div className="detail-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`detail-tab${activeTab === t.key ? ' detail-tab--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <TeamBoxScore
        playerEntry={tabs.find(t => t.key === activeTab)?.entry}
        currentBatterId={currentBatterId}
        currentPitcherId={currentPitcherId}
      />
    </>
  );
}

/* ── Root component ─────────────────────────────────────── */
const BaseballDetailContent = ({ data, game }) => {
  const players          = data?.boxscore?.players ?? [];
  const teams            = data?.boxscore?.teams   ?? [];
  const currentBatterId  = game?.situation?.currentBatter?.id ?? null;
  const currentPitcherId = game?.situation?.currentPitcher?.id ?? null;

  const [tabState, setTabState] = useState({ gameId: game?.id, tab: 'scoring' });
  const activeTab = tabState.gameId === game?.id ? tabState.tab : 'scoring';
  const handleTabChange = (tab) => setTabState({ gameId: game?.id, tab });

  return (
    <>
      <PlaysSection plays={data?.plays} teams={teams} activeTab={activeTab} onTabChange={handleTabChange} />
      <PitchingDecisions players={players} />
      <BoxScore
        players={players}
        teams={teams}
        currentBatterId={currentBatterId}
        currentPitcherId={currentPitcherId}
      />
    </>
  );
};

export default BaseballDetailContent;
