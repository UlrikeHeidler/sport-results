// Temporary test file to verify ESPN API responses
const testFetch = async () => {
  const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';
  const leagues = ['nfl', 'nhl', 'mlb'];
  
  for (const league of leagues) {
    const endpoint = `${ESPN_BASE_URL}/${league === 'nfl' ? 'football/nfl' : 
                                     league === 'nhl' ? 'hockey/nhl' : 
                                     'baseball/mlb'}/scoreboard`;
    
    console.log(`\nTesting ${league.toUpperCase()} endpoint: ${endpoint}`);
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      console.log(`Total events: ${data.events ? data.events.length : 0}`);
      if (data.events && data.events.length > 0) {
        data.events.forEach(event => {
          const status = event.competitions[0].status;
          console.log(`\nGame: ${event.name}`);
          console.log(`Status: ${status.type.name}`);
          console.log(`State: ${status.state}`);
          console.log(`Detail: ${status.detail}`);
          console.log(`Period: ${status.period}`);
        });
      }
    } catch (error) {
      console.error(`Error fetching ${league}:`, error);
    }
  }
};

testFetch();