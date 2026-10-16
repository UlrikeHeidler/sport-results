/**
 * Normalize an ESPN game summary/boxscore into the data used by game tiles.
 */
export const normalizeGameSummary = raw => {
  if (!raw) return null;

  const source = raw.boxscore || raw.gamepackageJSON?.boxscore || raw.boxScore || raw;
  const teamsArray = source?.teams || (Array.isArray(source) ? source : null);

  const normalizeTeam = teamRaw => {
    if (!teamRaw) return null;

    const goalies = teamRaw.goalies ||
      (teamRaw.players
        ? teamRaw.players.filter(player => player.position?.abbreviation === 'G')
        : null) ||
      [];
    const goalie = goalies[0] || teamRaw.goalie || null;
    const name = goalie?.person?.fullName || goalie?.name ||
      goalie?.playerName || goalie?.person?.displayName || null;
    const saves = goalie?.stats?.saves ?? goalie?.saves ?? goalie?.statistics?.saves ?? null;
    const shots = goalie?.stats?.shotsAgainst ?? goalie?.shotsAgainst ??
      goalie?.statistics?.shotsAgainst ?? goalie?.statistics?.shots ?? null;

    return {
      id: teamRaw.team?.id || teamRaw.teamId || teamRaw.id || null,
      name: teamRaw.team?.displayName || teamRaw.team?.name || teamRaw.team?.shortName || null,
      goalie: name ? { name, saves, shots } : null,
      emptyNet: !!teamRaw.emptyNet || !!teamRaw.isEmptyNet || !!teamRaw.goaliePulled
    };
  };

  const normalizePowerPlay = () => {
    const plays = Array.isArray(raw.plays) ? raw.plays : [];
    const latestPlay = plays[plays.length - 1];
    const strength = latestPlay?.strength || {};
    const strengthId = String(strength.id ?? '');
    const strengthName = String(strength.abbreviation || strength.text || '')
      .toLowerCase()
      .replace(/[\s_]+/g, '-');
    const isPowerPlay = strengthId === '702' || strengthName === 'power-play';
    const isShortHanded = strengthId === '703' || strengthName === 'short-handed';
    const playTeamId = latestPlay?.team?.id;

    if ((!isPowerPlay && !isShortHanded) || playTeamId == null) {
      return { powerPlay: false, powerPlayTeamId: null, powerPlayTeam: null };
    }

    const competitors = raw.header?.competitions?.[0]?.competitors || [];
    const powerPlayTeam = competitors.find(competitor => {
      const competitorId = String(competitor.id ?? competitor.team?.id ?? '');
      return isPowerPlay
        ? competitorId === String(playTeamId)
        : competitorId !== String(playTeamId);
    });

    return {
      powerPlay: Boolean(powerPlayTeam),
      powerPlayTeamId: powerPlayTeam?.id ?? null,
      powerPlayTeam: powerPlayTeam?.team?.displayName || powerPlayTeam?.team?.name || null
    };
  };

  const withPowerPlay = teams => ({ teams, situation: normalizePowerPlay() });

  if (Array.isArray(teamsArray) && teamsArray.length >= 2) {
    return withPowerPlay({
      home: normalizeTeam(teamsArray[0]),
      away: normalizeTeam(teamsArray[1])
    });
  }

  if (source?.teams && (source.teams.home || source.teams.away)) {
    return withPowerPlay({
      home: normalizeTeam(source.teams.home),
      away: normalizeTeam(source.teams.away)
    });
  }

  if (source?.teamsById) {
    const ids = Object.keys(source.teamsById);
    return withPowerPlay({
      home: normalizeTeam(source.teamsById[ids[0]]),
      away: normalizeTeam(source.teamsById[ids[1]])
    });
  }

  return null;
};
