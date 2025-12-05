import { FileX } from 'lucide-react';

/**
 * Table Empty State
 * Displayed when table has no data
 */
export function TableEmptyState({ 
  message = 'No data found',
  description,
  action
}: { 
  message?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <FileX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 font-medium">{message}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
}
