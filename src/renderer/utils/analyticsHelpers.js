/**
 * analyticsHelpers.js — derive productivity analytics from the task list.
 *
 * Everything is computed from tasks' `completedDate`, so it works identically
 * in Electron (SQLite) and the browser (localStorage) without extra queries.
 */
import {
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
  eachDayOfInterval,
  subDays,
  getDay,
  getHours,
  isAfter,
} from 'date-fns';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export const PERIODS = [
  { value: 'week', label: 'Week', days: 7 },
  { value: 'month', label: 'Month', days: 30 },
  { value: 'year', label: 'Year', days: 365 },
];

function completedDates(tasks) {
  const dates = [];
  for (const t of tasks) {
    if (t.isCompleted && t.completedDate) {
      const d = parseISO(t.completedDate);
      if (!Number.isNaN(d.getTime())) dates.push(d);
    }
  }
  return dates;
}

/** Completions per day for the last `days` days, zero-filled. */
export function completionsByDay(tasks, days = 30) {
  const counts = {};
  for (const d of completedDates(tasks)) {
    const key = format(d, 'yyyy-MM-dd');
    counts[key] = (counts[key] || 0) + 1;
  }
  const end = startOfDay(new Date());
  const start = subDays(end, days - 1);
  return eachDayOfInterval({ start, end }).map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    return {
      date: key,
      label: format(day, days > 60 ? 'MMM' : 'MMM d'),
      shortLabel: format(day, 'd'),
      count: counts[key] || 0,
    };
  });
}

/** GitHub-style contribution grid for the last `weeks` weeks. */
export function heatmap(tasks, weeks = 13) {
  const counts = {};
  for (const d of completedDates(tasks)) {
    const key = format(d, 'yyyy-MM-dd');
    counts[key] = (counts[key] || 0) + 1;
  }
  const today = startOfDay(new Date());
  const start = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end: today });

  const columns = [];
  let max = 0;
  days.forEach((day) => {
    const wd = getDay(day);
    // Start a new column at the beginning of each week (Sunday).
    if (wd === 0 || columns.length === 0) {
      columns.push({ month: format(day, 'MMM'), cells: new Array(7).fill(null) });
    }
    const col = columns[columns.length - 1];
    const key = format(day, 'yyyy-MM-dd');
    const count = counts[key] || 0;
    max = Math.max(max, count);
    col.cells[wd] = { date: key, count, label: format(day, 'MMM d') };
  });
  return { columns, max, weekdays: WEEKDAYS };
}

/** Completed tasks grouped by project, for a donut chart. */
export function projectBreakdown(tasks, projects) {
  const byId = {};
  for (const t of tasks) {
    if (!t.isCompleted) continue;
    const id = t.projectId || '__none__';
    byId[id] = (byId[id] || 0) + 1;
  }
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  return Object.entries(byId)
    .map(([id, value]) => {
      if (id === '__none__') return { name: 'No project', value, color: '#8b8680' };
      const p = projectMap[id];
      return { name: p ? p.name : 'Unknown', value, color: p ? p.color : '#8b8680' };
    })
    .sort((a, b) => b.value - a.value);
}

/** Short natural-language insights about productivity patterns. */
export function insights(tasks) {
  const dates = completedDates(tasks);
  const out = [];
  if (dates.length < 3) {
    out.push('Complete a few more tasks to unlock personalized insights.');
    return out;
  }

  // Most productive weekday.
  const byWeekday = new Array(7).fill(0);
  const byBucket = { Morning: 0, Afternoon: 0, Evening: 0 };
  for (const d of dates) {
    byWeekday[getDay(d)] += 1;
    const h = getHours(d);
    byBucket[h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'] += 1;
  }
  const topDay = byWeekday.indexOf(Math.max(...byWeekday));
  out.push(`You're most productive on ${WEEKDAYS_FULL[topDay]}s.`);

  const topBucket = Object.entries(byBucket).sort((a, b) => b[1] - a[1])[0];
  if (topBucket[1] > 0) out.push(`Most of your tasks get done in the ${topBucket[0].toLowerCase()}.`);

  // Last 7 days momentum.
  const weekAgo = subDays(new Date(), 7);
  const recent = dates.filter((d) => isAfter(d, weekAgo)).length;
  out.push(`${recent} task${recent === 1 ? '' : 's'} completed in the last 7 days.`);

  return out;
}

export function periodDays(period) {
  const p = PERIODS.find((x) => x.value === period);
  return p ? p.days : 30;
}
