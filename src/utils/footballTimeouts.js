const REGULATION_TIMEOUTS = 3;

/** Derive each team's remaining timeouts from ESPN's play-by-play events. */
export function getFootballTimeoutsRemaining(summary, game) {
  const competition = summary?.header?.competitions?.[0];
  const state = competition?.status?.type?.state;
  const period = Number(competition?.status?.period ?? game?.status?.period ?? 0);
  const plays = summary?.plays ?? summary?.gamepackageJSON?.plays;

  if (state === 'pre' || period === 0) {
    return { home: REGULATION_TIMEOUTS, away: REGULATION_TIMEOUTS };
  }
  if (!Array.isArray(plays)) return null;

  const isOvertime = period > 4;
  const firstPeriod = isOvertime ? 5 : period > 2 ? 3 : 1;
  const timeoutLimit = isOvertime
    ? ((game?.league || '').toLowerCase() === 'nfl' ? 2 : 1)
    : REGULATION_TIMEOUTS;
  const homeId = game?.homeTeam?.id ?? game?.teams?.home?.id;
  const awayId = game?.awayTeam?.id ?? game?.teams?.away?.id;
  const used = { home: 0, away: 0 };

  for (const play of plays) {
    if (String(play?.type?.text ?? '').toLowerCase() !== 'timeout') continue;

    const playPeriod = Number(play.period?.number ?? 0);
    if (playPeriod < firstPeriod || playPeriod > period) continue;

    const caller = play.teamParticipants?.find(participant => participant.timeout === true);
    const teamId = caller?.id ?? caller?.team?.id;
    if (teamId == null) continue;

    if (String(teamId) === String(homeId)) used.home += 1;
    else if (String(teamId) === String(awayId)) used.away += 1;
  }

  return {
    home: Math.max(0, timeoutLimit - used.home),
    away: Math.max(0, timeoutLimit - used.away)
  };
}