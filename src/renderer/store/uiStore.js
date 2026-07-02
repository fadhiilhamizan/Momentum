import { create } from 'zustand';

let toastId = 0;

export const useUiStore = create((set) => ({
  toast: null, // { id, message, icon, variant }
  celebrateAt: null, // { x, y } origin for the sparkle burst
  confettiKey: null, // bump to trigger a full-screen confetti burst
  openTaskId: null, // task whose detail modal is open
  helpOpen: false,

  openTask: (id) => set({ openTaskId: id }),
  closeTask: () => set({ openTaskId: null }),
  openHelp: () => set({ helpOpen: true }),
  closeHelp: () => set({ helpOpen: false }),

  showToast: (message, icon = 'sparkles', variant = null) => {
    const id = ++toastId;
    set({ toast: { id, message, icon, variant } });
    setTimeout(() => {
      set((state) => (state.toast && state.toast.id === id ? { toast: null } : {}));
    }, 2600);
  },

  celebrate: (x, y) => {
    set({ celebrateAt: { x, y, key: Date.now() } });
    setTimeout(() => set({ celebrateAt: null }), 1100);
  },

  burstConfetti: () => {
    set({ confettiKey: Date.now() });
    setTimeout(() => set({ confettiKey: null }), 2100);
  },
}));
