import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Breadcrumb — navigation trail.
 *
 * Usage:
 *   <Breadcrumb items={[
 *     { label: 'Dashboard', href: '/' },
 *     { label: 'Project Alpha', href: '/project/123' },
 *     { label: 'Task Details' },
 *   ]} />
 */
export default function Breadcrumb({ items = [], className }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1.5 text-xs', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-zinc-600" />
            )}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'font-medium',
                  isLast ? 'text-zinc-200' : 'text-zinc-500'
                )}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
