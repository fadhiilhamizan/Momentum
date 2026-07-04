import { describe, it, expect } from 'vitest';
import {
  projectBreakdown, periodDays, insights, completionsByDay, weeklyReview,
} from '../src/renderer/utils/analyticsHelpers.js';

describe('periodDays', () => {
  it('maps periods to day counts', () => {
    expect(periodDays('week')).toBe(7);
    expect(periodDays('month')).toBe(30);
    expect(periodDays('year')).toBe(365);
    expect(periodDays('???')).toBe(30);
  });
});

describe('projectBreakdown', () => {
  it('groups completed tasks by project, sorted desc', () => {
    const tasks = [
      { isCompleted: true, projectId: 'p1' },
      { isCompleted: true, projectId: 'p1' },
      { isCompleted: true, projectId: null },
      { isCompleted: false, projectId: 'p1' },
    ];
    const projects = [{ id: 'p1', name: 'Launch', color: '#fff' }];
    const out = projectBreakdown(tasks, projects);
    expect(out[0]).toMatchObject({ name: 'Launch', value: 2 });
    expect(out.find((b) => b.name === 'No project').value).toBe(1);
  });
});

describe('insights', () => {
  it('asks for more data when there are few completions', () => {
    expect(insights([])).toHaveLength(1);
    expect(insights([])[0]).toMatch(/personalized insights/i);
  });

  it('produces insights once there is enough history', () => {
    const now = new Date().toISOString();
    const tasks = Array.from({ length: 5 }, () => ({ isCompleted: true, completedDate: now }));
    expect(insights(tasks).length).toBeGreaterThanOrEqual(2);
  });
});

describe('completionsByDay', () => {
  it('returns a zero-filled series of the requested length', () => {
    const series = completionsByDay([], 7);
    expect(series).toHaveLength(7);
    expect(series.every((d) => d.count === 0)).toBe(true);
  });

  it('counts a completion on its day', () => {
    const now = new Date().toISOString();
    const series = completionsByDay([{ isCompleted: true, completedDate: now }], 7);
    expect(series[series.length - 1].count).toBe(1);
  });
});

describe('weeklyReview', () => {
  const done = (d) => ({ isCompleted: true, completedDate: new Date(d).toISOString() });

  it('counts completions within the current week only', () => {
    const now = new Date('2026-07-08T12:00:00'); // Wednesday
    const tasks = [
      done('2026-07-06T10:00:00'), // Monday (this week)
      done('2026-07-08T10:00:00'), // Wednesday (today)
      done('2026-06-30T10:00:00'), // last week
      { isCompleted: false },
    ];
    const r = weeklyReview(tasks, 0, now);
    expect(r.completed).toBe(2);
    expect(r.byDay).toHaveLength(7);
    expect(r.activeDays).toBe(2);
    expect(r.topDay).toBeTruthy();
  });

  it('handles an empty week', () => {
    const r = weeklyReview([], 0, new Date('2026-07-08T12:00:00'));
    expect(r.completed).toBe(0);
    expect(r.activeDays).toBe(0);
    expect(r.topDay).toBe(null);
  });
});
