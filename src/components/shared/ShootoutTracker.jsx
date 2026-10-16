import React from 'react';
import './ShootoutTracker.css';

export function getShootoutAttempts(plays = [], game) {
  return plays.flatMap(play => {
    const period = play.period;
    if (period?.number !== 5 && period?.displayValue?.toUpperCase() !== 'SO') return [];

    const type = String(play.type?.text ?? '').toLowerCase();
    const isGoal = play.scoringPlay || type === 'goal' || Number(play.scoreValue) > 0;
    const isAttempt = isGoal || type === 'shot' || type.includes('missed') || type.includes('failed shot attempt');
    if (!isAttempt) return [];

    const teamId = String(play.team?.id ?? '');
    const homeAway = play.team?.homeAway;
    const team = homeAway === 'home' || teamId === String(game?.homeTeam?.id)
      ? 'home'
      : homeAway === 'away' || teamId === String(game?.awayTeam?.id)
        ? 'away'
        : null;

    return [{ play, result: isGoal ? 'goal' : 'miss', team }];
  });
}

export function isShootoutInProgress(game, summaryHeader) {
  const summaryStatus = summaryHeader?.competitions?.[0]?.status;
  const gameStatus = game?.status ?? {};
  const statusType = summaryStatus?.type ?? {};
  if (gameStatus.completed || String(gameStatus.type ?? '').startsWith('STATUS_FINAL')) return false;

  const isLive = statusType.state
    ? statusType.state === 'in'
    : gameStatus.state
      ? gameStatus.state === 'in'
      : statusType.name
        ? statusType.name === 'STATUS_IN_PROGRESS'
        : gameStatus.type === 'STATUS_IN_PROGRESS';
  if (!isLive) return false;

  const detail = [
    statusType.detail,
    statusType.shortDetail,
    statusType.altDetail,
    gameStatus.shortDetail,
    gameStatus.altDetail,
  ].filter(Boolean).join(' ').toUpperCase();
  return Number(summaryStatus?.period ?? gameStatus.period) === 5 || /\bSO\b|SHOOTOUT/.test(detail);
}

export function ShootoutTracker({ plays = [], game, compact = false }) {
  const attempts = getShootoutAttempts(plays, game);
  if (!attempts.length) return null;

  const teams = [
    { side: 'away', team: game?.awayTeam },
    { side: 'home', team: game?.homeTeam },
  ];
  const unassigned = attempts.filter(attempt => !attempt.team);

  return (
    <div className={`shootout-tracker${compact ? ' shootout-tracker-compact' : ''}`} role="group" aria-label="Shootout results">
      <span className="shootout-tracker-title">Shootout</span>
      {teams.map(({ side, team }) => {
        const teamAttempts = attempts.filter(attempt => attempt.team === side);
        if (!teamAttempts.length) return null;
        const goals = teamAttempts.filter(attempt => attempt.result === 'goal').length;
        const abbreviation = team?.abbreviation ?? side.toUpperCase();
        return (
          <span className="shootout-team" key={side} aria-label={`${abbreviation}: ${goals} goals from ${teamAttempts.length} attempts`}>
            <span className="shootout-team-name">{abbreviation}</span>
            <span className="shootout-team-attempts">
              {teamAttempts.map(({ play, result }, index) => (
                <span
                  className={`shootout-attempt shootout-attempt-${result}`}
                  key={play.id ?? index}
                  aria-label={`${result === 'goal' ? 'Goal' : 'No goal'}${play.text ? `: ${play.text}` : ''}`}
                  title={play.text || (result === 'goal' ? 'Goal' : 'No goal')}
                >
                  {result === 'goal' ? '✓' : '✕'}
                </span>
              ))}
            </span>
            <span className="shootout-team-score">{goals}/{teamAttempts.length}</span>
          </span>
        );
      })}
      {unassigned.length > 0 && (
        <span className="shootout-team" aria-label={`${unassigned.length} unassigned shootout attempts`}>
          <span className="shootout-team-name">?</span>
          <span className="shootout-team-attempts">
            {unassigned.map(({ play, result }, index) => (
              <span
                className={`shootout-attempt shootout-attempt-${result}`}
                key={play.id ?? index}
                aria-label={`Unassigned ${result === 'goal' ? 'goal' : 'attempt'}${play.text ? `: ${play.text}` : ''}`}
                title={play.text || 'Team not identified'}
              >
                {result === 'goal' ? '✓' : '✕'}
              </span>
            ))}
          </span>
        </span>
      )}
    </div>
  );
}
