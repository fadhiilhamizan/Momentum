import { describe, it, expect } from 'vitest';
import { format, subDays } from 'date-fns';
import {
  moodValue, moodKey, moodLabel, reflectionStats,
} from '../src/renderer/utils/reflectionHelpers.js';

const key = (d) => format(d, 'yyyy-MM-dd');

describe('mood mapping', () => {
  it('maps keys and legacy emoji to 1..5', () => {
    expect(moodValue('rough')).toBe(1);
    expect(moodValue('great')).toBe(5);
    expect(moodValue('🔥')).toBe(5); // legacy emoji still counts
    expect(moodValue('nope')).toBe(null);
    expect(moodValue(null)).toBe(null);
  });

  it('labels moods (including legacy emoji)', () => {
    expect(moodLabel('okay')).toBe('Okay');
    expect(moodLabel('🙂')).toBe('Okay');
    expect(moodKey('😔')).toBe('rough');
  });
});

describe('reflectionStats', () => {
  it('counts distinct days, streak, and mood series', () => {
    const today = new Date();
    const reflections = [
      { date: key(subDays(today, 2)), mood: 'okay' },
      { date: key(subDays(today, 1)), mood: 'good' },
      { date: key(today), mood: 'great' },
    ];
    const s = reflectionStats(reflections);
    expect(s.count).toBe(3);
    expect(s.streak).toBe(3);
    expect(s.moodSeries.map((m) => m.value)).toEqual([3, 4, 5]);
    expect(s.avgMood).toBeCloseTo(4);
  });

  it('a gap breaks the current streak', () => {
    const today = new Date();
    const s = reflectionStats([
      { date: key(subDays(today, 5)), mood: 'good' },
      { date: key(today), mood: 'great' },
    ]);
    expect(s.count).toBe(2);
    expect(s.streak).toBe(1);
  });

  it('counts a streak that ends yesterday', () => {
    const s = reflectionStats([{ date: key(subDays(new Date(), 1)), mood: 'good' }]);
    expect(s.streak).toBe(1);
  });

  it('handles empty input', () => {
    const s = reflectionStats([]);
    expect(s.count).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.avgMood).toBe(null);
  });
});
