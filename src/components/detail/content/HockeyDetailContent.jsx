import React, { useState, useEffect, useRef, useMemo } from 'react';
import { isGameOngoing, isGameFinal, STATUS_TYPES } from '../../../config/constants';
import { HockeyRink, PlayList, classifyPlay, MARKER_CFG, PERIOD_LABEL, getPlayTeamLogo, TeamLogo } from './HockeyRink';
import { LastPlay, resolveTeamLogo } from './LastPlay';
import './DetailContent.css';
import './HockeyTabs.css';

function LineScore({ scoring, teams }) {
  if (!scoring?.length) return null;

  const periods = [...new Set(scoring.map(s => s.period?.number).filter(Boolean))];
  const maxPeriod = Math.max(...periods, 3);
  const cols = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  const away = teams?.find(t => t.homeAway === 'away');
  const home = teams?.find(t => t.homeAway === 'home');

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

function GoalsList({ plays, game }) {
  const goals = plays?.filter(p => p.scoringPlay) ?? [];
  if (!goals.length) return <div className="hockey-empty-tab">No goals recorded yet.</div>;

  return (
    <ul className="hockey-plays">
      {goals.map((g, i) => {
        const kind = classifyPlay(g);
        const { color } = MARKER_CFG[kind] ?? MARKER_CFG.goal;
        const logo = getPlayTeamLogo(g, game);
        const time = [
          PERIOD_LABEL(g.period?.number ?? 1),
          g.clock?.displayValue,
        ].filter(Boolean).join(' ');
        return (
          <li key={i} className="hockey-play is-goal">
            <span className="hockey-play-dot" style={{ background: color }} />
            <span className="hockey-play-time">{time}</span>
            <TeamLogo logo={logo} size={14} />
            <span className="hockey-play-body">
              <span className="hockey-play-type">Goal</span>
              <span className="hockey-play-desc">
                {g.text ?? g.participants?.map(p => p.athlete?.shortName).join(', ') ?? '—'}
              </span>
            </span>
            <span className="hockey-goal-score">{g.awayScore ?? ''}–{g.homeScore ?? ''}</span>
          </li>
        );
      })}
    </ul>
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

const SKATER_STAT_COLUMNS = [
  { key: 'goals', label: 'G', title: 'Goals' },
  { key: 'assists', label: 'A', title: 'Assists' },
  { key: 'plusMinus', label: '+/-', title: 'Plus/minus' },
  { key: 'hits', label: 'HT', title: 'Hits' },
  { key: 'shotsTotal', label: 'S', title: 'Shots' },
  { key: 'timeOnIce', label: 'TOI', title: 'Time on ice' },
];

const GOALIE_STAT_COLUMNS = [
  { key: 'saves', label: 'SV', title: 'Saves' },
  { key: 'shotsAgainst', label: 'SA', title: 'Shots against' },
  { key: 'goalsAgainst', label: 'GA', title: 'Goals against' },
  { key: 'savePct', label: 'SV%', title: 'Save percentage' },
  { key: 'timeOnIce', label: 'TOI', title: 'Time on ice' },
];

function getPlayerStatValue(player, group, key) {
  const index = group.keys?.indexOf(key) ?? -1;
  if (index < 0) return '—';

  const rawValue = player.stats?.[index];
  const value = rawValue && typeof rawValue === 'object'
    ? rawValue.displayValue ?? rawValue.value
    : rawValue;
  if (value === undefined || value === null || value === '') return '—';

  if (key === 'savePct') {
    const percentage = Number.parseFloat(value);
    if (Number.isFinite(percentage) && percentage <= 1) return `${(percentage * 100).toFixed(1)}%`;
  }
  return value;
}

function PlayerStatGroup({ title, group, columns }) {
  const athletes = group?.athletes ?? [];
  if (!athletes.length) return null;

  return (
    <section className="hockey-player-stat-group">
      <h3 className="hockey-player-stat-title">{title}</h3>
      <div className="hockey-player-table-wrap">
        <table className="hockey-player-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Player</th>
              {columns.map(column => (
                <th scope="col" key={column.key} title={column.title}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {athletes.map((player, index) => {
              const athlete = player.athlete ?? {};
              return (
                <tr key={athlete.id ?? `${athlete.jersey}-${index}`}>
                  <td>{athlete.jersey ?? player.jersey ?? '—'}</td>
                  <td>{athlete.displayName ?? athlete.fullName ?? 'Unknown player'}</td>
                  {columns.map(column => (
                    <td key={column.key}>{getPlayerStatValue(player, group, column.key)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlayerStats({ statistics }) {
  const groups = statistics ?? [];
  const goalies = groups.find(group => /goal/i.test(group.name ?? ''));
  const defense = groups.find(group => /defen/i.test(group.name ?? ''));
  const forwards = groups.find(group => /forward/i.test(group.name ?? '') && group.athletes?.length)
    ?? groups.find(group => group.name === 'skaters' && group.athletes?.length);
  const hasStats = [goalies, defense, forwards].some(group => group?.athletes?.length);

  if (!hasStats) return <div className="hockey-empty-tab">Player statistics unavailable.</div>;

  return (
    <div className="hockey-player-stat-groups">
      <PlayerStatGroup title="Goalies" group={goalies} columns={GOALIE_STAT_COLUMNS} />
      <PlayerStatGroup title="Defense" group={defense} columns={SKATER_STAT_COLUMNS} />
      <PlayerStatGroup title="Offense" group={forwards} columns={SKATER_STAT_COLUMNS} />
    </div>
  );
}

const HockeyDetailContent = ({ data, game }) => {
  const plays = data?.plays ?? data?.gamepackageJSON?.plays ?? [];
  const playerGroups = data?.boxscore?.players ?? [];
  const teamEntries = [...(data?.boxscore?.teams ?? [])].sort((a, b) =>
    (a.homeAway === 'away' ? 0 : 1) - (b.homeAway === 'away' ? 0 : 1)
  );
  const teamsForPlayerTabs = teamEntries.length
    ? teamEntries
    : playerGroups.map(group => ({ team: group.team, homeAway: group.homeAway }));
  const playerTabs = teamsForPlayerTabs.map((entry, index) => {
    const team = entry.team ?? entry;
    const playerGroup = playerGroups.find(group => String(group.team?.id) === String(team.id));
    const side = entry.homeAway ?? playerGroup?.homeAway;
    return {
      key: `player-stats-${side ?? team.id ?? index}`,
      label: team.abbreviation ?? team.shortDisplayName ?? team.displayName ?? `Team ${index + 1}`,
      teamName: team.displayName ?? team.name ?? team.abbreviation ?? 'Team',
      playerGroup,
    };
  });

  const lastPlay = useMemo(() =>
    [...plays].reverse().find(p => p.text) ?? null,
  [plays]);
  const lastPlayLogo = resolveTeamLogo(lastPlay, game);
  const lastPlayTime = lastPlay
    ? `${PERIOD_LABEL(lastPlay.period?.number ?? 1)} ${lastPlay.clock?.displayValue ?? ''}`.trim()
    : null;


  // Use status from the fetched detail data when available — it's fresher than the tile's game.status
  // Prefer state ('pre'/'in'/'post') over name ('STATUS_IN_PROGRESS', 'STATUS_INTERMISSION', etc.)
  // because name varies and can miss live states like intermissions and end-of-period.
  const detailComp = data?.header?.competitions?.[0];
  const detailState = detailComp?.status?.type?.state;
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

  // Default: play-by-play during live games, goals once finished
  const [activeTab, setActiveTab] = useState(() => isLive ? 'plays' : 'goals');
  // Track whether user has manually changed the tab so auto-switch doesn't override it
  const userSwitchedTab = useRef(false);

  // Auto-switch to Goals when game transitions live → final (unless user already switched)
  useEffect(() => {
    if (isFinal && !userSwitchedTab.current) {
      setActiveTab('goals');
    }
  }, [isFinal]);

  const handleTabChange = (tab) => {
    userSwitchedTab.current = true;
    setActiveTab(tab);
  };

  return (
    <>
      {isLive && <LastPlay logo={lastPlayLogo} time={lastPlayTime} text={lastPlay?.text} />}
      <HockeyRink plays={plays} isLive={isLive} game={game} />
      <LineScore scoring={data?.scoringPlays} teams={data?.boxscore?.teams} />
      <Shots teams={data?.boxscore?.teams} />

      {/* Tabs */}
      <div className="hockey-tabs">
        <button
          className={`hockey-tab${activeTab === 'plays' ? ' active' : ''}`}
          onClick={() => handleTabChange('plays')}
        >
          Play by Play
        </button>
        <button
          className={`hockey-tab${activeTab === 'goals' ? ' active' : ''}`}
          onClick={() => handleTabChange('goals')}
        >
          Goals
        </button>
        {playerTabs.map(tab => (
          <button
            className={`hockey-tab${activeTab === tab.key ? ' active' : ''}`}
            key={tab.key}
            title={`${tab.teamName} player stats`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="hockey-tab-content">
        {activeTab === 'plays'
          ? <PlayList plays={plays} game={game} />
          : activeTab === 'goals'
            ? <GoalsList plays={plays.length ? plays : data?.scoringPlays} game={game} />
            : <PlayerStats statistics={playerTabs.find(tab => tab.key === activeTab)?.playerGroup?.statistics} />
        }
      </div>
    </>
  );
};

export default HockeyDetailContent;
