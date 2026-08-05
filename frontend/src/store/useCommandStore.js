import { create } from 'zustand';

/**
 * Zustand store for the command palette (Ctrl+K).
 */
export const useCommandStore = create((set) => ({
  isOpen: false,
  query: '',

  open: () => set({ isOpen: true, query: '' }),
  close: () => set({ isOpen: false, query: '' }),
  toggle: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      query: state.isOpen ? '' : state.query,
    })),
  setQuery: (query) => set({ query }),
}));
