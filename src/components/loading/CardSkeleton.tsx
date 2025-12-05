import { memo } from 'react';

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export const CardSkeleton = memo(function CardSkeleton({ count = 4, className = '' }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-white rounded-lg border border-gray-200 p-6 animate-pulse ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Title */}
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              {/* Value */}
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            </div>
            {/* Icon */}
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
          </div>
        </div>
      ))}
    </>
  );
});
