export { sortGames };
import { debug } from '../utils/logger';
import API_ENDPOINTS from './apiEndpoints';
import { normalizeStatus } from './normalizeStatus';
import { normalizeSituation } from './normalizeSituation';
import { getDateInCurrentUsersTimezone, shouldMoveToBottom, sortGames, extractTeams, getLeagueColors, isGameOngoing } from './gameUtils';
export { extractTeams };
import { handleError } from '../utils/errorHandler';

// Detect which team has possession from a competition payload and team objects.
export const detectPossession = (competitionObj, homeTeamObj, awayTeamObj) => {
  if (!competitionObj) return { which: null, label: null };

  const sit = competitionObj.situation || {};
  

  let raw = sit.possession ?? sit.possessionText ?? null;
  if (competitionObj.drives && competitionObj.drives.currentPlay) {
    const cp = competitionObj.drives.currentPlay;
    if (cp.team && (cp.team.id || cp.team.abbreviation || cp.team.displayName)) {
      raw = cp.team.id || cp.team.abbreviation || cp.team.displayName || raw;
    } else if (cp.possessionTeamId) {
      raw = cp.possessionTeamId;
    }
  }

  if (raw && typeof raw === 'object') {
    if (raw.id) raw = String(raw.id);
    else if (raw.abbreviation) raw = String(raw.abbreviation);
    else if (raw.displayName) raw = String(raw.displayName);
  }

  const normalize = v => (v == null ? null : String(v).toLowerCase());
  const rawNorm = normalize(raw);

  const candidates = (team) => [team?.id, team?.abbreviation, team?.name, team?.displayName].map(normalize).filter(Boolean);
  const homeCandidates = new Set(candidates(homeTeamObj));
  const awayCandidates = new Set(candidates(awayTeamObj));

  // Prefer lastPlay.team when available (football scoreboard often includes the
  // id/abbreviation of the team involved in the last play). This is a reliable
  // indicator of who had the ball most recently and should be preferred.
  if (sit.lastPlay && sit.lastPlay.team) {
    let lp = sit.lastPlay.team;
    let rawLp = lp.id || lp.abbreviation || lp.displayName || lp.name || null;
    if (rawLp) {
      const normalizeLp = (v) => (v == null ? null : String(v).toLowerCase());
      const lpNorm = normalizeLp(rawLp);
      if (lpNorm && homeCandidates.has(lpNorm)) return { which: 'home', label: rawLp };
      if (lpNorm && awayCandidates.has(lpNorm)) return { which: 'away', label: rawLp };
    }
  }

  if (rawNorm && homeCandidates.has(rawNorm)) return { which: 'home', label: raw };
  if (rawNorm && awayCandidates.has(rawNorm)) return { which: 'away', label: raw };

  if (rawNorm === 'home' || rawNorm === 'away') return { which: rawNorm, label: raw };

  if (typeof sit.possessionText === 'string') {
    const txt = sit.possessionText.toLowerCase();
    if (txt.includes('home')) return { which: 'home', label: sit.possessionText };
    if (txt.includes('away')) return { which: 'away', label: sit.possessionText };
  }

  if (sit.possessionTeamId) {
    const pid = normalize(sit.possessionTeamId);
    if (homeCandidates.has(pid)) return { which: 'home', label: sit.possessionTeamId };
    if (awayCandidates.has(pid)) return { which: 'away', label: sit.possessionTeamId };
  }

  return { which: null, label: raw ?? null };
};



