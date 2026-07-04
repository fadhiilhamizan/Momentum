import { describe, it, expect } from 'vitest';
import { addDays, startOfDay } from 'date-fns';
import { parseTaskInput } from '../src/renderer/utils/nlp.js';

describe('parseTaskInput', () => {
  it('extracts tags and strips them from the title', () => {
    const r = parseTaskInput('Email the team #work #urgent');
    expect(r.title).toBe('Email the team');
    expect(r.tags).toEqual(['work', 'urgent']);
  });

  it('extracts named priority', () => {
    const r = parseTaskInput('Fix bug !high');
    expect(r.priority).toBe('High');
    expect(r.title).toBe('Fix bug');
  });

  it('extracts bang-shorthand priority', () => {
    expect(parseTaskInput('Ship it !!!').priority).toBe('Critical');
    expect(parseTaskInput('Review !!').priority).toBe('High');
  });

  it('parses "tomorrow 3pm" into a due date and time', () => {
    const r = parseTaskInput('Draft report tomorrow 3pm');
    expect(r.title).toBe('Draft report');
    const d = new Date(r.dueDate);
    expect(d.getHours()).toBe(15);
    const expected = startOfDay(addDays(new Date(), 1));
    expect(d.getFullYear()).toBe(expected.getFullYear());
    expect(d.getMonth()).toBe(expected.getMonth());
    expect(d.getDate()).toBe(expected.getDate());
  });

  it('parses a weekday name', () => {
    const r = parseTaskInput('Standup monday');
    expect(r.title).toBe('Standup');
    expect(new Date(r.dueDate).getDay()).toBe(1);
  });

  it('parses 24-hour times', () => {
    const r = parseTaskInput('Call at 15:30');
    const d = new Date(r.dueDate);
    expect(d.getHours()).toBe(15);
    expect(d.getMinutes()).toBe(30);
  });

  it('combines everything and keeps a clean title', () => {
    const r = parseTaskInput('Draft the Q3 report tomorrow 3pm #work !high');
    expect(r.title).toBe('Draft the Q3 report');
    expect(r.tags).toEqual(['work']);
    expect(r.priority).toBe('High');
    expect(r.dueDate).toBeTruthy();
  });

  it('leaves plain titles untouched', () => {
    const r = parseTaskInput('Buy milk');
    expect(r.title).toBe('Buy milk');
    expect(r.tags).toEqual([]);
    expect(r.priority).toBe(null);
    expect(r.dueDate).toBe(null);
  });
});
