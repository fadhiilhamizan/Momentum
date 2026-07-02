/**
 * motivation.js — short, rotating encouragements for the Today view.
 *
 * A message is chosen fresh on every visit, weighted by the user's current
 * context (time of day, streak, and how their day is going) so it speaks to
 * their timeline rather than showing a static quote.
 */

const GENERAL = [
  "Small steps, big momentum.",
  "Done is better than perfect.",
  "One task at a time is how everything gets built.",
  "Progress compounds. Show up today.",
  "You don't have to be great to start, but you have to start.",
  "Focus on the next right thing.",
  "Action beats overthinking, every time.",
  "Your future self is watching. Make them proud.",
  "The second best time to start is right now.",
  "Consistency turns effort into identity.",
];

const MORNING = [
  "A fresh morning, a fresh page. What matters most today?",
  "Win the morning and the day follows.",
  "Start light, build heat. Pick one thing.",
  "Morning clarity is a superpower. Use it.",
];

const AFTERNOON = [
  "The afternoon rewards momentum. Keep it rolling.",
  "Halfway through the day. One more good push.",
  "Beat the slump with a quick, satisfying win.",
];

const EVENING = [
  "Finish strong. Close one loop before you rest.",
  "A calm evening is earned. Wrap up something small.",
  "Set tomorrow up for a win before the day ends.",
];

const STREAK = [
  "Your streak is alive. Protect it with one small win.",
  "Don't break the chain. Add today's link.",
  "Streaks are built one honest day at a time.",
];

const ALL_DONE = [
  "Everything's done. That's what momentum feels like.",
  "Cleared the deck. Rest, or get a head start on tomorrow.",
  "Nothing left for today. Beautifully done.",
];

const FRESH_START = [
  "A clean slate. Add the one thing that would make today count.",
  "Every big goal starts with a single task. Add it.",
  "What's one move your future self will thank you for?",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Choose a motivation for the current moment.
 * ctx: { streak, allDone, empty }
 */
export function getMotivation(ctx = {}) {
  const { streak = 0, allDone = false, empty = false } = ctx;
  const hour = new Date().getHours();

  const pool = [...GENERAL];
  if (hour < 12) pool.push(...MORNING);
  else if (hour < 18) pool.push(...AFTERNOON);
  else pool.push(...EVENING);

  // Weight the context-specific pools so the message usually fits the moment.
  if (allDone) pool.push(...ALL_DONE, ...ALL_DONE);
  else if (empty) pool.push(...FRESH_START, ...FRESH_START);
  else if (streak > 0) pool.push(...STREAK, ...STREAK);

  return pick(pool);
}
