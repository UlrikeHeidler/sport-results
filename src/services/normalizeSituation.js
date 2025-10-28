// Per-sport situation normalization helper
import { detectPossession } from './sportsApi-fixed';

/**
 * Normalize situation object for a given league
 * @param {string} league - League identifier
 * @param {Object} situation - Raw situation object from ESPN API
 * @param {Object} competition - Competition object
 * @param {Object} homeTeam - Home team object
 * @param {Object} awayTeam - Away team object
 * @returns {Object|null} Normalized situation or null if not available
 */
export function normalizeSituation(league, situation, competition, homeTeam, awayTeam) {
  if (!situation || Object.keys(situation).length === 0) return null;
  const ln = String(league).toLowerCase();

  // Football (college / nfl family)
  if (ln.includes('football')) {
    const homeTeamInfo = {
      id: homeTeam.id,
      abbreviation: homeTeam.team.abbreviation,
      name: homeTeam.team.displayName || homeTeam.team.name,
      displayName: homeTeam.team.displayName || homeTeam.team.name
    };
    const awayTeamInfo = {
      id: awayTeam.id,
      abbreviation: awayTeam.team.abbreviation,
      name: awayTeam.team.displayName || awayTeam.team.name,
      displayName: awayTeam.team.displayName || awayTeam.team.name
    };
    const poss = detectPossession(competition, homeTeamInfo, awayTeamInfo);
    return {
      down: situation.down,
      distance: situation.distance,
      yardLine: situation.yardLine,
      fieldSide: situation.possessionText?.includes('OWN') ? 'own' : 'opponent',
      possession: poss.which === 'home' ? homeTeamInfo.name : poss.which === 'away' ? awayTeamInfo.name : (situation.possession || null),
      possessionWhich: poss.which,
      possessionLabel: poss.label,
      lastPlay: situation.lastPlay || null
    };
  }

  // Baseball (MLB)
  if (ln === 'mlb' || ln.includes('baseball')) {
    return {
      inning: situation.inning || competition.status?.period || null,
      isTopInning: situation.isTopInning || situation.inningState === 'top' || false,
      balls: typeof situation.balls === 'number' ? situation.balls : null,
      strikes: typeof situation.strikes === 'number' ? situation.strikes : null,
      outs: typeof situation.outs === 'number' ? situation.outs : null,
      onFirst: !!situation.onFirst || !!situation.onBase?.first,
      onSecond: !!situation.onSecond || !!situation.onBase?.second,
      onThird: !!situation.onThird || !!situation.onBase?.third,
      onBase: !!situation.onFirst || !!situation.onSecond || !!situation.onThird || Boolean(situation.onBase)
    };
  }

  // Basketball
  if (ln.includes('basketball')) {
    return {
      shotClock: situation.shotClock || null,
      quarter: situation.period || competition.status?.period || null,
      teamFouls: situation.teamFouls || null,
      bonus: situation.bonus || null
    };
  }

  // Hockey
  if (ln.includes('hockey')) {
    return {
      powerPlay: situation.powerPlay || false,
      powerPlayTeam: situation.powerPlayTeam || null,
      powerPlayTime: situation.powerPlayTime || null,
      shotsOnGoalHome: situation.shotsOnGoalHome || null,
      shotsOnGoalAway: situation.shotsOnGoalAway || null
    };
  }

  // Soccer
  if (ln.includes('soccer')) {
    return {
      lastPlay: situation.lastPlay || null,
      period: situation.period || competition.status?.period || null,
      matchTime: situation.matchTime || null,
      shotsOnGoalHome: situation.shotsOnGoalHome || null,
      shotsOnGoalAway: situation.shotsOnGoalAway || null,
      yellowCards: situation.yellowCards || 0,
      redCards: situation.redCards || 0
    };
  }

  // Default: return raw situation for downstream components
  return situation;
}
