// API endpoints for different leagues
const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

const API_ENDPOINTS = {
  nfl: `${ESPN_BASE_URL}/football/nfl/scoreboard`,
  nhl: `${ESPN_BASE_URL}/hockey/nhl/scoreboard`,
  fcs: `${ESPN_BASE_URL}/football/college-football/scoreboard?groups=81`,
  fbs: `${ESPN_BASE_URL}/football/college-football/scoreboard?groups=80`,
  mlb: `${ESPN_BASE_URL}/baseball/mlb/scoreboard`,
  bundesliga1: `${ESPN_BASE_URL}/soccer/ger.1/scoreboard`,
  bundesliga2: `${ESPN_BASE_URL}/soccer/ger.2/scoreboard`,
  dfb_pokal: `${ESPN_BASE_URL}/soccer/ger.dfb_pokal/scoreboard`, // German Cup (DFB Pokal)
  ucl: `${ESPN_BASE_URL}/soccer/uefa.champions/scoreboard`, // UEFA Champions League
  nba: `${ESPN_BASE_URL}/basketball/nba/scoreboard`,
  ncaaw: `${ESPN_BASE_URL}/basketball/womens-college-basketball/scoreboard`,
  mls: `${ESPN_BASE_URL}/soccer/usa.1/scoreboard`
};

export default API_ENDPOINTS;
