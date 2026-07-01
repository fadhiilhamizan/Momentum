import { create } from 'zustand';

let toastId = 0;

export const useUiStore = create((set) => ({
  toast: null, // { id, message, icon }
  celebrateAt: null, // { x, y } origin for the sparkle burst
  openTaskId: null, // task whose detail modal is open

  openTask: (id) => set({ openTaskId: id }),
  closeTask: () => set({ openTaskId: null }),

  showToast: (message, icon = 'sparkles') => {
    const id = ++toastId;
    set({ toast: { id, message, icon } });
    setTimeout(() => {
      set((state) => (state.toast && state.toast.id === id ? { toast: null } : {}));
    }, 2600);
  },

  celebrate: (x, y) => {
    set({ celebrateAt: { x, y, key: Date.now() } });
    setTimeout(() => set({ celebrateAt: null }), 1100);
  },
}));
