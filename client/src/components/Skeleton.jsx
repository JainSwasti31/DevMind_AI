/**
 * Skeleton loading placeholder components.
 */

export function SkeletonLine({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-full bg-slate-800 ${className}`} />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-3xl border border-slate-800 bg-slate-900/90 p-6 ${className}`}>
      <SkeletonLine className="h-6 w-1/2 mb-3" />
      <SkeletonLine className="h-4 w-3/4 mb-2" />
      <SkeletonLine className="h-4 w-1/3" />
    </div>
  );
}

export function SkeletonRepo() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((n) => (
        <SkeletonCard key={n} />
      ))}
    </div>
  );
}
