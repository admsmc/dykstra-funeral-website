import { Skeleton } from '@dykstra/ui';

export interface CardSkeletonProps {
  /** Show image/thumbnail area (default: false) */
  showImage?: boolean;
  /** Number of text lines (default: 3) */
  lines?: number;
  /** Show action buttons (default: false) */
  showActions?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Card Skeleton
 * 
 * Loading placeholder for card-based content.
 * 
 * @example
 * ```tsx
 * {isLoading ? (
 *   <div className="grid grid-cols-3 gap-6">
 *     {Array.from({ length: 6 }).map((_, i) => (
 *       <CardSkeleton key={i} showImage showActions />
 *     ))}
 *   </div>
 * ) : (
 *   <TemplateGrid templates={templates} />
 * )}
 * ```
 */
export function CardSkeleton({
  showImage = false,
  lines = 3,
  showActions = false,
  className = '',
}: CardSkeletonProps) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-lg overflow-hidden ${className}`}>
      {/* Image */}
      {showImage && (
        <Skeleton className="h-48 w-full rounded-none" />
      )}

      {/* Content */}
      <div className="p-6 space-y-3">
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />

        {/* Text lines */}
        {Array.from({ length: lines }).map((_, i) => {
          // Vary widths for realistic appearance
          const widths = ['w-full', 'w-5/6', 'w-2/3'];
          const widthClass = widths[i % widths.length];
          return <Skeleton key={i} className={`h-4 ${widthClass}`} />;
        })}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        )}
      </div>
    </div>
  );
}
