// Per-sport situation normalization helper
import { detectPossession } from './sportsApi';

/**
 * Returns the total elapsed game time in seconds for basketball.
 * @param {number} secondsLeftInQuarter - Seconds left in the current quarter.
 * @param {number} quarter - The current quarter number (1-based).
 * @returns {number} Elapsed seconds since game start.
 */
function getElapsedGameTime(secondsLeftInQuarter, quarter) {
  const quarterLength = 12 * 60; // 12 minutes per quarter
  const quartersCompleted = Math.max(0, quarter - 1);
  const elapsed = quartersCompleted * quarterLength + (quarterLength - secondsLeftInQuarter);
  return elapsed;
}

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
  //console.log(`#####Normalizing situation for league: ${league}`, situation);
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
    console.log(`#####Normalizing baseball situation:`, situation?.batter?.athlete?.displayName  );
    return {
      inning: situation.inning || competition.status?.period || null,
      isTopInning: competition.status?.type?.detail?.toLowerCase().includes('top') || false,
      balls: typeof situation.balls === 'number' ? situation.balls : null,
      strikes: typeof situation.strikes === 'number' ? situation.strikes : null,
      outs: typeof situation.outs === 'number' ? situation.outs : null,
      onFirst: !!situation.onFirst || !!situation.onBase?.first,
      onSecond: !!situation.onSecond || !!situation.onBase?.second,
      onThird: !!situation.onThird || !!situation.onBase?.third,
      onBase: !!situation.onFirst || !!situation.onSecond || !!situation.onThird || Boolean(situation.onBase),
      currentBatter: situation.batter?.athlete?.displayName || null,
      currentPitcher: situation.pitcher?.athlete?.displayName || null
    };
  }

  // Basketball
  if (ln === 'nba' || ln === 'ncaaw' || ln.includes('basketball')) {
    return {
      lastPlay: situation.lastPlay || null,
      time: getElapsedGameTime(competition.status?.clock || 0, competition.status?.period || 1)
    };
  }

  // Hockey
  if (ln === 'nhl' || ln.includes('hockey')) {
    console.log('Normalizing hockey competition:', competition);
    console.log('Normalizing hockey situation.lastPlay:', situation.lastPlay);
    // Build a timeline of main events (goals, penalties) from lastPlay and, if available, a play history
    const timeline = [];
    // If the API ever provides a play history, use it; otherwise, just use lastPlay
    const plays = situation.plays || (situation.lastPlay ? [situation.lastPlay] : []);
    for (const play of plays) {
      if (!play || !play.text) continue;
      const text = play.type?.text.toLowerCase();
      if (text.includes('goal') || text.includes('penalty')) {
        timeline.push({
          type: text.includes('goal') ? 'goal' : 'penalty',
          text: play.text,
          team: play.team?.id || null,
          athlete: play.athletesInvolved?.displayName || play.athletesInvolved?.name || null,
          period: competition.status?.period || null,
          clock: competition.status?.clock || null,
          id: play.id || null
        });
      }
    }
    return {
      lastPlay: situation.lastPlay?.text || null,
      timeline
    };
  }

  // Soccer
  if (ln === 'mls' || ln.includes('soccer')) {
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
