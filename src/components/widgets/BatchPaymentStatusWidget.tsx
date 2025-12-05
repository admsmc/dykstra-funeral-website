'use client';

import { PlayCircle, CheckCircle2, Clock, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/trpc/react';

/**
 * Batch Payment Status Widget
 * 
 * Dashboard widget showing:
 * - Recent payment runs (last 5)
 * - Status indicators (processing, complete, pending, failed)
 * - Quick stats (bills paid, total amount)
 * - Link to payment run page
 */

export function BatchPaymentStatusWidget() {
  // TODO: Replace with actual query when backend endpoint exists
  // const { data: paymentRuns, isLoading } = api.financial.ap.listPaymentRuns.useQuery({
  //   funeralHomeId: 'fh-001',
  //   limit: 5,
  // });

  // Mock data for now
  const mockPaymentRuns = [
    {
      id: 'RUN-001',
      runDate: new Date('2024-12-04'),
      billCount: 15,
      totalAmount: 45320.50,
      status: 'complete' as const,
      paymentMethod: 'ACH',
    },
    {
      id: 'RUN-002',
      runDate: new Date('2024-11-27'),
      billCount: 8,
      totalAmount: 12450.00,
      status: 'complete' as const,
      paymentMethod: 'CHECK',
    },
    {
      id: 'RUN-003',
      runDate: new Date('2024-11-20'),
      billCount: 22,
      totalAmount: 67890.25,
      status: 'complete' as const,
      paymentMethod: 'ACH',
    },
    {
      id: 'RUN-004',
      runDate: new Date('2024-11-13'),
      billCount: 12,
      totalAmount: 34560.75,
      status: 'complete' as const,
      paymentMethod: 'WIRE',
    },
    {
      id: 'RUN-005',
      runDate: new Date('2024-11-06'),
      billCount: 18,
      totalAmount: 51230.00,
      status: 'complete' as const,
      paymentMethod: 'ACH',
    },
  ];

  const isLoading = false;

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusConfig = (status: 'processing' | 'complete' | 'pending' | 'failed') => {
    switch (status) {
      case 'processing':
        return {
          icon: Clock,
          label: 'Processing',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
        };
      case 'complete':
        return {
          icon: CheckCircle2,
          label: 'Complete',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
        };
      case 'failed':
        return {
          icon: AlertCircle,
          label: 'Failed',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
        };
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-[--navy]" />
          <h3 className="font-semibold text-gray-900">Recent Payment Runs</h3>
        </div>
        <Link
          href="/staff/finops/ap/payment-run"
          className="text-sm text-[--navy] hover:underline"
        >
          Create New
        </Link>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : mockPaymentRuns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No payment runs yet</p>
            <Link
              href="/staff/finops/ap/payment-run"
              className="text-sm text-[--navy] hover:underline mt-2 inline-block"
            >
              Create your first payment run
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {mockPaymentRuns.map((run) => {
              const statusConfig = getStatusConfig(run.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={run.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-gray-900">
                        {run.id}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[--navy]">
                      {formatCurrency(run.totalAmount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(run.runDate)}
                    </span>
                    <span>{run.billCount} bills</span>
                    <span className="uppercase">{run.paymentMethod}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isLoading && mockPaymentRuns.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <Link
            href="/staff/finops/ap/payment-run"
            className="text-sm text-center block text-[--navy] hover:underline"
          >
            View All Payment Runs
          </Link>
        </div>
      )}
    </div>
  );
}
