import React, { useState, useEffect, useRef, useMemo } from 'react';
import { isGameOngoing, isGameFinal, STATUS_TYPES } from '../../../config/constants';
import {
  BasketballCourt, PlayList, ScoringList,
  PERIOD_LABEL, getPlayTeamLogo, TeamLogo,
} from './BasketballCourt';
import { LastPlay, resolveTeamLogo } from './LastPlay';
import './DetailContent.css';
import './BasketballCourt.css';

// ── Line score ────────────────────────────────────────────────────────────────

function LineScore({ scoring, teams }) {
  if (!scoring?.length) return null;

  const periods = [...new Set(scoring.map(s => s.period?.number).filter(Boolean))];
  const maxPeriod = Math.max(...periods, 4);
  const cols = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  let prevHome = 0, prevAway = 0;
  const homeByPeriod = {}, awayByPeriod = {};
  [...scoring]
    .sort((a, b) => (a.period?.number ?? 0) - (b.period?.number ?? 0))
    .forEach(s => {
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
            {cols.map(p => <th key={p}>{PERIOD_LABEL(p)}</th>)}
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

// ── Team stats ────────────────────────────────────────────────────────────────

const TEAM_STAT_KEYS = [
  { names: ['fieldGoalsMade-fieldGoalsAttempted'],                    label: 'FG'        },
  { names: ['fieldGoalPct'],                                          label: 'FG%'       },
  { names: ['threePointFieldGoalsMade-threePointFieldGoalsAttempted'], label: '3PT'       },
  { names: ['threePointFieldGoalPct'],                                label: '3PT%'      },
  { names: ['freeThrowsMade-freeThrowsAttempted'],                    label: 'FT'        },
  { names: ['freeThrowPct'],                                          label: 'FT%'       },
  { names: ['totalRebounds', 'reboundsTotal'],                        label: 'REB'       },
  { names: ['assists'],                                               label: 'AST'       },
  { names: ['turnovers'],                                             label: 'TO'        },
  { names: ['steals'],                                                label: 'STL'       },
  { names: ['blocks'],                                                label: 'BLK'       },
  { names: ['fouls'],                                                 label: 'PF'        },
  { names: ['fastBreakPoints'],                                       label: 'Fast Break' },
  { names: ['pointsInPaint'],                                         label: 'Paint Pts' },
];

function TeamStats({ teams }) {
  if (!teams?.length) return null;
  const away = teams.find(t => t.homeAway === 'away');
  const home = teams.find(t => t.homeAway === 'home');
  if (!away || !home) return null;

  const statVal = (team, ...names) => {
    for (const name of names) {
      const s = team.statistics?.find(s => s.name === name);
      if (s?.displayValue !== undefined) return s.displayValue;
    }
    return null;
  };

  const rows = TEAM_STAT_KEYS
    .map(({ names, label }) => ({
      label,
      a: statVal(away, ...names),
      h: statVal(home, ...names),
    }))
    .filter(r => r.a !== null || r.h !== null);

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
            <span className="stat-row-away">{r.a ?? '—'}</span>
            <span className="stat-row-label">{r.label}</span>
            <span className="stat-row-home">{r.h ?? '—'}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Player box score ──────────────────────────────────────────────────────────

const PLAYER_COLS = [
  { key: 'minutes',                                                label: 'MIN' },
  { key: 'points',                                                 label: 'PTS' },
  { key: 'fieldGoalsMade-fieldGoalsAttempted',                     label: 'FG'  },
  { key: 'threePointFieldGoalsMade-threePointFieldGoalsAttempted', label: '3PT' },
  { key: 'freeThrowsMade-freeThrowsAttempted',                     label: 'FT'  },
  { key: 'rebounds',                                               label: 'REB' },
  { key: 'assists',                                                label: 'AST' },
  { key: 'steals',                                                 label: 'STL' },
  { key: 'blocks',                                                 label: 'BLK' },
  { key: 'turnovers',                                              label: 'TO'  },
];

function TeamTable({ group, teams, gi }) {
  const stats = group.statistics?.[0];
  if (!stats) return null;

  const { keys = [], athletes = [] } = stats;
  const cols = PLAYER_COLS
    .map(c => ({ ...c, idx: keys.indexOf(c.key) }))
    .filter(c => c.idx !== -1);

  if (!cols.length || !athletes.length) return null;

  const teamId  = String(group.team?.id ?? '');
  const teamObj = teams?.find(t => String(t.team?.id) === teamId);
  const abbr    = group.team?.abbreviation ?? teamObj?.team?.abbreviation ?? `Team ${gi + 1}`;
  const homeAway = teamObj?.homeAway ?? (gi === 0 ? 'home' : 'away');

  const starters = athletes.filter(a => a.starter  && !a.didNotPlay);
  const bench    = athletes.filter(a => !a.starter && !a.didNotPlay);
  const dnp      = athletes.filter(a => a.didNotPlay);

  return (
    <div className="bball-boxscore-team">
      <div className="bball-boxscore-teamname">{abbr} <span className="bball-ha-tag">{homeAway}</span></div>
      <table className="bball-boxscore-table">
        <thead>
          <tr>
            <th className="player-col">Player</th>
            {cols.map(c => <th key={c.key}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {starters.map((a, i) => (
            <tr key={a.athlete?.id ?? i}>
              <td className="player-col starter">
                {a.athlete?.shortName ?? a.athlete?.displayName ?? '—'}
              </td>
              {cols.map(c => <td key={c.key}>{a.stats?.[c.idx] ?? '—'}</td>)}
            </tr>
          ))}
          {bench.length > 0 && (
            <tr className="bball-bench-divider">
              <td colSpan={cols.length + 1}>Bench</td>
            </tr>
          )}
          {bench.map((a, i) => (
            <tr key={a.athlete?.id ?? `b${i}`}>
              <td className="player-col">
                {a.athlete?.shortName ?? a.athlete?.displayName ?? '—'}
              </td>
              {cols.map(c => <td key={c.key}>{a.stats?.[c.idx] ?? '—'}</td>)}
            </tr>
          ))}
          {dnp.map((a, i) => (
            <tr key={a.athlete?.id ?? `d${i}`}>
              <td className="player-col dnp">
                {a.athlete?.shortName ?? a.athlete?.displayName ?? '—'}
              </td>
              <td className="dnp-msg" colSpan={cols.length}>{a.reason ?? 'DNP'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlayerBoxScore({ playerGroups, teams, side }) {
  if (!playerGroups?.length) return null;

  const group = playerGroups.find(g => {
    const tid = String(g.team?.id ?? '');
    const t = teams?.find(t => String(t.team?.id) === tid);
    return t?.homeAway === side;
  }) ?? (side === 'away' ? playerGroups[0] : playerGroups[1]);

  if (!group) return null;
  return (
    <div className="bball-boxscore">
      <TeamTable group={group} teams={teams} gi={side === 'away' ? 0 : 1} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const BasketballDetailContent = ({ data, game }) => {
  const plays = data?.plays ?? [];

  const detailComp     = data?.header?.competitions?.[0];
  const detailState    = detailComp?.status?.type?.state;
  const detailStatusName = detailComp?.status?.type?.name;

  const isLive = detailState
    ? detailState === 'in'
    : detailStatusName
      ? STATUS_TYPES.ONGOING.has(detailStatusName)
      : isGameOngoing(game?.status);

  const isFinal = detailState
    ? detailState === 'post'
    : detailStatusName
      ? detailStatusName.startsWith('STATUS_FINAL') || detailComp?.status?.type?.completed === true
      : isGameFinal(game?.status);

  const [activeTab, setActiveTab] = useState(() => isLive ? 'plays' : 'scoring');
  const userSwitched = useRef(false);

  useEffect(() => {
    if (isFinal && !userSwitched.current) {
      setActiveTab('scoring');
    }
  }, [isFinal]);

  const handleTab = (tab) => {
    userSwitched.current = true;
    setActiveTab(tab);
  };

  const lastPlay = useMemo(() =>
    [...plays].reverse().find(p => p.text) ?? null,
  [plays]);
  const lastPlayLogo = resolveTeamLogo(lastPlay, game);
  const lastPlayTime = lastPlay
    ? `${PERIOD_LABEL(lastPlay.period?.number ?? 1)} ${lastPlay.clock?.displayValue ?? ''}`.trim()
    : null;

  return (
    <>
      {isLive && <LastPlay logo={lastPlayLogo} time={lastPlayTime} text={lastPlay?.text} />}

      <LineScore scoring={data?.scoring} teams={data?.boxscore?.teams} />

      <BasketballCourt plays={plays} isLive={isLive} game={game} />

      {/* Tabs */}
      <div className="hockey-tabs">
        <button className={`hockey-tab${activeTab === 'plays'     ? ' active' : ''}`} onClick={() => handleTab('plays')}>Play by Play</button>
        <button className={`hockey-tab${activeTab === 'scoring'   ? ' active' : ''}`} onClick={() => handleTab('scoring')}>Scoring</button>
        <button className={`hockey-tab${activeTab === 'box-away'  ? ' active' : ''}`} onClick={() => handleTab('box-away')}>
          Box Score {game?.awayTeam?.abbreviation ?? 'Away'}
        </button>
        <button className={`hockey-tab${activeTab === 'box-home'  ? ' active' : ''}`} onClick={() => handleTab('box-home')}>
          Box Score {game?.homeTeam?.abbreviation ?? 'Home'}
        </button>
        <button className={`hockey-tab${activeTab === 'teamstats' ? ' active' : ''}`} onClick={() => handleTab('teamstats')}>Team Stats</button>
      </div>

      <div className="hockey-tab-content">
        {activeTab === 'plays'     && <PlayList plays={plays} game={game} />}
        {activeTab === 'scoring'   && <ScoringList plays={plays} game={game} />}
        {activeTab === 'box-away'  && <PlayerBoxScore playerGroups={data?.boxscore?.players} teams={data?.boxscore?.teams} side="away" />}
        {activeTab === 'box-home'  && <PlayerBoxScore playerGroups={data?.boxscore?.players} teams={data?.boxscore?.teams} side="home" />}
        {activeTab === 'teamstats' && <TeamStats teams={data?.boxscore?.teams} />}
      </div>
    </>
  );
};

export default BasketballDetailContent;
