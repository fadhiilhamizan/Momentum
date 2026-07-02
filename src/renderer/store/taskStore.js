import { create } from 'zustand';
import api from '../utils/api';
import { useUiStore } from './uiStore';

function reportError(message, err) {
  console.error(message, err);
  try {
    useUiStore.getState().showToast(message, 'sparkles');
  } catch (_) {
    /* ui store not ready */
  }
}

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
    try {
      const task = await api.tasks.create(input);
      set((state) => ({ tasks: [...state.tasks, task] }));
      return task;
    } catch (err) {
      reportError("Couldn't save that task", err);
      return null;
    }
  },

  updateTask: async (id, updates) => {
    const prev = get().tasks;
    // Optimistic update, then reconcile with the persisted row.
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    try {
      const saved = await api.tasks.update(id, updates);
      if (saved) {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? saved : t)),
        }));
      }
      return saved;
    } catch (err) {
      set({ tasks: prev }); // rollback
      reportError("Couldn't update that task", err);
      return null;
    }
  },

  reorderTasks: async (orderedIds) => {
    const prev = get().tasks;
    // Optimistically stamp each task's sortOrder to its new position.
    const orderMap = Object.fromEntries(orderedIds.map((id, i) => [id, i]));
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id in orderMap ? { ...t, sortOrder: orderMap[t.id] } : t
      ),
    }));
    try {
      await api.tasks.reorder(orderedIds);
    } catch (err) {
      set({ tasks: prev });
      reportError("Couldn't reorder tasks", err);
    }
  },

  deleteTask: async (id) => {
    const prev = get().tasks;
    set({ tasks: prev.filter((t) => t.id !== id) });
    try {
      await api.tasks.remove(id);
    } catch (err) {
      set({ tasks: prev }); // rollback
      reportError("Couldn't delete that task", err);
    }
  },

  toggleComplete: async (id, isCompleted) => {
    const prev = get().tasks;
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
    try {
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
    } catch (err) {
      set({ tasks: prev }); // rollback
      reportError("Couldn't update that task", err);
      return null;
    }
  },

  // Selectors ---------------------------------------------------------------
  incompleteCount: () => get().tasks.filter((t) => !t.isCompleted).length,
  starredCount: () =>
    get().tasks.filter((t) => t.isStarred && !t.isCompleted).length,
}));
