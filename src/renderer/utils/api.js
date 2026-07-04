/**
 * api.js — data access for the renderer.
 *
 * In Electron, `window.momentum` (the preload bridge) is present and every call
 * forwards to the SQLite-backed main process. When the app is opened in a plain
 * browser (e.g. the live preview panel) that bridge is missing, so we fall back
 * to a localStorage-backed mock implementing the same async surface. This keeps
 * the UI fully functional for visual iteration without launching Electron.
 */

import { nextDueDate } from './recurrence';
import { resetSubtasks } from '../../shared/subtasks';

const hasBridge = typeof window !== 'undefined' && !!window.momentum;

// --------------------------------------------------------------------------
// localStorage fallback
// --------------------------------------------------------------------------

const LS_KEY = 'momentum:db';

function loadDb() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch (_) {
    return {};
  }
}
function saveDb(dbData) {
  localStorage.setItem(LS_KEY, JSON.stringify(dbData));
}
function defaults() {
  const dbData = loadDb();
  dbData.tasks = dbData.tasks || [];
  dbData.projects = dbData.projects || [];
  dbData.streak = dbData.streak || {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    startDate: null,
  };
  dbData.settings = dbData.settings || {};
  dbData.reflections = dbData.reflections || [];
  return dbData;
}
function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function dayKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

