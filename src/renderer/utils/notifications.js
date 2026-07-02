/**
 * notifications.js — desktop notifications via the Web Notification API, which
 * Electron surfaces as native OS toasts and browsers show natively too.
 */
import { useUserStore } from '../store/userStore';
import { isDueToday, isOverdue, todayKey } from './dateHelpers';
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
