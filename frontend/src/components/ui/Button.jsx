import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const variants = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-900/20',
  secondary:
    'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600',
  ghost:
    'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
  danger:
    'bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20',
  outline:
    'border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600',
  gradient:
    'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-md shadow-blue-900/25',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-10 px-5 text-sm gap-2 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
  'icon-md': 'h-9 w-9 rounded-xl',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const isIconOnly = size === 'icon-sm' || size === 'icon-md';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer select-none whitespace-nowrap',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'active:scale-[0.97]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : Icon ? (
          <Icon className={cn('shrink-0', isIconOnly ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
        ) : null}
        {!isIconOnly && children}
        {IconRight && !isIconOnly && (
          <IconRight className="w-3.5 h-3.5 shrink-0" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