const mock = {
  tasks: {
    async list() {
      const d = defaults();
      return [...d.tasks].sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
    },
    async create(input) {
      const d = defaults();
      const now = new Date().toISOString();
      const task = {
        id: uid(),
        title: 'Untitled task',
        description: null,
        projectId: null,
        priority: 'Medium',
        energyRequired: 'Medium',
        timeEstimate: null,
        bestTime: 'Anytime',
        dueDate: null,
        completedDate: null,
        isCompleted: false,
        isRecurring: false,
        recurrencePattern: null,
        isStarred: false,
        tags: [],
        subtasks: [],
        dependsOn: [],
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      d.tasks.push(task);
      saveDb(d);
      return task;
    },
    async update(id, updates) {
      const d = defaults();
      const i = d.tasks.findIndex((t) => t.id === id);
      if (i === -1) return null;
      d.tasks[i] = { ...d.tasks[i], ...updates, updatedAt: new Date().toISOString() };
      saveDb(d);
      return d.tasks[i];
    },
    async remove(id) {
      const d = defaults();
      d.tasks = d.tasks.filter((t) => t.id !== id);
      saveDb(d);
      return { id };
    },
    async reorder(orderedIds) {
      const d = defaults();
      orderedIds.forEach((id, i) => {
        const t = d.tasks.find((x) => x.id === id);
        if (t) t.sortOrder = i;
      });
      saveDb(d);
      return d.tasks;
    },
    async setCompleted(id, isCompleted) {
      const d = defaults();
      const t = d.tasks.find((x) => x.id === id);
      if (!t) return null;
      const now = new Date().toISOString();
      t.isCompleted = isCompleted;
      t.completedDate = isCompleted ? now : null;
      t.updatedAt = now;
      if (isCompleted) {
        const today = dayKey(now);
        const s = d.streak;
        if (s.lastCompletedDate !== today) {
          if (!s.lastCompletedDate) s.currentStreak = 1;
          else {
            const gap = Math.round(
              (new Date(today) - new Date(s.lastCompletedDate)) / 86400000
            );
            s.currentStreak = gap === 1 ? s.currentStreak + 1 : 1;
          }
          s.longestStreak = Math.max(s.currentStreak, s.longestStreak || 0);
          s.lastCompletedDate = today;
          s.startDate = s.startDate || today;
        }
        // Recurring tasks spawn their next occurrence on completion.
        if (t.isRecurring && t.recurrencePattern) {
          d.tasks.push({
            ...t,
            id: uid(),
            isCompleted: false,
            completedDate: null,
            dueDate: nextDueDate(t.dueDate, t.recurrencePattern),
            subtasks: resetSubtasks(t.subtasks),
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      saveDb(d);
      return t;
    },
  },
  projects: {
    async list() {
      return defaults().projects.filter((p) => !p.isArchived);
    },
    async create(input) {
      const d = defaults();
      const now = new Date().toISOString();
      const p = {
        id: uid(),
        name: 'New project',
        description: null,
        color: '#d4af37',
        isFavorite: false,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      d.projects.push(p);
      saveDb(d);
      return p;
    },
    async update(id, updates) {
      const d = defaults();
      const i = d.projects.findIndex((p) => p.id === id);
      if (i === -1) return null;
      d.projects[i] = { ...d.projects[i], ...updates };
      saveDb(d);
      return d.projects[i];
    },
    async remove(id) {
      const d = defaults();
      d.projects = d.projects.filter((p) => p.id !== id);
      d.tasks.forEach((t) => {
        if (t.projectId === id) t.projectId = null;
      });
      saveDb(d);
      return { id };
    },
  },
  streak: {
    async get() {
      return defaults().streak;
    },
  },
  settings: {
    async get(key, fallback) {
      const d = defaults();
      return key in d.settings ? d.settings[key] : fallback;
    },
    async set(key, value) {
      const d = defaults();
      d.settings[key] = value;
      saveDb(d);
      return value;
    },
    async all() {
      return defaults().settings;
    },
  },
  app: {
    // No Electron here — report the build-time version that webpack's
    // DefinePlugin bakes in (replaced at compile time, no runtime `process`).
    async getVersion() {
      return process.env.APP_VERSION || '0.0.0';
    },
  },
  backup: {
    // Auto-backup writes to the filesystem, which only the desktop app can do.
    async choose() {
      return null;
    },
    async now() {
      return { ok: false, reason: 'unavailable' };
    },
  },
  data: {
    async import(payload = {}) {
      const d = defaults();
      const counts = { projects: 0, tasks: 0, reflections: 0 };
      const upsert = (arr, item, keyFn) => {
        const i = arr.findIndex((x) => keyFn(x) === keyFn(item));
        if (i === -1) arr.push(item);
        else arr[i] = { ...arr[i], ...item };
      };
      (payload.projects || []).forEach((p) => {
        if (!p || !p.id) return;
        upsert(d.projects, p, (x) => x.id);
        counts.projects += 1;
      });
      (payload.tasks || []).forEach((t) => {
        if (!t || !t.id) return;
        upsert(d.tasks, t, (x) => x.id);
        counts.tasks += 1;
      });
      (payload.reflections || []).forEach((r) => {
        if (!r || !r.date) return;
        upsert(d.reflections, r, (x) => x.date);
        counts.reflections += 1;
      });
      if (payload.streak) {
        d.streak = {
          ...d.streak,
          ...payload.streak,
          longestStreak: Math.max(
            payload.streak.longestStreak || 0,
            (d.streak && d.streak.longestStreak) || 0
          ),
        };
      }
      saveDb(d);
      return counts;
    },
    async clear() {
      const d = defaults();
      d.tasks = [];
      d.projects = [];
      d.reflections = [];
      d.streak = {
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        startDate: null,
      };
      saveDb(d);
      return { ok: true };
    },
  },
  reflections: {
    async getByDate(date) {
      return defaults().reflections.find((r) => r.date === date) || null;
    },
    async list(limit = 30) {
      return [...defaults().reflections]
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, limit);
    },
    async upsert(input) {
      const d = defaults();
      const date = input.date || dayKey(new Date().toISOString());
      const existing = d.reflections.find((r) => r.date === date);
      if (existing) {
        Object.assign(existing, {
          wins: input.wins || null,
          learnings: input.learnings || null,
          tomorrow: input.tomorrow || null,
          mood: input.mood || null,
        });
      } else {
        d.reflections.push({
          id: uid(),
          date,
          wins: input.wins || null,
          learnings: input.learnings || null,
          tomorrow: input.tomorrow || null,
          mood: input.mood || null,
        });
      }
      saveDb(d);
      return d.reflections.find((r) => r.date === date);
    },
  },
};

const api = hasBridge ? window.momentum : mock;

export const isElectron = hasBridge;
export default api;
