import { create } from 'zustand';

const DEFAULT_MINUTES = 25;
const LS_KEY = 'momentum:focus';

/**
 * Read a persisted session back. A running session stores its absolute end
 * time (`endAt`) rather than a countdown, so the remaining time stays accurate
 * across a reload or app restart. A session that already elapsed comes back as
 * a review — unless it's badly stale, in which case it's treated as abandoned.
 */
function loadPersisted() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.phase) return null;
    if (s.phase === 'running' && s.endAt) {
      const remainingSec = Math.max(0, Math.round((s.endAt - Date.now()) / 1000));
      if (remainingSec <= 0) {
        const overdueMs = Date.now() - s.endAt;
        if (overdueMs > 12 * 60 * 60 * 1000) return null; // abandoned long ago
        return { ...s, remainingSec: 0, phase: 'review', endAt: null };
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
    const { taskId, title, phase, totalSec, remainingSec, endAt } = state;
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ taskId, title, phase, totalSec, remainingSec, endAt })
    );
  } catch (_) {
    /* storage unavailable / quota — a lost session is non-critical */
  }
}

const initial = loadPersisted() || {
  taskId: null,
  title: '',
  phase: null, // 'running' | 'paused' | 'review' | null
  totalSec: DEFAULT_MINUTES * 60,
  remainingSec: DEFAULT_MINUTES * 60,
  endAt: null, // epoch ms the countdown reaches zero (running only)
};

export const useFocusStore = create((set, get) => {
  // Persist after every structural change so the session survives a reload.
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
      }),

    tick: () => {
      const { phase, endAt, remainingSec } = get();
      if (phase !== 'running') return;
      // Derive remaining from the absolute end time so throttled/background
      // tabs and reloads can't make the clock drift.
      const rem = endAt
        ? Math.max(0, Math.round((endAt - Date.now()) / 1000))
        : remainingSec - 1;
      if (rem <= 0) setP({ remainingSec: 0, phase: 'review', endAt: null });
      else set({ remainingSec: rem }); // endAt already persisted; skip the write
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
        // "Keep working" from the review screen starts a fresh stretch.
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

    toReview: () => setP({ phase: 'review', endAt: null }),
    close: () => setP({ phase: null, taskId: null, title: '', endAt: null }),
  };
});
