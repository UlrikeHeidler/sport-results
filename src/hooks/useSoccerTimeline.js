import { useEffect, useState } from 'react';
import { fetchGameSummary } from '../services/sportsApi';

/**
 * Hook to fetch and filter timeline events for a soccer game
 * @param {string} league - League key (e.g. 'mls')
 * @param {string} eventId - ESPN event id
 * @param {string|number} snapshotKey - Scoreboard snapshot that triggers a refresh
 * @returns {Array} Array of timeline events: { minute, type, team, description }
 */
export function useSoccerTimeline(league, eventId, snapshotKey) {
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function fetchTimeline() {
      const summary = await fetchGameSummary(league, eventId);
      //console.log('Fetched soccer summary for', eventId, summary);
      if (!summary || !summary.keyEvents) return;
      // console.log('Fetched soccer summary for', eventId, summary);
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

    return () => {
      mounted = false;
    };
  }, [league, eventId, snapshotKey]);

  return timeline;
}
