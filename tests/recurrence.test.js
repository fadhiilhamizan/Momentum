import { describe, it, expect } from 'vitest';
import { nextDueDate, RECURRENCE_OPTIONS, recurrenceLabel } from '../src/shared/recurrence.js';

const base = '2026-07-15T09:00:00.000Z'; // a Wednesday, 9am UTC (tz-safe)
const dayOf = (iso) => new Date(iso).toISOString().slice(0, 10);

describe('nextDueDate', () => {
  it('advances daily by one day', () => {
    expect(dayOf(nextDueDate(base, 'daily'))).toBe('2026-07-16');
  });

  it('advances weekly by 7 days', () => {
    expect(dayOf(nextDueDate(base, 'weekly'))).toBe('2026-07-22');
  });

  it('advances biweekly by 14 days', () => {
    expect(dayOf(nextDueDate(base, 'biweekly'))).toBe('2026-07-29');
  });

  it('advances monthly by one month', () => {
    expect(dayOf(nextDueDate(base, 'monthly'))).toBe('2026-08-15');
  });

  it('weekdays skips the weekend', () => {
    // 2026-07-17 is a Friday -> next weekday is Monday 2026-07-20
    expect(dayOf(nextDueDate('2026-07-17T09:00:00.000Z', 'weekdays'))).toBe('2026-07-20');
    // mid-week advances by a single day
    expect(dayOf(nextDueDate(base, 'weekdays'))).toBe('2026-07-16');
  });

  it('monthly-end lands on the last day of the next month', () => {
    expect(dayOf(nextDueDate(base, 'monthly-end'))).toBe('2026-08-31');
  });

  it('preserves the time of day', () => {
    expect(nextDueDate(base, 'daily')).toContain('T09:00');
  });

  it('returns the original date for an unknown pattern', () => {
    expect(nextDueDate(base, '')).toBe(base);
    expect(nextDueDate(null, 'nope')).toBe(null);
  });
});

describe('RECURRENCE_OPTIONS', () => {
  it('includes the newer presets', () => {
    const values = RECURRENCE_OPTIONS.map((o) => o.value);
    expect(values).toEqual(expect.arrayContaining(['weekdays', 'biweekly', 'monthly-end']));
  });

  it('recurrenceLabel maps a value to its label', () => {
    expect(recurrenceLabel('weekly')).toBe('Weekly');
    expect(recurrenceLabel('')).toBe(null);
  });
});
