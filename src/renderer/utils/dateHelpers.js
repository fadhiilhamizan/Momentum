import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  parseISO,
  differenceInCalendarDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  addDays,
} from 'date-fns';

export function parse(dateStr) {
  if (!dateStr) return null;
  try {
    return typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  } catch (_) {
    return null;
  }
}

/** Human label for a due date: "Today", "Tomorrow", "Mon", or "Mar 4". */
export function dueLabel(dateStr) {
  const d = parse(dateStr);
  if (!d) return null;
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  const diff = differenceInCalendarDays(d, new Date());
  if (diff > 0 && diff < 7) return format(d, 'EEE');
  return format(d, 'MMM d');
}

export function isDueToday(dateStr) {
  const d = parse(dateStr);
  return d ? isToday(d) : false;
}

export function isOverdue(task) {
  if (task.isCompleted) return false;
  const d = parse(task.dueDate);
  if (!d) return false;
  return isPast(endOfDay(d)) && !isToday(d);
}

/** Urgency class for styling: 'past' | 'urgent' | ''. */
export function dueUrgency(task) {
  if (task.isCompleted) return '';
  const d = parse(task.dueDate);
  if (!d) return '';
  if (isOverdue(task)) return 'past';
  if (isToday(d) || isTomorrow(d)) return 'urgent';
  return '';
}

export function isInThisWeek(dateStr) {
  const d = parse(dateStr);
  if (!d) return false;
  return isWithinInterval(d, {
    start: startOfDay(new Date()),
    end: endOfDay(addDays(new Date(), 6)),
  });
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function timeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

export function todayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function fullDate(date = new Date()) {
  return format(date, 'EEEE, MMMM d');
}
