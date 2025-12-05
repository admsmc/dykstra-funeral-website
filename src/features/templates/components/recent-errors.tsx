import type { ErrorViewModel } from '../view-models/template-analytics-view-model';

interface RecentErrorsProps {
  errors: ErrorViewModel[];
}

export function RecentErrors({ errors }: RecentErrorsProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Errors</h2>
      {errors.length > 0 ? (
        <div className="space-y-3">
          {errors.map((error, idx) => (
            <div key={idx} className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-900">{error.name}</p>
                  <p className="text-sm text-gray-600">{error.category}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {error.formattedDate}
                </span>
              </div>
              <p className="text-sm text-red-800 font-mono bg-red-100 p-2 rounded">
                {error.errorMessage}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No errors in this time range 🎉</p>
      )}
    </div>
  );
}
