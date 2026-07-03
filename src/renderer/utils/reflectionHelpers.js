/**
 * reflectionHelpers.js — derive mood/reflection trends for Analytics.
 *
 * Moods are stored as stable keys ('rough'..'great'); older entries may still
 * hold the original emoji, which we map back so historical data keeps counting.
 */
import { format, addDays } from 'date-fns';

const MOOD_ORDER = ['rough', 'meh', 'okay', 'good', 'great'];
const LEGACY_MOOD = { '😔': 'rough', '😐': 'meh', '🙂': 'okay', '😄': 'good', '🔥': 'great' };
const MOOD_LABEL = { rough: 'Rough', meh: 'Meh', okay: 'Okay', good: 'Good', great: 'On fire' };

export function moodKey(mood) {
  if (!mood) return null;
  return LEGACY_MOOD[mood] || mood;
}
/** 1..5, or null if the mood is unknown/absent. */
export function moodValue(mood) {
  const i = MOOD_ORDER.indexOf(moodKey(mood));
  return i === -1 ? null : i + 1;
}
export function moodLabel(mood) {
  return MOOD_LABEL[moodKey(mood)] || null;
}

const fmt = (d) => format(d, 'yyyy-MM-dd');

/** Trends from a list of reflections (each `{ date, mood, ... }`). */
export function reflectionStats(reflections = []) {
  const withDate = reflections.filter((r) => r && r.date);
  const dates = new Set(withDate.map((r) => r.date));
  const count = dates.size;

  // Current streak: consecutive days with a reflection, ending today (or
  // yesterday if today hasn't been logged yet).
  let streak = 0;
  const has = (d) => dates.has(fmt(d));
  const today = new Date();
  if (has(today) || has(addDays(today, -1))) {
    let cur = has(today) ? today : addDays(today, -1);
    while (has(cur)) {
      streak += 1;
      cur = addDays(cur, -1);
    }
  }

  const moodSeries = withDate
    .filter((r) => moodValue(r.mood) != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ date: r.date, value: moodValue(r.mood), mood: moodLabel(r.mood) }));

  const avgMood = moodSeries.length
    ? moodSeries.reduce((s, m) => s + m.value, 0) / moodSeries.length
    : null;

  return { count, streak, moodSeries, avgMood };
}
