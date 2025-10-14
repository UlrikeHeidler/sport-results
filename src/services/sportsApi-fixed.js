// ESPN API endpoints for sports data
const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

// API endpoints for different leagues
const API_ENDPOINTS = {
  nfl: `${ESPN_BASE_URL}/football/nfl/scoreboard`,
  nhl: `${ESPN_BASE_URL}/hockey/nhl/scoreboard`,
  fcs: `${ESPN_BASE_URL}/football/college-football/scoreboard?groups=81`,
  fbs: `${ESPN_BASE_URL}/football/college-football/scoreboard?groups=80`,
  mlb: `${ESPN_BASE_URL}/baseball/mlb/scoreboard`,
  bundesliga1: `${ESPN_BASE_URL}/soccer/ger.1/scoreboard`,
  bundesliga2: `${ESPN_BASE_URL}/soccer/ger.2/scoreboard`,
  nba: `${ESPN_BASE_URL}/basketball/nba/scoreboard`,
  ncaaw: `${ESPN_BASE_URL}/basketball/womens-college-basketball/scoreboard`,
  mls: `${ESPN_BASE_URL}/soccer/usa.1/scoreboard`
};

/**
 * Fetch games for a specific league
 * @param {string} league - The league to fetch games for (nfl, nhl)
 * @returns {Promise<Array>} Array of game objects
 */
export const fetchGames = async (league) => {
  try {
    const baseEndpoint = API_ENDPOINTS[league.toLowerCase()];
    if (!baseEndpoint) {
      throw new Error(`Unsupported league: ${league}`);
    }

    // Format today's date as YYYYMMDD
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    // Append date parameter using existing URL params or adding new one
    const separator = baseEndpoint.includes('?') ? '&' : '?';
    const endpoint = `${baseEndpoint}${separator}dates=${dateStr}`;
  
    console.log(`Fetching ${league} games from:`, endpoint);
    
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`${league} API response:`, data);
    return parseGamesData(data, league);
  } catch (error) {
    console.error(`Error fetching ${league} games:`, error);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Parse the ESPN API response into a standardized format
 * @param {Object} data - Raw API response
 * @param {string} league - League identifier
 * @returns {Array} Parsed games array
 */
const parseGamesData = (data, league) => {
  if (!data.events || !Array.isArray(data.events)) {
    console.log(`No events found for ${league}`);
    return [];
  }

  console.log(`Parsing ${data.events.length} events for ${league}`);

  return data.events.map(event => {
    try {
      const competition = event.competitions[0];
      const competitors = competition.competitors;
      
      // Find home and away teams
      const homeTeam = competitors.find(comp => comp.homeAway === 'home');
      const awayTeam = competitors.find(comp => comp.homeAway === 'away');

      if (!homeTeam || !awayTeam) {
        console.warn('Missing team data for event:', event.id);
        return null;
      }

      return {
        id: event.id,
        league: league.toUpperCase(),
        status: {
          type: competition.status.type.name,
          displayClock: competition.status.displayClock || '',
          period: competition.status.period || 0,
          completed: competition.status.type.completed || false
        },
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
        date: new Date(event.date),
        venue: competition.venue ? competition.venue.fullName : 'TBD',
        finishedAt: competition.status.type.completed ? new Date() : null
      };
    } catch (error) {
      console.error('Error parsing event:', event.id, error);
      return null;
    }
  }).filter(game => game !== null); // Remove any failed parses
};

/**
 * Get games for all supported leagues
 * @param {Array} selectedLeagues - Array of league names to fetch
 * @returns {Promise<Object>} Object with games grouped by league
 */
export const fetchAllGames = async (selectedLeagues = ['nfl', 'nhl', 'fcs', 'fbs', 'mlb', 'bundesliga1', 'bundesliga2', 'nba', 'mls', 'ncaaw']) => {
  try {
    console.log('Fetching games for leagues:', selectedLeagues);
    
    const promises = selectedLeagues.map(league => 
      fetchGames(league).then(games => ({ league, games }))
    );

    const results = await Promise.allSettled(promises);
    const gamesData = {};

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { league, games } = result.value;
        gamesData[league] = games;
        console.log(`Successfully fetched ${games.length} games for ${league}`);
      } else {
        console.error('Failed to fetch games for a league:', result.reason);
      }
    });

    // Filter games to only include today's games
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    Object.keys(gamesData).forEach(league => {
      gamesData[league] = gamesData[league].filter(game => {
        const gameDate = new Date(game.date);
        return gameDate >= today && gameDate <= endOfToday;
      });
      console.log(`Filtered to ${gamesData[league].length} games for ${league} (today only)`);
    });

    return gamesData;
  } catch (error) {
    console.error('Error fetching all games:', error);
    throw error;
  }
};

/**
 * Format game time for display
 * @param {Date} date - Game date
 * @param {Object} status - Game status
 * @returns {string} Formatted time string
 */
