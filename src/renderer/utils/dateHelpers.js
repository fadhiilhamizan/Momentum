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

// Time display format, set from user settings (see App). Kept as a module flag
// so date helpers stay store-agnostic but still honor the 12h/24h preference.
let TIME_24H = false;
export function setTimeFormat(fmt) {
  TIME_24H = fmt === '24h';
}

export function parse(dateStr) {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === 'string') return parseISO(dateStr);
    if (dateStr instanceof Date) return dateStr;
    return null; // ignore malformed values (numbers, objects) rather than crash
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

/** yyyy-MM-dd (local) for an <input type="date">. */
export function toDateInputValue(iso) {
  const d = parse(iso);
  if (!d || Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/** HH:mm (local) for an <input type="time">, or '' when the time is midnight
    (which we treat as "date only, no specific time"). */
export function toTimeInputValue(iso) {
  const d = parse(iso);
  if (!d || Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  const hhmm = new Date(d.getTime() - off * 60000).toISOString().slice(11, 16);
  return hhmm === '00:00' ? '' : hhmm;
}

/** Combine a date (yyyy-MM-dd) and optional time (HH:mm) into a local ISO
    string. Returns null when no date is given; an empty time means midnight. */
export function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T${timeStr || '00:00'}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** "3:30 PM" when a due date carries a specific (non-midnight) time, else null. */
export function dueTime(iso) {
  const d = parse(iso);
  if (!d || Number.isNaN(d.getTime())) return null;
  if (toTimeInputValue(iso) === '') return null;
  return format(d, TIME_24H ? 'HH:mm' : 'h:mm a');
}
