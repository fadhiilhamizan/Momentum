/** recurrence.js — recurring-task option list and next-date computation. */

export const RECURRENCE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
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
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    default:
      return dueDate || null;
  }
  return d.toISOString();
}