export const formatGameTime = (date, status) => {
  if (status.completed) {
    return 'Final';
  }

  if (status.type === 'STATUS_IN_PROGRESS') {
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

/**
 * Get status class for styling
 * @param {Object} status - Game status
 * @returns {string} CSS class name
 */
export const getStatusClass = (status) => {
  if (status.completed) {
    return 'final';
  }
  
  // Treat games in progress, halftime, intermission, etc. as live
  if (status.type === 'STATUS_IN_PROGRESS' ||
      status.type === 'STATUS_HALFTIME' ||
      status.type === 'STATUS_BREAK' ||
      status.type === 'STATUS_INTERMISSION' ||
      status.type === 'STATUS_END_PERIOD') {
    return 'live';
  }
  
  return 'scheduled';
};

/**
 * Get league color theme
 * @param {string} league - League identifier
 * @returns {Object} Color theme object
 */
export const getLeagueColors = (league) => {
  const themes = {
    // Football themes with brown/gold tones
    nfl: {
      primary: '#5A4423',  // Rich brown
      secondary: '#8B6B42',
      accent: '#FFB612',  // Gold
      background: '#FFF8E7' // Light warm beige
    },
    fcs: {
      primary: '#654321',  // Dark brown
      secondary: '#BA8C3C',
      accent: '#FFD700',  // Gold
      background: '#FFF6E6' // Light warm beige
    },
    fbs: {
      primary: '#704214',  // Brown
      secondary: '#9E7845',
      accent: '#DAA520',  // Golden rod
      background: '#FFF4E0' // Light warm beige
    },
    // Baseball theme with classic red/white/blue
    mlb: {
      primary: '#BE0000',  // Classic baseball red
      secondary: '#14387F',
      accent: '#FFFFFF',
      background: '#F9F9FF' // Very light blue tint
    },
    // Basketball themes with orange tones
    nba: {
      primary: '#F85800',  // Bright orange
      secondary: '#2C2C2C',
      accent: '#FFFFFF',
      background: '#FFF4EE' // Light orange tint
    },
    ncaaw: {
      primary: '#FF6B1A',  // Warm orange
      secondary: '#1A1A1A',
      accent: '#FFFFFF',
      background: '#FFF2EB' // Light orange tint
    },
    // Hockey theme with icy blues
    nhl: {
      primary: '#004C8E',  // Deep ice blue
      secondary: '#60B2FF',
      accent: '#FFFFFF',
      background: '#F0F8FF' // Alice blue
    },
    // Soccer themes with green/field colors
    bundesliga1: {
      primary: '#006633',  // Forest green
      secondary: '#CCDD22', // Yellow-green
      accent: '#FFFFFF',
      background: '#F5FFE6' // Light green tint
    },
    bundesliga2: {
      primary: '#005C2F',  // Deep green
      secondary: '#B8D43C',
      accent: '#FFFFFF',
      background: '#F7FFE8' // Light green tint
    },
    mls: {
      primary: '#007A3D',  // Soccer field green
      secondary: '#B3D12A',
      accent: '#FFFFFF',
      background: '#F6FFEA' // Light green tint
    }
  };
  
  return themes[league.toLowerCase()] || themes.nfl;
};

/**
 * Check if a game should be moved to bottom (finished > 2 minutes ago)
 * @param {Object} game - Game object
 * @returns {boolean} Whether game should be at bottom
 */
export const shouldMoveToBottom = (game) => {
  if (!game.status.completed || !game.finishedAt) {
    return false;
  }
  
  const now = new Date();
  const timeSinceFinished = now - new Date(game.finishedAt);
  const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
  
  return timeSinceFinished > twoMinutes;
};

/**
 * Sort games with smart ordering
 * @param {Array} games - Array of games
 * @returns {Array} Sorted games array
 */
export const sortGames = (games) => {
  return games.sort((a, b) => {
    // Check if games should be moved to bottom
    const aToBottom = shouldMoveToBottom(a);
    const bToBottom = shouldMoveToBottom(b);
    
    if (aToBottom && !bToBottom) return 1;
    if (!aToBottom && bToBottom) return -1;
    
    // Live games first (among non-bottom games) - including games in breaks
    if (!aToBottom && !bToBottom) {
      const aIsLive = a.status.type === 'STATUS_IN_PROGRESS' ||
                     a.status.type === 'STATUS_HALFTIME' ||
                     a.status.type === 'STATUS_BREAK' ||
                     a.status.type === 'STATUS_INTERMISSION' ||
                     a.status.type === 'STATUS_END_PERIOD';
      const bIsLive = b.status.type === 'STATUS_IN_PROGRESS' ||
                     b.status.type === 'STATUS_HALFTIME' ||
                     b.status.type === 'STATUS_BREAK' ||
                     b.status.type === 'STATUS_INTERMISSION' ||
                     b.status.type === 'STATUS_END_PERIOD';
      
      if (aIsLive && !bIsLive) return -1;
      if (bIsLive && !aIsLive) return 1;
    }
    
    // Then by date
    return new Date(a.date) - new Date(b.date);
  });
};

/**
 * Extract all unique teams from games data
 * @param {Object} gamesData - Games data grouped by league
 * @returns {Array} Array of team objects
 */
export const extractTeams = (gamesData) => {
  const teams = [];
  const teamIds = new Set();
  
  Object.entries(gamesData).forEach(([league, games]) => {
    games.forEach(game => {
      [game.homeTeam, game.awayTeam].forEach(team => {
        var uniqueId = league + team.id;
        console.log('####Processing team:', uniqueId);
        if (!teamIds.has(uniqueId)) {
          teamIds.add(uniqueId);
          teams.push({
            id: uniqueId,
            name: team.name,
            abbreviation: team.abbreviation,
            league: league.toUpperCase()
          });
        }
      });
    });
  });
  
  return teams.sort((a, b) => a.name.localeCompare(b.name));
};