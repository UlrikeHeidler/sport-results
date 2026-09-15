/**
 * Playwright verification: detail mode CSS fixes
 * 1. Header no longer cuts into tile (game-header hidden, league badge in pane header)
 * 2. Grid pane shows multiple columns when 1 game is in detail mode
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:5199/sport-results/';
const SS = (name) => `verify-screenshots/${name}.png`;

const MLB_GAME = {
  id: 'mlb-001', league: 'mlb',
  homeTeam: { id: 'NYY', name: 'Yankees', abbreviation: 'NYY', score: 4, logo: '' },
  awayTeam: { id: 'BOS', name: 'Red Sox', abbreviation: 'BOS', score: 2, logo: '' },
  status: { type: 'post', detail: 'Final', period: 9, displayClock: '' },
  date: new Date().toISOString(), venue: 'Yankee Stadium'
};
const NFL_GAMES = Array.from({ length: 6 }, (_, i) => ({
  id: `nfl-00${i + 1}`, league: 'nfl',
  homeTeam: { id: `HT${i}`, name: `Home Team ${i}`, abbreviation: `HT${i}`, score: i * 7, logo: '' },
  awayTeam: { id: `AT${i}`, name: `Away Team ${i}`, abbreviation: `AT${i}`, score: i * 3, logo: '' },
  status: { type: 'post', detail: 'Final', period: 4, displayClock: '' },
  date: new Date().toISOString(), venue: 'Stadium'
}));

const SETTINGS = JSON.stringify({
  selectedLeagues: ['nfl', 'mlb'],
  colorCoding: true, showTeamForm: false, theme: 'light', appScale: 1,
  pinnedGames: []
});

const ESPN_EMPTY = JSON.stringify({ events: [] });

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  // Inject settings + mock ESPN API
  await page.addInitScript((s) => localStorage.setItem('sportsAppSettings', s), SETTINGS);

  await page.route('https://site.api.espn.com/**', async route => {
    const url = route.request().url();
    let games = [];
    if (url.includes('/mlb/')) games = [MLB_GAME];
    else if (url.includes('/nfl/')) games = NFL_GAMES;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events: games.map(g => ({
        id: g.id,
        competitions: [{
          id: g.id,
          competitors: [
            { homeAway: 'home', team: { id: g.homeTeam.id, displayName: g.homeTeam.name, abbreviation: g.homeTeam.abbreviation, logo: '' }, score: String(g.homeTeam.score) },
            { homeAway: 'away', team: { id: g.awayTeam.id, displayName: g.awayTeam.name, abbreviation: g.awayTeam.abbreviation, logo: '' }, score: String(g.awayTeam.score) }
          ],
          status: { type: { id: '3', name: 'STATUS_FINAL', description: 'Final', completed: true, state: 'post' }, period: g.status.period, displayClock: '' },
          venue: { fullName: g.venue },
          situation: {}
        }]
      })) })
    });
  });

  await page.goto(BASE);
  await page.waitForTimeout(2000);

  const tileCount = await page.locator('.game-wrapper').count();
  const btnCount = await page.locator('.detail-btn').count();
  console.log(`TILES: ${tileCount}   DETAIL_BTNS: ${btnCount}`);

  if (btnCount === 0) {
    await page.screenshot({ path: SS('debug-no-tiles'), fullPage: false });
    console.error('No detail buttons found — check settings/mock');
    await browser.close();
    process.exit(1);
  }

  // ── Step 1: open MLB game in detail mode ──────────────────────────
  const mlbBtn = page.locator('.detail-btn').first();
  await mlbBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: SS('fix1-one-detail'), fullPage: false });
  console.log('Screenshot: fix1-one-detail — check header overlap and multi-column grid');

  // Verify game-header inside detail pane is hidden
  const gameHeaderVisible = await page.locator('.detail-tile-wrapper .game-header').isVisible();
  console.log(`game-header inside detail tile visible: ${gameHeaderVisible} (expected: false)`);

  // Verify league badge in pane header
  const paneLeague = await page.locator('.detail-pane-league').textContent().catch(() => null);
  console.log(`Detail pane league label: "${paneLeague}" (expected: "MLB")`);

  // Verify multiple grid columns: count tiles in grid half
  const gridTileCount = await page.locator('.split-grid-pane .game-wrapper').count();
  console.log(`Grid pane tiles: ${gridTileCount}`);

  // Check if at least 2 tiles in same row (multi-column) by comparing bounding boxes
  let multiColumn = false;
  if (gridTileCount >= 2) {
    const box0 = await page.locator('.split-grid-pane .game-wrapper').nth(0).boundingBox();
    const box1 = await page.locator('.split-grid-pane .game-wrapper').nth(1).boundingBox();
    if (box0 && box1) {
      const sameRow = Math.abs(box0.y - box1.y) < 20;
      multiColumn = sameRow;
      console.log(`Tile 0 y=${box0.y.toFixed(0)}, Tile 1 y=${box1.y.toFixed(0)} → same row: ${sameRow}`);
    }
  }
  console.log(`Multi-column grid: ${multiColumn} (expected: true)`);

  // ── Step 2: open second game in detail mode ───────────────────────
  const gridBtns = page.locator('.split-grid-pane .detail-btn');
  const gridBtnCount = await gridBtns.count();
  if (gridBtnCount > 0) {
    await gridBtns.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: SS('fix2-two-details'), fullPage: false });
    console.log('Screenshot: fix2-two-details — both detail panes open');
  }

  // ── Step 3: close left pane ───────────────────────────────────────
  await page.locator('.detail-pane-close').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: SS('fix3-after-close'), fullPage: false });
  console.log('Screenshot: fix3-after-close — back to single detail + grid');

  await browser.close();
  console.log('\nDone. Check verify-screenshots/ for results.');
}

verify().catch(e => { console.error(e); process.exit(1); });
