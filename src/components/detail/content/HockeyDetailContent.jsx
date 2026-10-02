import React, { useState, useEffect, useRef } from 'react';
import { isGameOngoing, isGameFinal } from '../../../config/constants';
import { HockeyRink, PlayList, classifyPlay, MARKER_CFG, PERIOD_LABEL, getPlayTeamLogo, TeamLogo } from './HockeyRink';
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

const HockeyDetailContent = ({ data, game }) => {
  const plays = data?.plays ?? data?.gamepackageJSON?.plays ?? [];

  // Use status from the fetched detail data when available — it's fresher than the tile's game.status
  const detailStatusType = data?.header?.competitions?.[0]?.status?.type?.name
    ?? data?.header?.competitions?.[0]?.status?.type?.state;
  const isLive = detailStatusType
    ? detailStatusType === 'in' || detailStatusType === 'STATUS_IN_PROGRESS' || detailStatusType === 'inprogress'
    : isGameOngoing(game?.status);
  const isFinal = detailStatusType
    ? detailStatusType === 'post' || detailStatusType === 'STATUS_FINAL' || detailStatusType.startsWith('final')
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
      </div>

      <div className="hockey-tab-content">
        {activeTab === 'plays'
          ? <PlayList plays={plays} game={game} />
          : <GoalsList plays={plays.length ? plays : data?.scoringPlays} game={game} />
        }
      </div>
    </>
  );
};

export default HockeyDetailContent;
