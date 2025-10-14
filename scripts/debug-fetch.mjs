import { fetchAllGames } from '../src/services/sportsApi-fixed.js';

(async () => {
  try {
    const leagues = ['nhl','nfl','fbs'];
    console.log('Fetching leagues:', leagues);
    const data = await fetchAllGames(leagues);
    for (const league of leagues) {
      const games = data[league] || [];
      console.log(`\nLeague: ${league} - ${games.length} games`);
      if (games.length > 0) {
        const g = games[0];
        console.log('Sample game id:', g.id);
        console.log('situation:', JSON.stringify(g.situation, null, 2));
        console.log('homeTeam sample:', JSON.stringify(g.homeTeam || g.teams?.home, null, 2));
        console.log('awayTeam sample:', JSON.stringify(g.awayTeam || g.teams?.away, null, 2));
      }
    }
  } catch (err) {
    console.error('Debug fetch failed:', err);
    process.exit(1);
  }
})();
