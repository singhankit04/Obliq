import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Dialog — shadcn-inspired modal with Framer Motion animations & Lucide icons.
 */
export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = 'max-w-md',
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full bg-[#11141A] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 specular-border overflow-hidden',
              maxWidth,
              className
            )}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 p-5 pb-0">
                <div className="space-y-1">
                  {title && (
                    <h3 className="text-base font-semibold text-zinc-100 tracking-tight">{title}</h3>
                  )}
                  {description && (
                    <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-white/[0.06]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
