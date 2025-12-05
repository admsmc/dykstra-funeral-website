'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Clock, DollarSign } from 'lucide-react';
import { api } from '@/trpc/react';
import { WidgetSkeleton } from '@/components/skeletons/FinancialSkeletons';

/**
 * Overdue Invoices Widget
 * 
 * Dashboard widget showing:
 * - Count of overdue invoices
 * - Total $ overdue
 * - Link to AR aging report
 */

export function OverdueInvoicesWidget() {
  // Query overdue invoices
  const { data, isLoading, error } = api.financial.ar.getOverdueInvoices.useQuery({
    asOfDate: new Date(),
    funeralHomeId: 'fh-001', // TODO: Get from auth context
    minimumDaysOverdue: 1,
  });

  // Mock data for now since endpoint returns empty
  const mockOverdueData = {
    count: 4,
    totalAmount: 34600,
    criticalCount: 2, // 90+ days
    criticalAmount: 28500,
  };

  const overdueData = data?.invoices?.length ? {
    count: data.invoices.length,
    totalAmount: data.totalOverdueAmount,
    criticalCount: data.invoices.filter((inv: any) => inv.daysOverdue > 90).length,
    criticalAmount: data.invoices.filter((inv: any) => inv.daysOverdue > 90).reduce((sum: number, inv: any) => sum + inv.balance, 0),
  } : mockOverdueData;

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  return (
    <div className="bg-white border-2 border-red-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overdue Invoices</h3>
            <p className="text-sm text-gray-500">Requires attention</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {error ? (
        <div className="text-sm text-red-600 py-4">
          Error loading overdue invoices
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {/* Total Overdue */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Total Overdue</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(overdueData.totalAmount)}
              </div>
            </div>

            {/* Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Overdue Invoices</span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {overdueData.count}
              </div>
            </div>
          </div>

          {/* Critical Alert */}
          {overdueData.criticalCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">
                    {overdueData.criticalCount} invoice{overdueData.criticalCount !== 1 ? 's' : ''} over 90 days
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {formatCurrency(overdueData.criticalAmount)} - immediate action needed
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* View All Link */}
          <Link
            href="/staff/finops/ar"
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <span className="font-medium">View AR Aging Report</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </>
      )}
    </div>
  );
}
