/**
 * Case Skeleton Loaders
 * 
 * Content-aware loading states for case pages
 * Matches actual content layout for seamless transitions
 */

export function CaseListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Table Rows Skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="border-b border-gray-200 p-4 flex items-center justify-between"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Quick Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 flex gap-6 p-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CaseStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div 
          key={i} 
          className="bg-white rounded-lg border border-gray-200 p-4"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className="flex gap-4"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            {i < 4 && <div className="h-16 w-0.5 bg-gray-200 animate-pulse mt-2"></div>}
          </div>
          <div className="flex-1 pb-8">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CaseFormSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}
