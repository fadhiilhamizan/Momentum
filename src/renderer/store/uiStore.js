import { create } from 'zustand';

let toastId = 0;

export const useUiStore = create((set) => ({
  toast: null, // { id, message, icon, variant }
  celebrateAt: null, // { x, y } origin for the sparkle burst
  confettiKey: null, // bump to trigger a full-screen confetti burst
  openTaskId: null, // task whose detail modal is open
  helpOpen: false,
  paletteOpen: false, // Ctrl/Cmd-K command palette

  openTask: (id) => set({ openTaskId: id }),
  closeTask: () => set({ openTaskId: null }),
  openHelp: () => set({ helpOpen: true }),
  closeHelp: () => set({ helpOpen: false }),
  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),

  // `action` is an optional { label, onClick } that renders a button in the
  // toast (e.g. "Undo"). Toasts with an action linger longer so there's time
  // to click it.
  showToast: (message, icon = 'sparkles', variant = null, action = null) => {
    const id = ++toastId;
    set({ toast: { id, message, icon, variant, action } });
    setTimeout(
      () => {
        set((state) => (state.toast && state.toast.id === id ? { toast: null } : {}));
      },
      action ? 6000 : 2600
    );
  },
  dismissToast: () => set({ toast: null }),

  celebrate: (x, y) => {
    set({ celebrateAt: { x, y, key: Date.now() } });
    setTimeout(() => set({ celebrateAt: null }), 1100);
  },

  burstConfetti: () => {
    set({ confettiKey: Date.now() });
    setTimeout(() => set({ confettiKey: null }), 2100);
  },
}));
