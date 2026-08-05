import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * Card — the primary surface component.
 * Supports interactive (hoverable), padding options, and custom "as" element.
 */
const Card = forwardRef(
  (
    {
      children,
      className,
      interactive = false,
      padding = 'default',
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    const paddingStyles = {
      none: '',
      sm: 'p-4',
      default: 'p-5',
      lg: 'p-6',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          'bg-zinc-900 border border-zinc-800 rounded-2xl',
          'shadow-sm shadow-black/10',
          paddingStyles[padding],
          interactive && [
            'transition-all duration-200 cursor-pointer',
            'hover:border-zinc-700 hover:bg-zinc-900/80',
            'hover:shadow-md hover:shadow-black/20',
            'hover:-translate-y-0.5',
          ],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';
export default Card;
