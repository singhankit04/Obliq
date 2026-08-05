import { cn } from '../../lib/cn';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState — displayed when a section has no data.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-zinc-500" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      {description && (
        <p className="text-xs text-zinc-500 mt-1.5 max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          className="mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
