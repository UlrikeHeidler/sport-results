import { describe, it, expect, vi, afterEach } from 'vitest';
import * as api from '../sportsApi';

const makeEvent = ({ id, date, status, home, away }) => ({
  id,
  date,
  competitions: [
    {
      status,
      situation: {},
      competitors: [
        {
          homeAway: 'home',
          score: home.score,
          team: {
            id: home.id,
            displayName: home.name,
            abbreviation: home.abbrev || home.id,
            logo: home.logo || ''
          }
        },
        {
          homeAway: 'away',
          score: away.score,
          team: {
            id: away.id,
            displayName: away.name,
            abbreviation: away.abbrev || away.id,
            logo: away.logo || ''
          }
        }
      ]
    }
  ]
});

describe('sportsApi.fetchAllGames', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete global.fetch;
  });

  it('should preserve yesterday late-night MLB games when they are live or final', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(22, 0, 0, 0);

    const today = new Date();
    today.setHours(20, 0, 0, 0);

    const yesterdayEvent = makeEvent({
      id: 'mlb-overnight-1',
      date: yesterday.toISOString(),
      status: {
        type: { name: 'STATUS_IN_PROGRESS', completed: false },
        displayClock: '2:15',
        period: 10
      },
      home: { id: 'h1', name: 'Home', score: 3 },
      away: { id: 'a1', name: 'Away', score: 2 }
    });

    const todayEvent = makeEvent({
      id: 'mlb-today-1',
      date: today.toISOString(),
      status: {
        type: { name: 'STATUS_SCHEDULED', completed: false },
        displayClock: '',
        period: 0
      },
      home: { id: 'h2', name: 'Home2', score: 0 },
      away: { id: 'a2', name: 'Away2', score: 0 }
    });

    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const yesterdayFilter = formatLocalDate(yesterday);
    const todayFilter = formatLocalDate(today);

    const fetchMock = vi.fn((url) => {
      const lowerUrl = String(url).toLowerCase();
      if (lowerUrl.includes(`dates=${yesterdayFilter}`)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ events: [yesterdayEvent] })
        });
      }

      if (lowerUrl.includes(`dates=${todayFilter}`)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ events: [todayEvent] })
        });
      }

      return Promise.resolve({ ok: true, json: async () => ({ events: [] }) });
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await api.fetchAllGames(['mlb']);
    console.log('fetch urls', fetchMock.mock.calls.map(([url]) => url));
    console.log('result mlb', JSON.stringify(result.mlb, null, 2));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.mlb).toBeDefined();
    expect(result.mlb.some((game) => game.id === 'mlb-overnight-1')).toBe(true);
    expect(result.mlb.some((game) => game.id === 'mlb-today-1')).toBe(true);
  });
});
