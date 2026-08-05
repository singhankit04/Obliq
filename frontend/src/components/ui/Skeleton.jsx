import { cn } from '../../lib/cn';

/**
 * Skeleton — loading placeholder.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('skeleton rounded-lg', className)}
      {...props}
    />
  );
}

/**
 * SkeletonCard — card-shaped loading placeholder.
 */
export function SkeletonCard({ className }) {
  return (
    <div className={cn('bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * SkeletonTaskDetail — full task detail page skeleton.
 */
export function SkeletonTaskDetail() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Title */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
        <Skeleton className="h-8 w-3/4" />
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * SkeletonList — list items skeleton.
 */
export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
