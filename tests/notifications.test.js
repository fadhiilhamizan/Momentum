import { describe, it, expect } from 'vitest';
import { dueReminders } from '../src/renderer/utils/notifications.js';

const iso = (ms) => new Date(ms).toISOString();

describe('dueReminders', () => {
  // Anchor "now" at 2pm local so due times are non-midnight.
  const now = new Date();
  now.setHours(14, 0, 0, 0);
  const nowMs = now.getTime();

  it('returns a timed task that just came due', () => {
    const t = { id: 'a', isCompleted: false, dueDate: iso(nowMs - 5 * 60 * 1000) };
    expect(dueReminders([t], nowMs, new Set()).map((r) => r.task.id)).toEqual(['a']);
  });

  it('skips completed tasks', () => {
    const t = { id: 'a', isCompleted: true, dueDate: iso(nowMs - 5 * 60 * 1000) };
    expect(dueReminders([t], nowMs, new Set())).toEqual([]);
  });

  it('skips date-only (midnight) tasks', () => {
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    const t = { id: 'a', isCompleted: false, dueDate: midnight.toISOString() };
    expect(dueReminders([t], nowMs, new Set())).toEqual([]);
  });

  it('skips already-reminded tasks', () => {
    const due = iso(nowMs - 5 * 60 * 1000);
    const t = { id: 'a', isCompleted: false, dueDate: due };
    const key = `a@${new Date(due).getTime()}`;
    expect(dueReminders([t], nowMs, new Set([key]))).toEqual([]);
  });

  it('respects the lead time', () => {
    const t = { id: 'a', isCompleted: false, dueDate: iso(nowMs + 20 * 60 * 1000) }; // due in 20 min
    expect(dueReminders([t], nowMs, new Set(), 0)).toEqual([]); // not due yet
    const out = dueReminders([t], nowMs, new Set(), 30 * 60 * 1000); // 30-min lead
    expect(out.map((r) => r.task.id)).toEqual(['a']);
  });
});
