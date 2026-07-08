import { describe, it, expect } from 'vitest';
import { formatGameTime } from '../sportsApi';

// Shared status builders
const status = (type, opts = {}) => ({
  type,
  completed: opts.completed ?? false,
  displayClock: opts.clock ?? '',
  period: opts.period ?? 1,
  ...opts
});

const liveStatus   = (clock, period, type = 'STATUS_IN_PROGRESS') => status(type, { clock, period });
const finalStatus  = () => status('STATUS_FINAL', { completed: true, clock: '', period: 0 });
const schedStatus  = () => status('STATUS_SCHEDULED');

// ─── penalty shootout ─────────────────────────────────────────────────────────

describe('formatGameTime — penalty shootout', () => {
  it('returns "Penalty Shootout" for STATUS_PENALTIES regardless of period', () => {
    const s = liveStatus('90:00', 5, 'STATUS_PENALTIES');
    expect(formatGameTime(new Date(), s, 'bundesliga1')).toBe('Penalty Shootout');
  });

  it('returns "Penalty Shootout" for STATUS_SHOOTOUT', () => {
    const s = liveStatus('', 5, 'STATUS_SHOOTOUT');
    expect(formatGameTime(new Date(), s, 'mls')).toBe('Penalty Shootout');
  });
});

// ─── extra time ───────────────────────────────────────────────────────────────

describe('formatGameTime — extra time', () => {
  it('shows "ET" instead of period number during STATUS_EXTRA_TIME', () => {
    const s = liveStatus('105:00', 3, 'STATUS_EXTRA_TIME');
    const result = formatGameTime(new Date(), s, 'bundesliga1');
    expect(result).toContain('ET');
    expect(result).not.toMatch(/Period \d/);
  });

  it('shows "ET" during STATUS_OVERTIME', () => {
    const s = liveStatus('95:00', 3, 'STATUS_OVERTIME');
    const result = formatGameTime(new Date(), s, 'mls');
    expect(result).toContain('ET');
  });
});

// ─── normal in-progress ───────────────────────────────────────────────────────

describe('formatGameTime — in-progress', () => {
  it('shows clock and period during regular play', () => {
    const s = liveStatus('32:15', 2);
    const result = formatGameTime(new Date(), s, 'nhl');
    expect(result).toContain('32:15');
    expect(result).toContain('Period 2');
  });

  it('returns "Live" when displayClock is empty', () => {
    const s = liveStatus('', 1);
    expect(formatGameTime(new Date(), s, 'nhl')).toBe('Live');
  });
});

// ─── final ────────────────────────────────────────────────────────────────────

describe('formatGameTime — final', () => {
  it('returns "Final" for completed games', () => {
    expect(formatGameTime(new Date(), finalStatus(), 'nhl')).toBe('Final');
  });
});

// ─── MLB-specific ─────────────────────────────────────────────────────────────

describe('formatGameTime — MLB', () => {
  it('returns empty string for live MLB games', () => {
    const s = liveStatus('2:15', 9);
    expect(formatGameTime(new Date(), s, 'mlb')).toBe('');
  });

  it('returns empty string for final MLB games', () => {
    expect(formatGameTime(new Date(), finalStatus(), 'mlb')).toBe('');
  });

  it('returns formatted time for scheduled MLB games', () => {
    const future = new Date();
    future.setHours(19, 5, 0, 0);
    const result = formatGameTime(future, schedStatus(), 'mlb');
    expect(result).toMatch(/\d+:\d{2}/);
  });
});

// ─── scheduled ────────────────────────────────────────────────────────────────

describe('formatGameTime — scheduled', () => {
  it('returns a formatted time string for scheduled games', () => {
    const future = new Date();
    future.setHours(19, 0, 0, 0);
    const result = formatGameTime(future, schedStatus(), 'nfl');
    expect(result).toMatch(/\d+:\d{2}/);
  });
});
