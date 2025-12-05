import { memo } from 'react';
import { AlertCircle } from 'lucide-react';

interface TableErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export const TableErrorFallback = memo(function TableErrorFallback({ error, reset }: TableErrorFallbackProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Failed to load table data
          </h3>
          <p className="text-sm text-gray-600">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
});
