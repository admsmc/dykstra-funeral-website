/**
 * Table Loading Skeleton
 * Displays animated placeholder while data loads
 */
export function TableSkeleton({ 
  columns = 5, 
  rows = 10 
}: { 
  columns?: number; 
  rows?: number;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  <div 
                    className="h-4 bg-gray-200 rounded animate-pulse" 
                    style={{ width: `${60 + Math.random() * 40}px` }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div 
                      className="h-4 bg-gray-100 rounded animate-pulse" 
                      style={{ 
                        width: `${40 + Math.random() * 60}%`,
                        animationDelay: `${(rowIndex * columns + colIndex) * 50}ms` 
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
