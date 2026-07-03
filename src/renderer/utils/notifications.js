/**
 * notifications.js — desktop notifications via the Web Notification API, which
 * Electron surfaces as native OS toasts and browsers show natively too.
 */
import { useUserStore } from '../store/userStore';
import { isDueToday, isOverdue, todayKey, dueTime } from './dateHelpers';
import { priorityRank } from './taskHelpers';

export function permission() {
  return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
}

export function supported() {
  return typeof Notification !== 'undefined';
}

export async function requestPermission() {
  if (!supported()) return 'denied';
  try {
    return await Notification.requestPermission();
  } catch (_) {
    return 'denied';
  }
}

export function enabled() {
  return (
    useUserStore.getState().settings.notifications === true &&
    permission() === 'granted'
  );
}

export function notify(title, body, opts = {}) {
  if (!supported() || permission() !== 'granted') return;
  try {
    // eslint-disable-next-line no-new
    new Notification(title, { body, silent: false, ...opts });
  } catch (_) {
    /* notification failed */
  }
}

export function testNotification() {
  notify(
    '🔥 Momentum',
    "Notifications are on. You'll get a daily briefing of your top tasks."
  );
}

/** Compose a morning-briefing message from the current tasks, or null. */
export function buildBriefing(tasks) {
  const active = tasks.filter((t) => !t.isCompleted);
  const overdue = active.filter((t) => isOverdue(t));
  const today = active.filter((t) => isDueToday(t.dueDate) || !t.dueDate);
  const total = overdue.length + today.length;
  if (total === 0) return null;

  const top = [...overdue, ...today].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority)
  )[0];

  const parts = [];
  if (overdue.length) parts.push(`${overdue.length} overdue`);
  if (today.length) parts.push(`${today.length} for today`);

  return {
    title: `Good day, ${total} task${total === 1 ? '' : 's'} on deck`,
    body: `${parts.join(' · ')}. Start with: ${top.title}`,
  };
}

/** Show the daily briefing at most once per day. */
export function maybeDailyBriefing(tasks) {
  if (!enabled()) return;
  const { settings, setSetting } = useUserStore.getState();
  const today = todayKey();
  if (settings.lastBriefing === today) return;
  const briefing = buildBriefing(tasks);
  if (briefing) notify(briefing.title, briefing.body);
  setSetting('lastBriefing', today);
}

// ---------------------------------------------------------------------------
// Due-time reminders ("start focus at X")
// ---------------------------------------------------------------------------

const REMINDED_KEY = 'momentum:reminded';

function loadReminded() {
  try {
    return new Set(JSON.parse(localStorage.getItem(REMINDED_KEY)) || []);
  } catch (_) {
    return new Set();
  }
}
function saveReminded(set) {
  try {
    // Keep the most recent keys only so it can't grow without bound.
    localStorage.setItem(REMINDED_KEY, JSON.stringify([...set].slice(-200)));
  } catch (_) {
    /* storage unavailable */
  }
}

/**
 * Which tasks have reached their due time and haven't been reminded yet? Pure,
 * so it's easy to test. Only tasks with a specific time fire an individual
 * reminder (date-only tasks are covered by the daily briefing). A reminder is
 * eligible from the due time up to `windowMs` afterward, so a task whose time
 * passed while the app was closed still surfaces once on next launch.
 */
export function dueReminders(tasks, nowMs, reminded, leadMs = 0, windowMs = 6 * 60 * 60 * 1000) {
  const out = [];
  for (const t of tasks) {
    if (t.isCompleted || !t.dueDate || !dueTime(t.dueDate)) continue;
    const due = new Date(t.dueDate).getTime();
    if (Number.isNaN(due)) continue;
    const key = `${t.id}@${due}`;
    if (reminded.has(key)) continue;
    // Fire `leadMs` before the due time (0 = at the due time).
    const trigger = due - leadMs;
    if (trigger <= nowMs && nowMs - trigger <= windowMs) out.push({ task: t, key });
  }
  return out;
}

/** Fire a desktop reminder for any timed task that has come due (or is due soon
    per the user's lead-time setting). */
export function maybeFireReminders(tasks) {
  if (!enabled()) return;
  const reminded = loadReminded();
  const lead = (useUserStore.getState().settings.reminderLead || 0) * 60 * 1000;
  const due = dueReminders(tasks, Date.now(), reminded, lead);
  if (!due.length) return;
  for (const { task, key } of due) {
    notify('Time to focus', `${task.title} is due at ${dueTime(task.dueDate)}.`);
    reminded.add(key);
  }
  saveReminded(reminded);
}
