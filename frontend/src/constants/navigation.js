import {
  LayoutGrid,
  CheckSquare,
  Calendar,
  Bell,
  Activity,
  Users,
  Settings,
  Folder,
} from 'lucide-react';

/**
 * Primary sidebar navigation items.
 */
export const PRIMARY_NAV = [
  { path: '/', icon: LayoutGrid, label: 'Dashboard', exact: true },
];

/**
 * Secondary sidebar navigation items.
 * These are placeholder links for now — pages will be built in future phases.
 */
export const SECONDARY_NAV = [
  { icon: CheckSquare, label: 'My Tasks', path: null },
  { icon: Calendar, label: 'Calendar', path: null },
  { icon: Bell, label: 'Notifications', path: null },
  { icon: Activity, label: 'Activity', path: null },
  { icon: Users, label: 'Members', path: null },
  { icon: Settings, label: 'Settings', path: null },
];

/**
 * Status configuration for tasks.
 */
export const TASK_STATUS = {
  pending: { label: 'To do', color: 'bg-zinc-400', textColor: 'text-zinc-400' },
  'in-progress': { label: 'In progress', color: 'bg-amber-400', textColor: 'text-amber-400' },
  completed: { label: 'Complete', color: 'bg-emerald-400', textColor: 'text-emerald-400' },
};

/**
 * Priority configuration for tasks.
 */
export const TASK_PRIORITY = {
  low: { label: 'Low', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  high: { label: 'High', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
};
