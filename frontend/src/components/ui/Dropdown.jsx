import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Dropdown — shadcn-inspired menu with Framer Motion.
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
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute z-50 mt-1.5 min-w-[190px] bg-[#14171F] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/80 p-1 backdrop-blur-xl',
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
 * DropdownItem — single menu item with icon support.
 */
export function DropdownItem({
  children,
  icon: Icon,
  onClick,
  variant = 'default',
  shortcut,
  className,
  ...props
}) {
  const variantStyles = {
    default: 'text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.06]',
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />}
        <span>{children}</span>
      </div>
      {shortcut && (
        <span className="text-[10px] text-zinc-500 font-mono tracking-wider">{shortcut}</span>
      )}
    </button>
  );
}

/**
 * DropdownDivider — separator line.
 */
export function DropdownDivider() {
  return <div className="my-1 h-px bg-white/[0.06]" />;
}
