/**
 * Bulk Actions Toolbar Component
 */

interface BulkActionsToolbarProps {
  selectedCount: number;
  onArchive: () => void;
  onClear: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onArchive,
  onClear,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-blue-900">
          {selectedCount} case(s) selected
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onArchive}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition"
          >
            Archive Selected
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
}
