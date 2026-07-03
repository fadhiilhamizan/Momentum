/**
 * recurrence.js — recurring-task options and next-date math.
 *
 * This lives in `src/shared` because BOTH the Electron main process
 * (database.js) and the renderer (task UI + the browser-mock in api.js) need
 * the exact same "advance a due date by one period" logic. Keeping a single
 * copy here prevents the two data layers from drifting apart.
 */

export const RECURRENCE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Every weekday (Mon-Fri)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'monthly-end', label: 'Last day of month' },
];

export function recurrenceLabel(pattern) {
  const o = RECURRENCE_OPTIONS.find((x) => x.value === pattern);
  return o && o.value ? o.label : null;
}

/**
 * Given an ISO date string (or null) and a pattern, return the next occurrence
 * as an ISO date string. Falls back to today as the base when no date is set.
 */
export function nextDueDate(dueDate, pattern) {
  const base = dueDate ? new Date(dueDate) : new Date();
  const d = new Date(base.getTime());
  switch (pattern) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekdays':
      // Next weekday, skipping Saturday/Sunday.
      d.setDate(d.getDate() + 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'monthly-end':
      // Day 0 of (month + 2) resolves to the last day of the next month,
      // preserving the time of day.
      d.setMonth(d.getMonth() + 2, 0);
      break;
    default:
      return dueDate || null;
  }
  return d.toISOString();
}
