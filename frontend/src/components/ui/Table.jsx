import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export const Table = forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-xs text-left', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

export const TableHeader = forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b border-white/[0.08]', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

export const TableRow = forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-white/[0.06] transition-colors hover:bg-white/[0.03] data-[state=selected]:bg-white/[0.05]',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-9 px-3 text-left align-middle font-medium text-zinc-400 [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-3 align-middle [&:has([role=checkbox])]:pr-0 text-zinc-200', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';
