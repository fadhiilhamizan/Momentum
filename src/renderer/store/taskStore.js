import { create } from 'zustand';
import api from '../utils/api';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: true,
  error: null,

  load: async () => {
    set({ loading: true });
    try {
      const tasks = await api.tasks.list();
      set({ tasks, loading: false, error: null });
    } catch (err) {
      console.error('Failed to load tasks', err);
      set({ loading: false, error: String(err) });
    }
  },

  addTask: async (input) => {
    const task = await api.tasks.create(input);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, updates) => {
    // Optimistic update, then reconcile with the persisted row.
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    const saved = await api.tasks.update(id, updates);
    if (saved) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? saved : t)),
      }));
    }
    return saved;
  },

  reorderTasks: async (orderedIds) => {
    // Optimistically stamp each task's sortOrder to its new position.
    const orderMap = Object.fromEntries(orderedIds.map((id, i) => [id, i]));
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id in orderMap ? { ...t, sortOrder: orderMap[t.id] } : t
      ),
    }));
    await api.tasks.reorder(orderedIds);
  },

  deleteTask: async (id) => {
    const prev = get().tasks;
    set({ tasks: prev.filter((t) => t.id !== id) });
    try {
      await api.tasks.remove(id);
    } catch (err) {
      set({ tasks: prev }); // rollback
      throw err;
    }
  },

  toggleComplete: async (id, isCompleted) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              isCompleted,
              completedDate: isCompleted ? new Date().toISOString() : null,
            }
          : t
      ),
    }));
    const saved = await api.tasks.setCompleted(id, isCompleted);
    if (saved) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? saved : t)),
      }));
      // Completing a recurring task spawns its next occurrence in the data
      // layer; reload so the new task shows up in the store immediately.
      if (isCompleted && saved.isRecurring) {
        await get().load();
      }
    }
    return saved;
  },

  // Selectors ---------------------------------------------------------------
  incompleteCount: () => get().tasks.filter((t) => !t.isCompleted).length,
  starredCount: () =>
    get().tasks.filter((t) => t.isStarred && !t.isCompleted).length,
}));
