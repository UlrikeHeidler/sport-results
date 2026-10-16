import { isGameFinal, isGameInBreak, isGameOngoing, isGameScheduled } from '../config/constants';
import { getLiveStateLabel } from './normalizeStatus';

export const getBreakLabel = status => {
  if (!status || !status.type) return 'Break';

  const breakLabels = {
    STATUS_HALFTIME: 'Halftime',
    STATUS_HALFTIME_ET: 'Halftime (ET)',
    STATUS_END_OF_REGULATION: 'End of Regulation',
    STATUS_END_PERIOD: 'End of Period',
    STATUS_BREAK: 'Break',
    STATUS_INTERMISSION: 'Intermission'
  };

  return breakLabels[status.type] || 'Break';
};

const formatGameTimeWithBreakLabel = (date, status, league, breakLabel) => {
  try {
    if (league && String(league).toLowerCase() === 'mlb') {
      if (isGameOngoing(status) || isGameFinal(status)) return '';
      if (date instanceof Date) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      return String(date);
    }

    if (isGameFinal(status)) return 'Final';
    if (isGameInBreak(status)) return breakLabel(status);

    if (isGameOngoing(status)) {
      if (status.type === 'STATUS_PENALTIES' || status.type === 'STATUS_SHOOTOUT') {
        return 'Penalty Shootout';
      }
      const clock = `${status.displayClock || ''}`.trim();
      if (!clock) return 'Live';
      const periodLabel = status.type === 'STATUS_EXTRA_TIME' || status.type === 'STATUS_OVERTIME'
        ? 'ET'
        : `Period ${status.period}`;
      return `${clock} - ${periodLabel}`;
    }

    if (isGameScheduled(status)) {
      if (date instanceof Date) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      return String(date);
    }

    return status && status.type
      ? String(status.type).replace('STATUS_', '').replace('_', ' ')
      : '';
  } catch (error) {
    console.error('formatGameTime error', error, date, status, league);
    return '';
  }
};

export const formatGameTime = (date, status = {}, league = '') =>
  formatGameTimeWithBreakLabel(date, status, league, getLiveStateLabel);

export const formatGameTimeForGameHelpers = (date, status = {}, league = '') =>
  formatGameTimeWithBreakLabel(date, status, league, getBreakLabel);

export const getStatusClass = status => {
  if (isGameFinal(status)) return 'final';
  if (isGameOngoing(status)) return 'live';
  return 'scheduled';
};
