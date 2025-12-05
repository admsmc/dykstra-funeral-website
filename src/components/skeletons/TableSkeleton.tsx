import { Skeleton } from '@dykstra/ui';

export interface TableSkeletonProps {
  /** Number of rows to display (default: 5) */
  rows?: number;
  /** Number of columns (default: 4) */
  columns?: number;
  /** Show header row (default: true) */
  showHeader?: boolean;
  /** Show action column (default: false) */
  showActions?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Table Skeleton
 * 
 * Loading placeholder for data tables.
 * 
 * @example
 * ```tsx
 * {isLoading ? (
 *   <TableSkeleton rows={10} columns={5} />
 * ) : (
 *   <DataTable data={data} />
 * )}
 * ```
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  showActions = false,
  className = '',
}: TableSkeletonProps) {
  const totalColumns = showActions ? columns + 1 : columns;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="bg-neutral-100 rounded-lg p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${totalColumns}, 1fr)` }}>
            {Array.from({ length: totalColumns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${totalColumns}, 1fr)` }}>
            {Array.from({ length: totalColumns }).map((_, colIndex) => {
              // Last column (actions) should be smaller
              if (showActions && colIndex === totalColumns - 1) {
                return <Skeleton key={colIndex} className="h-8 w-20" />;
              }
              // Vary width slightly for more realistic look
              const widthClass = colIndex % 3 === 0 ? 'w-3/4' : colIndex % 2 === 0 ? 'w-full' : 'w-5/6';
              return <Skeleton key={colIndex} className={`h-4 ${widthClass}`} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
