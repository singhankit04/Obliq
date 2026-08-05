import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

const Input = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      iconRight: IconRight,
      className,
      wrapperClassName,
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600',
              'transition-all duration-150',
              'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
              Icon ? 'pl-10 pr-3.5 py-2.5' : 'px-3.5 py-2.5',
              IconRight ? 'pr-10' : '',
              error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : '',
              className
            )}
            {...props}
          />
          {IconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <IconRight className="w-4 h-4 text-zinc-500" />
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

/**
 * Textarea variant following the same design.
 */
export const Textarea = forwardRef(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 resize-none',
            'transition-all duration-150',
            'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
            error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : '',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
