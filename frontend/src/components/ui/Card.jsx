import { forwardRef } from 'react';

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const Card = forwardRef(function Card(
  {
    children,
    className = '',
    padding = 'md',
    interactive = false,
    as: Component = 'div',
    ...props
  },
  ref
) {
  return (
    <Component
      ref={ref}
      className={`
        rounded-2xl border border-white/[0.08] bg-slate-900/65 shadow-2xl shadow-black/10
        backdrop-blur-xl ${paddingMap[padding] || paddingMap.md}
        ${interactive ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/40 hover:shadow-indigo-500/10' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
});

export default Card;
