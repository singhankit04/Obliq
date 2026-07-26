import { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white shadow-md shadow-indigo-900/20',
  secondary: 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-primary)]',
  ghost: 'hover:bg-[var(--accent-primary-muted)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)]',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/20',
  'danger-ghost': 'hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-400',
  outline: 'border border-[var(--border-primary)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)]',
  gradient: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-900/20',
};

const sizeMap = {
  xs: 'px-2 py-1 text-[10px] gap-1',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
  icon: 'p-2',
  'icon-sm': 'p-1.5',
  'icon-xs': 'p-1',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'sm',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  title,
  ...props
}) {
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    // Ripple effect
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    
    if (onClick && !disabled && !loading) onClick(e);
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      title={title}
      className={`
        relative inline-flex items-center justify-center font-semibold rounded-xl
        transition-all duration-200 cursor-pointer overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-ring
        ${variants[variant] || variants.primary}
        ${sizeMap[size] || sizeMap.sm}
        ${className}
      `}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute w-2 h-2 bg-white/20 rounded-full animate-ripple pointer-events-none"
          style={{ left: ripple.x - 4, top: ripple.y - 4 }}
        />
      ))}

      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {!loading && Icon && <Icon className={size.includes('icon') ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      {children}
      {!loading && IconRight && <IconRight className="w-3.5 h-3.5" />}
    </button>
  );
}
