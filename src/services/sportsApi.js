// ESPN API endpoints for sports data
const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

// API endpoints for different leagues
const API_ENDPOINTS = {
  nfl: `${ESPN_BASE_URL}/football/nfl/scoreboard`,
  nhl: `${ESPN_BASE_URL}/hockey/nhl/scoreboard`
};

// Date utilities
const getDateString = (date) => {
  return date.toISOString().split('T')[0].replace(/-/g, '');
};

const getDateRange = () => {
  const today = new Date();
  const dates = [];
  
  // Get today + next 3 days
  for (let i = 0; i < 4; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(getDateString(date));
  }
  
  return dates;
};

/**
 * Fetch games for a specific league with date filtering
 * @param {string} league - The league to fetch games for (nfl, nhl)
 * @param {string} dateFilter - Optional date filter (YYYYMMDD format)
 * @returns {Promise<Array>} Array of game objects
 */
export const fetchGames = async (league, dateFilter = null) => {
  try {
    const endpoint = API_ENDPOINTS[league.toLowerCase()];
    if (!endpoint) {
      throw new Error(`Unsupported league: ${league}`);
    }

    // Add date parameter if provided
    const url = dateFilter ? `${endpoint}?dates=${dateFilter}` : endpoint;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return parseGamesData(data, league);
  } catch (error) {
    console.error(`Error fetching ${league} games:`, error);
    throw error;
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
    return [];
  }

  return data.events.map(event => {
    const competition = event.competitions[0];
    const competitors = competition.competitors;
    
    // Find home and away teams
    const homeTeam = competitors.find(comp => comp.homeAway === 'home');
    const awayTeam = competitors.find(comp => comp.homeAway === 'away');

    return {
      id: event.id,
      league: league.toUpperCase(),
      status: {
        type: competition.status.type.name,
        displayClock: competition.status.displayClock,
        period: competition.status.period,
        completed: competition.status.type.completed
      },
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.team.displayName,
        abbreviation: homeTeam.team.abbreviation,
        score: homeTeam.score,
        logo: homeTeam.team.logo
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.team.displayName,
        abbreviation: awayTeam.team.abbreviation,
        score: awayTeam.score,
        logo: awayTeam.team.logo
      },
      date: new Date(event.date),
      venue: competition.venue ? competition.venue.fullName : 'TBD',
      finishedAt: competition.status.type.completed ? new Date() : null
    };
  });
};

/**
 * Get games for all supported leagues with date filtering
 * @param {Array} selectedLeagues - Array of league names to fetch
 * @returns {Promise<Object>} Object with games grouped by league
 */
export const fetchAllGames = async (selectedLeagues = ['nfl', 'nhl']) => {
  try {
    const dateRange = getDateRange();
    const allPromises = [];

    // Fetch games for each league and each date in range
    selectedLeagues.forEach(league => {
      dateRange.forEach(date => {
        allPromises.push(
          fetchGames(league, date).then(games => ({ league, games, date }))
        );
      });
    });

    const results = await Promise.allSettled(allPromises);
    const gamesData = {};

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { league, games } = result.value;
        if (!gamesData[league]) {
          gamesData[league] = [];
        }
        gamesData[league].push(...games);
      } else {
        console.error('Failed to fetch games for a league:', result.reason);
      }
    });

    // Remove duplicates and filter by date range
    Object.keys(gamesData).forEach(league => {
      const uniqueGames = gamesData[league].filter((game, index, self) =>
        index === self.findIndex(g => g.id === game.id)
      );
      
      // Filter to only include today + next 3 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 3);
      
      gamesData[league] = uniqueGames.filter(game => {
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate >= today && gameDate <= maxDate;
      });
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
    return `${status.displayClock} - Period ${status.period}`;
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