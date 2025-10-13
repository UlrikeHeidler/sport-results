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
  bundesliga2: `${ESPN_BASE_URL}/soccer/ger.2/scoreboard`
};

/**
 * Fetch games for a specific league
 * @param {string} league - The league to fetch games for (nfl, nhl)
 * @returns {Promise<Array>} Array of game objects
 */
export const fetchGames = async (league) => {
  try {
    const endpoint = API_ENDPOINTS[league.toLowerCase()];
    if (!endpoint) {
      throw new Error(`Unsupported league: ${league}`);
    }

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
export const fetchAllGames = async (selectedLeagues = ['nfl', 'nhl', 'fcs', 'fbs', 'mlb', 'bundesliga1', 'bundesliga2']) => {
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

    // Filter games to only include today + next 3 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 3);

    Object.keys(gamesData).forEach(league => {
      gamesData[league] = gamesData[league].filter(game => {
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate >= today && gameDate <= maxDate;
      });
      console.log(`Filtered to ${gamesData[league].length} games for ${league} (today + 3 days)`);
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
  
  if (status.type === 'STATUS_IN_PROGRESS') {
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
    nfl: {
      primary: '#013369',
      secondary: '#D50A0A',
      accent: '#FFB612',
      background: '#f8f9ff'
    },
    nhl: {
      primary: '#000000',
      secondary: '#C8102E',
      accent: '#FCB514',
      background: '#f5f5f5'
    },
    fcs: {
      primary: '#8B0000',
      secondary: '#FFD700',
      accent: '#228B22',
      background: '#fff8f0'
    },
    fbs: {
      primary: '#FF8C00',
      secondary: '#4169E1',
      accent: '#32CD32',
      background: '#fff5ee'
    },
    mlb: {
      primary: '#002D72',
      secondary: '#D50032',
      accent: '#FFFFFF',
      background: '#f0f8ff'
    },
    bundesliga1: {
      primary: '#D20515',
      secondary: '#000000',
      accent: '#FFCC02',
      background: '#fff0f0'
    },
    bundesliga2: {
      primary: '#005CA9',
      secondary: '#FFFFFF',
      accent: '#E30613',
      background: '#f0f5ff'
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
    
    // Live games first (among non-bottom games)
    if (!aToBottom && !bToBottom) {
      if (a.status.type === 'STATUS_IN_PROGRESS' && b.status.type !== 'STATUS_IN_PROGRESS') return -1;
      if (b.status.type === 'STATUS_IN_PROGRESS' && a.status.type !== 'STATUS_IN_PROGRESS') return 1;
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
        if (!teamIds.has(team.id)) {
          teamIds.add(team.id);
          teams.push({
            id: team.id,
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