import React, { useState } from 'react';
import './DetailContent.css';

/* ── Helpers ────────────────────────────────────────────── */

// homeAway is on boxscore.teams[], not on boxscore.players[]; match by team id
function resolveHomeAway(players, teams) {
  const idToHomeAway = {};
  teams?.forEach(t => { if (t.team?.id) idToHomeAway[t.team.id] = t.homeAway; });
  return (players ?? []).map(p => ({ ...p, homeAway: idToHomeAway[p.team?.id] ?? p.homeAway }));
}

/* ── Scoring plays ──────────────────────────────────────── */
function ScoringPlays({ plays }) {
  const scoring = (plays ?? []).filter(p => p.scoringPlay);
  if (!scoring.length) return null;
  return (
    <>
      <div className="detail-section-title">Scoring</div>
      <ul className="score-plays">
        {scoring.map((p, i) => (
          <li key={i} className="score-play">
            <span className="score-play-badge">
              {p.period?.number ? `${p.period.number}` : '?'}
            </span>
            <span className="score-play-text">{p.text ?? '—'}</span>
            <span className="score-play-score">
              {p.awayScore ?? ''}–{p.homeScore ?? ''}
            </span>
          </li>
        ))}
      </ul>
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

function PlayerTable({ statGroup, type }) {
  if (!statGroup) return null;

  const keys     = statGroup.keys ?? [];
  const labels   = statGroup.labels ?? keys;
  const athletes = statGroup.athletes ?? [];
  const totals   = statGroup.totals ?? [];

  if (!athletes.length) return null;

  const highlight = type === 'batting' ? BATTING_HIGHLIGHT : PITCHING_HIGHLIGHT;

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
          {athletes.map((a, i) => (
            <tr key={i}>
              <td>{a.athlete?.shortName ?? a.athlete?.displayName ?? '—'}</td>
              {keys.map((k, j) => (
                <td key={j} className={highlight.has(k) ? 'highlight-col' : ''}>
                  {a.stats?.[j] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
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
function TeamBoxScore({ playerEntry }) {
  if (!playerEntry) return null;

  // Real ESPN uses s.type; mock data used s.name — support both
  const batting  = playerEntry.statistics?.find(s => (s.type ?? s.name) === 'batting');
  const pitching = playerEntry.statistics?.find(s => (s.type ?? s.name) === 'pitching');

  return (
    <>
      {batting && (
        <>
          <div className="detail-section-title">Batting</div>
          <PlayerTable statGroup={batting} type="batting" />
        </>
      )}
      {pitching && (
        <>
          <div className="detail-section-title">Pitching</div>
          <PlayerTable statGroup={pitching} type="pitching" />
        </>
      )}
    </>
  );
}

/* ── Tabbed box score ───────────────────────────────────── */
function BoxScore({ players, teams }) {
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
      <TeamBoxScore playerEntry={tabs.find(t => t.key === activeTab)?.entry} />
    </>
  );
}

/* ── Root component ─────────────────────────────────────── */
const BaseballDetailContent = ({ data }) => {
  const players = data?.boxscore?.players ?? [];
  const teams   = data?.boxscore?.teams   ?? [];

  return (
    <>
      <ScoringPlays plays={data?.plays} />
      <PitchingDecisions players={players} />
      <BoxScore players={players} teams={teams} />
    </>
  );
};

export default BaseballDetailContent;
