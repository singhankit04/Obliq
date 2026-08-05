import { create } from 'zustand';

/**
 * Zustand store for sidebar state (collapsed/expanded).
 * Persists to localStorage so sidebar remembers its state.
 */
export const useSidebarStore = create((set) => ({
  isCollapsed: (() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('obliq-sidebar-collapsed') === 'true';
    }
    return false;
  })(),

  toggle: () =>
    set((state) => {
      const next = !state.isCollapsed;
      localStorage.setItem('obliq-sidebar-collapsed', String(next));
      return { isCollapsed: next };
    }),

  collapse: () =>
    set(() => {
      localStorage.setItem('obliq-sidebar-collapsed', 'true');
      return { isCollapsed: true };
    }),

  expand: () =>
    set(() => {
      localStorage.setItem('obliq-sidebar-collapsed', 'false');
      return { isCollapsed: false };
    }),

  // Mobile sidebar state
  isMobileOpen: false,
  openMobile: () => set({ isMobileOpen: true }),
  closeMobile: () => set({ isMobileOpen: false }),
}));
