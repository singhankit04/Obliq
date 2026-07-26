import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary-muted)] border border-[var(--accent-primary)]/15 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-[var(--accent-primary)]" />
        </div>
      )}
      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">{title}</h4>
      {description && (
        <p className="text-xs text-[var(--text-tertiary)] max-w-xs leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
