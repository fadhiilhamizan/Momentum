/**
 * nlp.js — light natural-language parsing for the quick-add input.
 *
 * Pulls tags (#work), priority (!high or !!!), a date (today / tomorrow /
 * weekday / "in N days" / "next week") and a time (3pm, 3:30pm, 15:00) out of a
 * typed title, returning the cleaned title plus the extracted fields. Pure and
 * deterministic, so it's easy to test.
 */
import {
  addDays, nextDay, startOfDay, setHours, setMinutes, setSeconds, setMilliseconds,
} from 'date-fns';

const PRIORITY_WORDS = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', someday: 'Someday',
};
const WEEKDAYS = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tues: 2, tue: 2,
  wednesday: 3, wed: 3, thursday: 4, thurs: 4, thu: 4, friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

function withTime(date, h, m) {
  return setMilliseconds(setSeconds(setMinutes(setHours(date, h), m), 0), 0);
}

export function parseTaskInput(text) {
  let s = ` ${text} `;
  const tags = [];
  let priority = null;
  let dateBase = null;
  let time = null;

  // #tags
  s = s.replace(/(^|\s)#([\w-]+)/g, (_m, pre, tag) => {
    tags.push(tag);
    return pre;
  });

  // Priority: named (!high) then bang shorthand (!! / !!!)
  s = s.replace(/(^|\s)!(critical|high|medium|low|someday)\b/gi, (_m, pre, w) => {
    priority = PRIORITY_WORDS[w.toLowerCase()];
    return pre;
  });
  s = s.replace(/(^|\s)(!{1,3})(?=\s|$)/g, (_m, pre, bangs) => {
    if (!priority) priority = bangs.length >= 3 ? 'Critical' : 'High';
    return pre;
  });

  // Dates
  s = s.replace(/(^|\s)today\b/i, (_m, pre) => {
    dateBase = startOfDay(new Date());
    return pre;
  });
  s = s.replace(/(^|\s)tomorrow\b/i, (_m, pre) => {
    dateBase = startOfDay(addDays(new Date(), 1));
    return pre;
  });
  s = s.replace(/(^|\s)tonight\b/i, (_m, pre) => {
    dateBase = startOfDay(new Date());
    if (!time) time = { h: 20, m: 0 };
    return pre;
  });
  s = s.replace(/(^|\s)in\s+(\d+)\s+days?\b/i, (_m, pre, n) => {
    dateBase = startOfDay(addDays(new Date(), parseInt(n, 10)));
    return pre;
  });
  s = s.replace(/(^|\s)next\s+week\b/i, (_m, pre) => {
    dateBase = startOfDay(addDays(new Date(), 7));
    return pre;
  });
  s = s.replace(
    /(^|\s)(?:next\s+|on\s+)?(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thu|friday|fri|saturday|sat)\b/i,
    (_m, pre, wd) => {
      const dow = WEEKDAYS[wd.toLowerCase()];
      if (dow != null) dateBase = startOfDay(nextDay(new Date(), dow));
      return pre;
    }
  );

  // Times
  s = s.replace(/(^|\s)(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i, (_m, pre, h, min, ap) => {
    let hh = parseInt(h, 10) % 12;
    if (ap.toLowerCase() === 'pm') hh += 12;
    time = { h: hh, m: min ? parseInt(min, 10) : 0 };
    return pre;
  });
  if (!time) {
    s = s.replace(/(^|\s)(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/, (_m, pre, h, min) => {
      time = { h: parseInt(h, 10), m: parseInt(min, 10) };
      return pre;
    });
  }

  let dueDate = null;
  if (dateBase || time) {
    let d = dateBase || startOfDay(new Date());
    if (time) d = withTime(d, time.h, time.m);
    dueDate = d.toISOString();
  }

  const title = s.replace(/\s+/g, ' ').trim();
  return { title, tags, priority, dueDate };
}
