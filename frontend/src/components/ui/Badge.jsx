const variants = {
  // Status badges
  pending: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-primary)]',
  'in-progress': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  
  // Priority badges
  high: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  low: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  urgent: 'bg-red-600/15 text-red-400 border border-red-500/25',
  
  // Role badges
  owner: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  manager: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  member: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-primary)]',
  viewer: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',

  // General
  primary: 'bg-[var(--accent-primary-muted)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  info: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  neutral: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-primary)]',
};

const sizeMap = {
  xs: 'px-1.5 py-0.5 text-[9px]',
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'sm', 
  dot = false,
  icon: Icon,
  className = '' 
}) {
  const dotColors = {
    pending: 'bg-slate-400',
    'in-progress': 'bg-blue-400',
    completed: 'bg-emerald-400',
    high: 'bg-rose-400',
    medium: 'bg-amber-400',
    low: 'bg-slate-400',
    urgent: 'bg-red-400',
    primary: 'bg-[var(--accent-primary)]',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-cyan-400',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full uppercase tracking-wider whitespace-nowrap
        ${variants[variant] || variants.neutral}
        ${sizeMap[size] || sizeMap.sm}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-current'}`} />
      )}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}
