import { useEffect, useState } from 'react';
import { fetchGameSummary } from '../services/sportsApi-fixed';

/**
 * Hook to fetch and filter timeline events for a soccer game
 * @param {string} league - League key (e.g. 'mls')
 * @param {string} eventId - ESPN event id
 * @returns {Array} Array of timeline events: { minute, type, team, description }
 */
export function useSoccerTimeline(league, eventId, refreshInterval = 30) {
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    let mounted = true;
    let intervalId;

    async function fetchTimeline() {
      const summary = await fetchGameSummary(league, eventId);
      if (!summary || !summary.keyEvents) return;
      // Filter for goals, cards, substitutions
      const events = summary.keyEvents
        .filter(play =>
          play.type && (
            play.type?.text?.toLowerCase().includes('goal') ||
            play.type?.text?.toLowerCase().includes('yellow') ||
            play.type?.text?.toLowerCase().includes('red') ||
            play.type?.text?.toLowerCase().includes('substitution')
          )
        )
        .map(play => ({
          minute: play.clock?.displayValue || play.period?.displayValue || '',
          type: play.type,
          team: play.team?.id || '',
          description: play.text || ''
        }));
      if (mounted) setTimeline(events);
    }

    fetchTimeline();
    intervalId = setInterval(fetchTimeline, refreshInterval * 1000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [league, eventId, refreshInterval]);

  return timeline;
}
