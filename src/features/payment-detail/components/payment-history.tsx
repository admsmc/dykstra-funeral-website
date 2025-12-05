import type { PaymentHistoryViewModel } from '../view-models/payment-view-model';
import { PaymentStatusBadge } from './payment-status-badge';

interface PaymentHistoryProps {
  history: PaymentHistoryViewModel;
}

export function PaymentHistory({ history }: PaymentHistoryProps) {
  if (!history.hasMultipleVersions) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Version History</h2>
      <p className="text-sm text-gray-600 mb-4">
        This payment has {history.totalVersions} versions (status changes tracked for audit
        compliance)
      </p>
      <div className="space-y-4">
        {history.versions.map((version, index) => (
          <div
            key={version.id}
            className={`flex items-start gap-4 pb-4 ${
              index < history.versions.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full ${
                  history.isCurrentVersion(version.version) ? 'bg-[--navy]' : 'bg-gray-300'
                }`}
              />
              {index < history.versions.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 mt-2" />
              )}
            </div>

            {/* Version details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-gray-900">
                  Version {version.version}
                </span>
                <PaymentStatusBadge status={version.status} config={version.statusConfig} />
                {history.isCurrentVersion(version.version) && (
                  <span className="text-xs bg-[--navy] text-white px-2 py-0.5 rounded">
                    CURRENT
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <p>Updated: {version.updatedDate}</p>
                <p>Amount: {version.formattedAmount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
