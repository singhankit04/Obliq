import { cn } from '../../lib/cn';

const variantStyles = {
  // Status
  pending: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',

  // Priority
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',

  // Semantic
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  primary: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const sizeStyles = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded-md',
  sm: 'text-xs px-2 py-0.5 rounded-lg',
  md: 'text-xs px-2.5 py-1 rounded-lg',
};

const dotColors = {
  pending: 'bg-zinc-400',
  'in-progress': 'bg-amber-400',
  completed: 'bg-emerald-400',
  low: 'bg-zinc-400',
  medium: 'bg-amber-400',
  high: 'bg-rose-400',
  urgent: 'bg-red-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  info: 'bg-blue-400',
  neutral: 'bg-zinc-400',
  primary: 'bg-blue-400',
};

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className,
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold border capitalize whitespace-nowrap',
        variantStyles[variant] || variantStyles.neutral,
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant] || dotColors.neutral
          )}
        />
      )}
      {children}
    </span>
  );
}
