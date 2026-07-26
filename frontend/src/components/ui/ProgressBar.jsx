export default function ProgressBar({ 
  value = 0, 
  max = 100, 
  size = 'md',
  showLabel = true,
  variant = 'primary',
  className = '' 
}) {
  const percent = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);
  
  const heightMap = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorMap = {
    primary: 'bg-[var(--accent-primary)]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    cyan: 'bg-cyan-500',
  };

  const bgColor = percent >= 100 ? colorMap.success : colorMap[variant];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Progress
          </span>
          <span className="text-[10px] font-bold text-[var(--text-secondary)]">
            {percent}%
          </span>
        </div>
      )}
      <div className={`w-full ${heightMap[size]} bg-[var(--border-primary)] rounded-full overflow-hidden`}>
        <div
          className={`${heightMap[size]} ${bgColor} rounded-full animate-progress transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
