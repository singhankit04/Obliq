import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Dropdown — click-triggered menu.
 */
export default function Dropdown({
  trigger,
  children,
  align = 'left',
  className,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-1 min-w-[180px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl shadow-black/40 p-1',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
          >
            {typeof children === 'function'
              ? children(() => setOpen(false))
              : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * DropdownItem — single menu item.
 */
export function DropdownItem({
  children,
  icon: Icon,
  onClick,
  variant = 'default',
  className,
  ...props
}) {
  const variantStyles = {
    default: 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800',
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </button>
  );
}

/**
 * DropdownDivider — separator line.
 */
export function DropdownDivider() {
  return <div className="my-1 h-px bg-zinc-800" />;
}
