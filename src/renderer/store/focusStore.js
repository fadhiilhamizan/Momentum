import { create } from 'zustand';

const DEFAULT_MINUTES = 25;

export const useFocusStore = create((set, get) => ({
  taskId: null,
  title: '',
  phase: null, // 'running' | 'paused' | 'review' | null
  totalSec: DEFAULT_MINUTES * 60,
  remainingSec: DEFAULT_MINUTES * 60,

  start: (task, minutes = DEFAULT_MINUTES) =>
    set({
      taskId: task.id,
      title: task.title,
      phase: 'running',
      totalSec: minutes * 60,
      remainingSec: minutes * 60,
    }),

  tick: () => {
    const { phase, remainingSec } = get();
    if (phase !== 'running') return;
    if (remainingSec <= 1) {
      set({ remainingSec: 0, phase: 'review' });
    } else {
      set({ remainingSec: remainingSec - 1 });
    }
  },

  pause: () => set({ phase: 'paused' }),
  resume: () => set({ phase: 'running' }),
  addMinutes: (m) =>
    set((s) => ({
      remainingSec: s.remainingSec + m * 60,
      totalSec: s.totalSec + m * 60,
      phase: s.phase === 'review' ? 'running' : s.phase,
    })),
  toReview: () => set({ phase: 'review' }),
  close: () => set({ phase: null, taskId: null, title: '' }),
}));
