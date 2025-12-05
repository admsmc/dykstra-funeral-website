/**
 * Financial Router Skeleton Loaders
 * 
 * Specialized skeleton loaders for financial pages.
 */

/**
 * Card Grid Skeleton
 * For aging buckets, stats cards, etc.
 */
interface CardGridSkeletonProps {
  cards?: number;
  columns?: 1 | 2 | 3 | 4 | 5;
}

export function CardGridSkeleton({ cards = 5, columns = 5 }: CardGridSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4 animate-pulse`}>
      {Array.from({ length: cards }).map((_, idx) => (
        <div key={idx} className="p-6 rounded-lg border-2 border-gray-200 bg-white">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Invoice Table Skeleton
 * Specialized for invoice list view
 */
export function InvoiceTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-7 gap-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50">
          <div className="grid grid-cols-7 gap-4 items-center">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Invoice Form Skeleton
 * For new invoice creation page
 */
export function InvoiceFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx}>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>

      {/* Line items section */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-4 mb-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-5 bg-gray-200 rounded w-28"></div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}

/**
 * Split Screen Skeleton
 * For bill approvals page
 */
export function SplitScreenSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
      {/* Left side - List */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>

      {/* Right side - Details */}
      <div className="p-6 border border-gray-200 rounded-lg bg-white">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
        
        {/* 3-way match sections */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, sectionIdx) => (
            <div key={sectionIdx} className="border border-gray-200 rounded-lg p-4">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, lineIdx) => (
                  <div key={lineIdx} className="grid grid-cols-3 gap-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Widget Skeleton
 * For dashboard widgets like OverdueInvoicesWidget
 */
export function WidgetSkeleton() {
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded w-28"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Journal Entry Form Skeleton
 * For manual journal entry page
 */
export function JournalEntryFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx}>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>

      {/* Journal lines section */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        
        {/* Line items table */}
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 pb-2 border-b border-gray-200">
            <div className="col-span-5 h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="col-span-2 h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="col-span-2 h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="col-span-2 h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100">
              <div className="col-span-5 h-10 bg-gray-200 rounded"></div>
              <div className="col-span-2 h-10 bg-gray-200 rounded"></div>
              <div className="col-span-2 h-10 bg-gray-200 rounded"></div>
              <div className="col-span-2 h-10 bg-gray-200 rounded"></div>
              <div className="col-span-1 h-10 bg-gray-200 rounded w-10"></div>
            </div>
          ))}
        </div>

        {/* Add line button */}
        <div className="mt-4">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Balance indicator */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <div className="w-48 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}

/**
 * Refund Form Skeleton
 * For refund processing page
 */
export function RefundFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Case selection */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>

      {/* Payment selection */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Refund details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx}>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}

/**
 * Bill Payments Skeleton
 * For bill payment processing page
 */
export function BillPaymentsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-6 gap-4">
          <div className="h-4 bg-gray-200 rounded w-8"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50">
          <div className="grid grid-cols-6 gap-4 items-center">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
