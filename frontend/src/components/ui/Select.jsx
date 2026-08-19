import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

const Select = forwardRef(
  ({ label, error, children, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-zinc-400"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              'w-full appearance-none bg-[#0D0F14] border border-white/[0.08] rounded-lg text-xs text-zinc-100',
              'h-9 px-3 pr-8 cursor-pointer transition-all duration-150',
              'focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20',
              error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : '',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
