/** gamification.js — XP, levels and titles derived from completion counts. */

export const XP_PER_TASK = 10;

const TITLES = [
  'Beginner',
  'Starter',
  'Builder',
  'Achiever',
  'Focused',
  'Consistent',
  'Momentum',
  'Driven',
  'Relentless',
  'Expert',
];

/**
 * Level scales with the square root of XP so early levels come quickly and
 * later ones require sustained effort. Returns the full progression state.
 */
export function levelFromXp(xp) {
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 40)) + 1);
  const currentFloor = 40 * (level - 1) * (level - 1);
  const nextFloor = 40 * level * level;
  const intoLevel = xp - currentFloor;
  const span = nextFloor - currentFloor;
  return {
    level,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
    xp,
    intoLevel,
    span,
    progress: span > 0 ? Math.min(1, intoLevel / span) : 0,
    toNext: Math.max(0, nextFloor - xp),
  };
}

export function xpFromCompletions(count) {
  return count * XP_PER_TASK;
}

/** Streak milestones that unlock a celebration. */
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100];

export function isStreakMilestone(n) {
  return STREAK_MILESTONES.includes(n);
}
