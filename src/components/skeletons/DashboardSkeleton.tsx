import { Skeleton } from '@dykstra/ui';

export interface DashboardSkeletonProps {
  /** Number of stat cards to show (default: 4) */
  statsCount?: number;
  /** Show chart skeleton (default: true) */
  showChart?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Dashboard Skeleton
 * 
 * Loading placeholder for dashboard pages with stats, charts, etc.
 * 
 * @example
 * ```tsx
 * {isLoading ? (
 *   <DashboardSkeleton />
 * ) : (
 *   <DashboardContent data={data} />
 * )}
 * ```
 */
export function DashboardSkeleton({
  statsCount = 4,
  showChart = true,
  className = '',
}: DashboardSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Separator */}
      <Skeleton className="h-px w-full" />

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(statsCount, 4)} gap-6`}>
        {Array.from({ length: statsCount }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Chart */}
      {showChart && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      )}
    </div>
  );
}
