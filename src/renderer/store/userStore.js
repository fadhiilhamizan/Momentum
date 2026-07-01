import { create } from 'zustand';
import api from '../utils/api';

export const useUserStore = create((set, get) => ({
  streak: { currentStreak: 0, longestStreak: 0, lastCompletedDate: null },
  streakBump: 0, // increment to trigger the +1 animation
  settings: { theme: 'dark', sound: true },

  loadStreak: async () => {
    try {
      const streak = await api.streak.get();
      if (streak) set({ streak });
    } catch (err) {
      console.error('Failed to load streak', err);
    }
  },

  refreshStreak: async () => {
    const prev = get().streak.currentStreak;
    const streak = await api.streak.get();
    if (streak) {
      set({ streak });
      if (streak.currentStreak > prev) {
        set((s) => ({ streakBump: s.streakBump + 1 }));
      }
    }
    return streak;
  },

  loadSettings: async () => {
    try {
      const all = await api.settings.all();
      set({ settings: { theme: 'dark', sound: true, ...(all || {}) } });
    } catch (_) {
      /* keep defaults */
    }
  },

  setSetting: async (key, value) => {
    await api.settings.set(key, value);
    set((state) => ({ settings: { ...state.settings, [key]: value } }));
  },
}));
