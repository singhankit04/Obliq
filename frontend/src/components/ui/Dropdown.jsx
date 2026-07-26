import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({
  trigger,
  children,
  align = 'left',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const alignClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger || (
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--border-active)] transition-all">
            Options
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`
            absolute ${alignClass} mt-2 min-w-[180px] bg-[var(--bg-card)] border border-[var(--border-primary)]
            rounded-xl shadow-xl z-50 py-1.5 animate-scale-in
          `}
          role="menu"
        >
          <div onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  icon: Icon,
  onClick,
  variant = 'default',
  disabled = false,
  className = '',
}) {
  const variantClass = {
    default: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
    danger: 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10',
    active: 'text-[var(--accent-primary)] bg-[var(--accent-primary-muted)]',
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all text-left
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${variantClass[variant] || variantClass.default}
        ${className}
      `}
      role="menuitem"
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1.5 border-t border-[var(--border-secondary)]" />;
}
