export function SkeletonLine({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div className={`${width} ${height} rounded-lg animate-skeleton ${className}`} />
  );
}

export function SkeletonAvatar({ size = 'w-10 h-10' }) {
  return <div className={`${size} rounded-xl animate-skeleton shrink-0`} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-2xl p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-32" height="h-3" />
          <SkeletonLine width="w-20" height="h-2.5" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLine width="w-full" height="h-3" />
        <SkeletonLine width="w-4/5" height="h-3" />
        <SkeletonLine width="w-3/5" height="h-3" />
      </div>
    </div>
  );
}

export function SkeletonComment() {
  return (
    <div className="flex gap-3 py-4">
      <SkeletonAvatar size="w-9 h-9" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <SkeletonLine width="w-24" height="h-3" />
          <SkeletonLine width="w-16" height="h-2.5" />
        </div>
        <SkeletonLine width="w-full" height="h-3" />
        <SkeletonLine width="w-3/4" height="h-3" />
      </div>
    </div>
  );
}

export function SkeletonTaskDetail() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="space-y-3">
        <SkeletonLine width="w-20" height="h-5" />
        <SkeletonLine width="w-96" height="h-8" />
        <div className="flex gap-2">
          <SkeletonLine width="w-20" height="h-6" />
          <SkeletonLine width="w-24" height="h-6" />
          <SkeletonLine width="w-16" height="h-6" />
        </div>
      </div>
      {/* Meta skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <SkeletonLine width="w-16" height="h-2.5" />
            <SkeletonLine width="w-32" height="h-4" />
          </div>
        ))}
      </div>
      {/* Description skeleton */}
      <div className="space-y-2 pt-4">
        <SkeletonLine width="w-full" height="h-3.5" />
        <SkeletonLine width="w-full" height="h-3.5" />
        <SkeletonLine width="w-4/5" height="h-3.5" />
        <SkeletonLine width="w-2/3" height="h-3.5" />
      </div>
      {/* Comments skeleton */}
      <div className="pt-4 space-y-1">
        <SkeletonComment />
        <SkeletonComment />
      </div>
    </div>
  );
}