// Fetch games for a specific league (e.g. 'nfl', 'nhl')
export const fetchGames = async (league) => {
  try {
    const baseEndpoint = API_ENDPOINTS[league.toLowerCase()];
    if (!baseEndpoint) {
      throw new Error(`Unsupported league: ${league}`);
    }

    // Include only todays games
    const today = new Date();


    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${today.getFullYear()}${month}${day}`;
  debug('Fetching games for date:', dateStr);
    // Append dates parameter using existing URL params or adding new one
    const separator = baseEndpoint.includes('?') ? '&' : '?';
    const endpoint = `${baseEndpoint}${separator}dates=${dateStr}`;
    
  debug(`Fetching ${league} games from:`, endpoint);
    
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

  const data = await response.json();
  debug(`${league} API response:`, data);
    return parseGamesData(data, league);
  } catch (error) {
    handleError(error, `fetchGames (${league})`);
    return []; // Return empty array instead of throwing
  }
};

// Parse the ESPN API response into a standardized format
const parseGamesData = (data, league) => {
  if (!data.events || !Array.isArray(data.events)) {
    debug(`No events found for ${league}`);
    return [];
  }

  debug(`Parsing ${data.events.length} events for ${league}`);

  return data.events.map(event => {
    try {
      const competition = event.competitions[0];
      const competitors = competition.competitors;
      
      // Find home and away teams
      const homeTeam = competitors.find(comp => comp.homeAway === 'home');
      const awayTeam = competitors.find(comp => comp.homeAway === 'away');

      if (!homeTeam || !awayTeam) {
        handleError(`Missing team data for event: ${event.id}`, 'parseGamesData');
        return null;
      }

      // Use shared normalizeStatus helper

  // Extract situation data for  games
  //console.log('##### Extracting competition: ',competition);
  const situation = competition.situation || {};
  debug(`Game ${event.id} situation data:`, situation);

      return {
        id: event.id,
        league: league.toUpperCase(),
        status: normalizeStatus(competition.status),
        homeTeam: {
          id: homeTeam.id,
          name: homeTeam.team.displayName || homeTeam.team.name,
          abbreviation: homeTeam.team.abbreviation,
          score: homeTeam.score || '0',
          logo: homeTeam.team.logo || ''
        },
        awayTeam: {
          id: awayTeam.id,
          name: awayTeam.team.displayName || awayTeam.team.name,
          abbreviation: awayTeam.team.abbreviation,
          score: awayTeam.score || '0',
          logo: awayTeam.team.logo || ''
        },
        // Use shared normalizeSituation helper
        situation: normalizeSituation(league, situation, competition, homeTeam, awayTeam),
        date: new Date(event.date),
        venue: competition.venue ? competition.venue.fullName : 'TBD',
        finishedAt: competition.status.type.completed ? new Date() : null
      };
    } catch (error) {
      handleError(error, `parseGamesData (event: ${event.id})`);
      return null;
    }
  }).filter(game => game !== null);
};

// Get games for all supported leagues (only those enabled by user)
export const fetchAllGames = async (selectedLeagues = ['nfl', 'nhl', 'fcs', 'fbs', 'mlb', 'bundesliga1', 'bundesliga2', 'ucl', 'dfb_pokal', 'nba', 'mls', 'ncaaw']) => {
  try {
  // Only fetch leagues that are actually enabled (skip falsy/duplicates)
    const enabledLeagues = Array.isArray(selectedLeagues)
      ? [...new Set(selectedLeagues.filter(l => typeof l === 'string' && l.trim()))]
      : [];
    console.log('Fetching games for leagues:', enabledLeagues);

    if (!enabledLeagues.length) {
      debug('No leagues enabled, skipping all fetches.');
      return {};
    }

    const promises = enabledLeagues.map(league =>
      fetchGames(league).then(games => ({ league, games }))
    );

    const results = await Promise.allSettled(promises);
    const gamesData = {};

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { league, games } = result.value;
        gamesData[league] = games;
        debug(`Successfully fetched ${games.length} games for ${league}`);
      } else {
        handleError(result.reason, 'fetchAllGames (Promise.allSettled)');
      }
    });

  // Only include today's games
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    Object.keys(gamesData).forEach(league => {
      gamesData[league] = gamesData[league].filter(game => {
        const gameDate = new Date(game.date);
        return gameDate >= today && gameDate <= endOfToday;
      });
      debug(`Filtered to ${gamesData[league].length} games for ${league} (today only)`);
    });

    return gamesData;
  } catch (error) {
    handleError(error, 'fetchAllGames', true);
  }
};

// Fetch per-game summary / boxscore for a specific event (on-demand, optional)
export const fetchGameSummary = async (league, eventId) => {
  try {
    const baseEndpoint = API_ENDPOINTS[league.toLowerCase()];
    if (!baseEndpoint) {
      handleError(`Unsupported league: ${league}`, 'fetchGameSummary');
      return null;
    }

    // Replace /scoreboard with /summary and append event id param if needed
    const summaryEndpoint = baseEndpoint.includes('/scoreboard')
      ? baseEndpoint.replace('/scoreboard', `/summary?event=${encodeURIComponent(eventId)}`)
      : `${baseEndpoint}/summary?event=${encodeURIComponent(eventId)}`;

    const res = await fetch(summaryEndpoint);
    if (!res.ok) {
      handleError(`fetchGameSummary failed: ${res.status}`, 'fetchGameSummary');
      return null;
    }
    const data = await res.json();
    debug('fetchGameSummary success:', { league, eventId, data });
    return data;
  } catch (err) {
    handleError(err, 'fetchGameSummary');
    return null;
  }
};

// Normalize a raw game summary/boxscore payload for downstream use
export const normalizeGameSummary = (raw) => {
  if (!raw) return null;

  // possible shapes: { boxscore: { teams: [...] } } or { gamepackageJSON: { boxscore: { teams: [...] } } }
  const src = raw.boxscore || raw.gamepackageJSON?.boxscore || raw.boxScore || raw;

  const teamsArr = src?.teams || (Array.isArray(src) ? src : null);

  const normalizeTeam = (tRaw) => {
    if (!tRaw) return null;

    // Common shapes: tRaw.goalies (array), tRaw.goalie (single), tRaw.emptyNet
    const goalies = tRaw.goalies || (tRaw.players ? tRaw.players.filter(p => p.position && p.position.abbreviation === 'G') : null) || [];
    const goalie = goalies[0] || tRaw.goalie || null;

    const name = goalie?.person?.fullName || goalie?.name || goalie?.playerName || goalie?.person?.displayName || null;
    const saves = goalie?.stats?.saves ?? goalie?.saves ?? goalie?.statistics?.saves ?? null;
    const shots = goalie?.stats?.shotsAgainst ?? goalie?.shotsAgainst ?? goalie?.statistics?.shotsAgainst ?? goalie?.statistics?.shots ?? null;

    const emptyNet = !!tRaw.emptyNet || !!tRaw.isEmptyNet || !!tRaw.goaliePulled || false;

    return {
      id: tRaw.team?.id || tRaw.teamId || tRaw.id || null,
      name: tRaw.team?.displayName || tRaw.team?.name || tRaw.team?.shortName || null,
      goalie: name ? { name, saves, shots } : null,
      emptyNet
    };
  };

  // If teamsArr is an array of two teams, map home/away by index or property
  if (Array.isArray(teamsArr) && teamsArr.length >= 2) {
    return {
      teams: {
        home: normalizeTeam(teamsArr[0]),
        away: normalizeTeam(teamsArr[1])
      }
    };
  }

  // If src.teams is an object with home/away keys
  if (src && src.teams && (src.teams.home || src.teams.away)) {
    return {
      teams: {
        home: normalizeTeam(src.teams.home),
        away: normalizeTeam(src.teams.away)
      }
    };
  }

  // Try teamsById mapping
  if (src && src.teamsById) {
    // Attempt to pick two teams heuristically
    const ids = Object.keys(src.teamsById);
    return {
      teams: {
        home: normalizeTeam(src.teamsById[ids[0]]),
        away: normalizeTeam(src.teamsById[ids[1]])
      }
    };
  }

  return null;
};

// Format game time for display
export const formatGameTime = (date, status) => {
  if (status.completed) {
    return 'Final';
  }
  if (isGameOngoing(status)) {
    return status.displayClock ? `${status.displayClock} - Period ${status.period}` : 'Live';
  }
  if (status.type === 'STATUS_SCHEDULED') {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  return status.type.replace('STATUS_', '').replace('_', ' ');
};

// Get status class for styling
export const getStatusClass = (status) => {
  if (status.completed) {
    return 'final';
  }
  if (isGameOngoing(status)) {
    return 'live';
  }
  return 'scheduled';
};

// getLeagueColors now imported from gameUtils

// shouldMoveToBottom now imported from gameUtils

// sortGames now imported from gameUtils

// extractTeams now imported from gameUtils