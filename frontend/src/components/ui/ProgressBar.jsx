import { cn } from '../../lib/cn';

const variantColors = {
  default: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  cyan: 'bg-cyan-500',
};

/**
 * ProgressBar — thin progress indicator.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  size = 'sm',
  variant = 'default',
  showLabel = false,
  className,
}) {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;

  const sizeStyles = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full overflow-hidden rounded-full bg-zinc-800', sizeStyles[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-[10px] font-semibold text-zinc-500 mt-1 text-right">
          {percentage}%
        </p>
      )}
    </div>
  );
}
