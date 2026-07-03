import { create } from 'zustand';

const DEFAULT_MINUTES = 25;
const SHORT_BREAK = 5;
const LONG_BREAK = 15;
const SESSIONS_PER_LONG_BREAK = 4;
const LS_KEY = 'momentum:focus';

/**
 * Read a persisted session back. A running session (or break) stores its
 * absolute end time (`endAt`) rather than a countdown, so the remaining time
 * stays accurate across a reload or restart. An elapsed timer comes back as a
 * review / break-done prompt — unless it's badly stale, then it's abandoned.
 */
function loadPersisted() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.phase) return null;
    if ((s.phase === 'running' || s.phase === 'break') && s.endAt) {
      const remainingSec = Math.max(0, Math.round((s.endAt - Date.now()) / 1000));
      if (remainingSec <= 0) {
        const overdueMs = Date.now() - s.endAt;
        if (overdueMs > 12 * 60 * 60 * 1000) return null; // abandoned long ago
        return {
          ...s,
          remainingSec: 0,
          phase: s.phase === 'break' ? 'breakDone' : 'review',
          endAt: null,
        };
      }
      return { ...s, remainingSec };
    }
    return s;
  } catch (_) {
    return null;
  }
}

function persist(state) {
  try {
    if (!state.phase) {
      localStorage.removeItem(LS_KEY);
      return;
    }
    const { taskId, title, phase, totalSec, remainingSec, endAt, breakType, sessionsCompleted } = state;
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ taskId, title, phase, totalSec, remainingSec, endAt, breakType, sessionsCompleted })
    );
  } catch (_) {
    /* storage unavailable / quota — a lost session is non-critical */
  }
}

const initial = loadPersisted() || {
  taskId: null,
  title: '',
  phase: null, // 'running' | 'paused' | 'review' | 'break' | 'breakDone' | null
  totalSec: DEFAULT_MINUTES * 60,
  remainingSec: DEFAULT_MINUTES * 60,
  endAt: null, // epoch ms the countdown reaches zero (running/break only)
  breakType: null, // 'short' | 'long'
  sessionsCompleted: 0,
};

export const useFocusStore = create((set, get) => {
  const setP = (patch) => {
    set(patch);
    persist(get());
  };

  return {
    ...initial,

    start: (task, minutes = DEFAULT_MINUTES) =>
      setP({
        taskId: task.id,
        title: task.title,
        phase: 'running',
        totalSec: minutes * 60,
        remainingSec: minutes * 60,
        endAt: Date.now() + minutes * 60 * 1000,
        breakType: null,
      }),

    tick: () => {
      const { phase, endAt, remainingSec } = get();
      if (phase !== 'running' && phase !== 'break') return;
      const rem = endAt
        ? Math.max(0, Math.round((endAt - Date.now()) / 1000))
        : remainingSec - 1;
      if (rem <= 0) {
        if (phase === 'break') {
          setP({ remainingSec: 0, phase: 'breakDone', endAt: null });
        } else {
          setP({
            remainingSec: 0,
            phase: 'review',
            endAt: null,
            sessionsCompleted: get().sessionsCompleted + 1,
          });
        }
      } else {
        set({ remainingSec: rem }); // endAt already persisted; skip the write
      }
    },

    pause: () => {
      const { endAt, remainingSec } = get();
      const rem = endAt
        ? Math.max(0, Math.round((endAt - Date.now()) / 1000))
        : remainingSec;
      setP({ phase: 'paused', remainingSec: rem, endAt: null });
    },

    resume: () =>
      setP({ phase: 'running', endAt: Date.now() + get().remainingSec * 1000 }),

    addMinutes: (m) => {
      const { phase, endAt, remainingSec, totalSec } = get();
      const extraSec = m * 60;
      if (phase === 'running' && endAt) {
        const newEnd = endAt + extraSec * 1000;
        setP({
          endAt: newEnd,
          remainingSec: Math.max(0, Math.round((newEnd - Date.now()) / 1000)),
          totalSec: totalSec + extraSec,
        });
      } else if (phase === 'review') {
        setP({
          phase: 'running',
          remainingSec: remainingSec + extraSec,
          totalSec: totalSec + extraSec,
          endAt: Date.now() + (remainingSec + extraSec) * 1000,
        });
      } else {
        setP({ remainingSec: remainingSec + extraSec, totalSec: totalSec + extraSec });
      }
    },

    toReview: () =>
      setP({ phase: 'review', endAt: null, sessionsCompleted: get().sessionsCompleted + 1 }),

    /** Start a rest break — a long one every few sessions, else a short one. */
    startBreak: () => {
      const sessions = get().sessionsCompleted;
      const isLong = sessions > 0 && sessions % SESSIONS_PER_LONG_BREAK === 0;
      const minutes = isLong ? LONG_BREAK : SHORT_BREAK;
      setP({
        phase: 'break',
        breakType: isLong ? 'long' : 'short',
        totalSec: minutes * 60,
        remainingSec: minutes * 60,
        endAt: Date.now() + minutes * 60 * 1000,
      });
    },

    /** Start another focus session on the same task after a break. */
    restart: (minutes = DEFAULT_MINUTES) =>
      setP({
        phase: 'running',
        totalSec: minutes * 60,
        remainingSec: minutes * 60,
        endAt: Date.now() + minutes * 60 * 1000,
        breakType: null,
      }),

    close: () =>
      setP({
        phase: null,
        taskId: null,
        title: '',
        endAt: null,
        breakType: null,
        sessionsCompleted: 0,
      }),
  };
});
