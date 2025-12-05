/**
 * Case List Footer - Load More & Results Count
 */

interface CaseListFooterProps {
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  currentCount: number;
  totalCount: number;
  isLoading: boolean;
}

export function CaseListFooter({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  currentCount,
  totalCount,
  isLoading,
}: CaseListFooterProps) {
  return (
    <>
      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? "Loading..." : "Load More Cases"}
          </button>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && currentCount > 0 && (
        <p className="text-sm text-gray-600 text-center">
          Showing {currentCount} of {totalCount} cases
        </p>
      )}
    </>
  );
}
