import { create } from 'zustand';
import api from '../utils/api';

export const useProjectStore = create((set) => ({
  projects: [],
  loading: true,

  load: async () => {
    try {
      const projects = await api.projects.list();
      set({ projects, loading: false });
    } catch (err) {
      console.error('Failed to load projects', err);
      set({ loading: false });
    }
  },

  addProject: async (input) => {
    const project = await api.projects.create(input);
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },

  updateProject: async (id, updates) => {
    const saved = await api.projects.update(id, updates);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? saved || p : p)),
    }));
    return saved;
  },

  deleteProject: async (id) => {
    await api.projects.remove(id);
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
  },
}));
