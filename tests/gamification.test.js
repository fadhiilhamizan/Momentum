import { describe, it, expect } from 'vitest';
import {
  levelFromXp, xpFromCompletions, isStreakMilestone, XP_PER_TASK,
} from '../src/renderer/utils/gamification.js';

describe('xpFromCompletions', () => {
  it('is completions x XP_PER_TASK', () => {
    expect(xpFromCompletions(5)).toBe(5 * XP_PER_TASK);
    expect(xpFromCompletions(0)).toBe(0);
  });
});

describe('levelFromXp', () => {
  it('starts at level 1', () => {
    const l = levelFromXp(0);
    expect(l.level).toBe(1);
    expect(l.title).toBe('Beginner');
    expect(l.progress).toBeGreaterThanOrEqual(0);
  });

  it('advances at the square-root thresholds', () => {
    expect(levelFromXp(40).level).toBe(2); // 40 * 1^2
    expect(levelFromXp(160).level).toBe(3); // 40 * 2^2
    expect(levelFromXp(360).level).toBe(4); // 40 * 3^2
  });

  it('reports XP remaining to the next level', () => {
    expect(levelFromXp(0).toNext).toBe(40);
    expect(levelFromXp(40).toNext).toBe(120); // next floor 160 - 40
  });
});

describe('isStreakMilestone', () => {
  it('matches milestone streaks only', () => {
    expect(isStreakMilestone(7)).toBe(true);
    expect(isStreakMilestone(30)).toBe(true);
    expect(isStreakMilestone(5)).toBe(false);
  });
});
