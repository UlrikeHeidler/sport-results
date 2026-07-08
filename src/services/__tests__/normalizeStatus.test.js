import { describe, it, expect } from 'vitest';
import { normalizeStatus, getLiveStateLabel } from '../normalizeStatus';

// ─── normalizeStatus ──────────────────────────────────────────────────────────

describe('normalizeStatus', () => {
  it('maps a live status type through unchanged', () => {
    const result = normalizeStatus({
      type: { name: 'STATUS_IN_PROGRESS', completed: false },
      displayClock: '12:34',
      period: 2
    });
    expect(result.type).toBe('STATUS_IN_PROGRESS');
    expect(result.displayClock).toBe('12:34');
    expect(result.period).toBe(2);
    expect(result.completed).toBe(false);
  });

  it('marks a completed game as completed', () => {
    const result = normalizeStatus({
      type: { name: 'STATUS_FINAL', completed: true },
      displayClock: '',
      period: 4
    });
    expect(result.completed).toBe(true);
  });

  it('treats state=post as completed when type.completed is false', () => {
    const result = normalizeStatus({
      type: { name: 'STATUS_FINAL', completed: false },
      state: 'post',
      displayClock: '',
      period: 4
    });
    expect(result.completed).toBe(true);
  });

  it('falls back to clock when displayClock is missing', () => {
    const result = normalizeStatus({
      type: { name: 'STATUS_IN_PROGRESS', completed: false },
      clock: '8:00',
      period: 1
    });
    expect(result.displayClock).toBe('8:00');
  });

  it('defaults period to 0 when absent', () => {
    const result = normalizeStatus({
      type: { name: 'STATUS_SCHEDULED', completed: false }
    });
    expect(result.period).toBe(0);
  });

  it('handles STATUS_PENALTIES (penalty shootout)', () => {
    const result = normalizeStatus({
      type: { name: 'STATUS_PENALTIES', completed: false },
      displayClock: '',
      period: 5
    });
    expect(result.type).toBe('STATUS_PENALTIES');
    expect(result.completed).toBe(false);
  });

  it('handles STATUS_FINAL_PEN', () => {
    const result = normalizeStatus({
      type: { name: 'STATUS_FINAL_PEN', completed: true },
      displayClock: '',
      period: 5
    });
    expect(result.type).toBe('STATUS_FINAL_PEN');
    expect(result.completed).toBe(true);
  });

  it('handles STATUS_END_OF_REGULATION', () => {
    const result = normalizeStatus({
      type: { name: 'STATUS_END_OF_REGULATION', completed: false },
      displayClock: '',
      period: 2
    });
    expect(result.type).toBe('STATUS_END_OF_REGULATION');
  });
});

// ─── getLiveStateLabel ────────────────────────────────────────────────────────

describe('getLiveStateLabel', () => {
  it('returns empty string for null/undefined', () => {
    expect(getLiveStateLabel(null)).toBe('');
    expect(getLiveStateLabel(undefined)).toBe('');
  });

  it('maps STATUS_OVERTIME to "Overtime"', () => {
    expect(getLiveStateLabel({ type: 'STATUS_OVERTIME' })).toBe('Overtime');
  });

  it('maps STATUS_HALFTIME to "Halftime"', () => {
    expect(getLiveStateLabel({ type: 'STATUS_HALFTIME' })).toBe('Halftime');
  });

  it('maps STATUS_HALFTIME_ET to "Halftime (ET)"', () => {
    expect(getLiveStateLabel({ type: 'STATUS_HALFTIME_ET' })).toBe('Halftime (ET)');
  });

  it('appends period number for STATUS_END_PERIOD', () => {
    const label = getLiveStateLabel({ type: 'STATUS_END_PERIOD', period: 2 });
    expect(label).toContain('2');
  });

  it('falls back to a readable string for unknown status types', () => {
    const label = getLiveStateLabel({ type: 'STATUS_SOME_NEW_TYPE' });
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });
});
