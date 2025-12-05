/**
 * Recent Activity Component
 * Displays recent cases and payments
 */

import Link from 'next/link';
import type { DashboardStatsViewModel } from '../view-models/dashboard-stats-vm';

export interface RecentActivityProps {
  stats: DashboardStatsViewModel;
}

export function RecentActivity({ stats }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Cases */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Cases</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.hasRecentCases ? (
            stats.recentCases.map((case_) => (
              <Link
                key={case_.id}
                href={`/staff/cases/${case_.businessKey}`}
                className="block px-6 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {case_.decedentName}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {case_.displayType}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {case_.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 ml-4">
                    {case_.displayDate}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent cases
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <Link
            href="/staff/cases"
            className="text-sm font-medium text-[--navy] hover:text-[--sage] transition"
          >
            View all cases →
          </Link>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.hasRecentPayments ? (
            stats.recentPayments.map((payment) => (
              <div key={payment.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {payment.case.decedentName}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {payment.displayMethod}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${payment.statusBadgeClass}`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-gray-900">
                      {payment.displayAmount}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent payments
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <Link
            href="/staff/payments"
            className="text-sm font-medium text-[--navy] hover:text-[--sage] transition"
          >
            View all payments →
          </Link>
        </div>
      </div>
    </div>
  );
}
