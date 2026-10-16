import { normalizeSituation } from './normalizeSituation';
import { normalizeStatus } from './normalizeStatus';

/**
 * Convert an ESPN scoreboard response into the app's game model.
 */
export const normalizeScoreboard = (data, league) => {
  if (!Array.isArray(data?.events)) {
    throw new Error(`Invalid scoreboard response for ${league}: missing events array`);
  }

  const snapshotFetchedAt = Date.now();

  return data.events.map(event => {
    let competition = null;
    let competitors = null;

    try {
      competition = event.competitions?.[0] || null;
      competitors = competition?.competitors || [];
      const homeTeam = competitors.find(comp => comp.homeAway === 'home');
      const awayTeam = competitors.find(comp => comp.homeAway === 'away');

      const getRecord = competitor => {
        const records = competitor.records ?? competitor.record;
        if (!Array.isArray(records) || !records.length) return null;
        return (
          records.find(record => record.type === 'total') ??
          records.find(record => record.type === 'overall') ??
          records[0]
        )?.summary ?? null;
      };

      if (!homeTeam || !awayTeam) {
        console.warn(`Missing team data for event ${event.id}:`, {
          eventId: event.id,
          competitors: competitors.length || 0,
          homeTeam: !!homeTeam,
          awayTeam: !!awayTeam,
          league
        });
        return null;
      }

      const situation = competition?.situation || {};
      const seriesData = competition?.series || null;
      let series = null;
      if (seriesData) {
        const homeSeriesComp = seriesData.competitors?.find(item => item.id === homeTeam.id);
        const awaySeriesComp = seriesData.competitors?.find(item => item.id === awayTeam.id);
        series = {
          summary: seriesData.summary || null,
          totalCompetitions: seriesData.totalCompetitions || null,
          homeWins: homeSeriesComp?.wins ?? null,
          awayWins: awaySeriesComp?.wins ?? null,
        };
      }

      return {
        id: event.id,
        league: league.toUpperCase(),
        snapshotFetchedAt,
        seasonType: event.season ? { type: event.season.type, slug: event.season.slug } : null,
        status: normalizeStatus(competition?.status),
        broadcast: competition?.broadcast || null,
        homeTeam: {
          id: homeTeam.id,
          name: homeTeam.team.displayName || homeTeam.team.name,
          abbreviation: homeTeam.team.abbreviation,
          ranking: competition?.competitors?.[0]?.curatedRank?.current || null,
          score: homeTeam.score || '0',
          logo: homeTeam.team.logo || '',
          winner: homeTeam.winner ?? false,
          shootoutScore: homeTeam.shootoutScore ?? null,
          hits: homeTeam.hits ?? null,
          errors: homeTeam.errors ?? null,
          record: getRecord(homeTeam)
        },
        awayTeam: {
          id: awayTeam.id,
          name: awayTeam.team.displayName || awayTeam.team.name,
          abbreviation: awayTeam.team.abbreviation,
          ranking: competition?.competitors?.[1]?.curatedRank?.current || null,
          score: awayTeam.score || '0',
          logo: awayTeam.team.logo || '',
          winner: awayTeam.winner ?? false,
          shootoutScore: awayTeam.shootoutScore ?? null,
          hits: awayTeam.hits ?? null,
          errors: awayTeam.errors ?? null,
          record: getRecord(awayTeam)
        },
        situation: normalizeSituation(league, situation, competition, homeTeam, awayTeam),
        linescores: (() => {
          const homeLinescores = homeTeam.linescores?.map(line => line.value ?? '-') ?? [];
          const awayLinescores = awayTeam.linescores?.map(line => line.value ?? '-') ?? [];
          return (homeLinescores.length > 0 || awayLinescores.length > 0)
            ? { home: homeLinescores, away: awayLinescores }
            : null;
        })(),
        date: new Date(event.date),
        venue: competition?.venue?.fullName || 'TBD',
        finishedAt: competition?.status?.type?.completed ? new Date() : null,
        series
      };
    } catch (error) {
      console.warn(`Failed to parse game data for event ${event?.id || 'unknown'}:`, {
        eventId: event?.id || null,
        league,
        error: error.message,
        hasCompetition: !!competition,
        hasCompetitors: Array.isArray(competitors) ? competitors.length : 0
      });
      return null;
    }
  }).filter(Boolean);
};
