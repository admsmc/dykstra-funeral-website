"use client";

import { trpc } from "@/lib/trpc-client";
import Link from "next/link";
import { useState, useMemo } from "react";
import ManualPaymentModal from "./_components/ManualPaymentModal";
import RefundModal from "./_components/RefundModal";
import FinancialReportsTab from "./_components/FinancialReportsTab";
import PaymentPlanTab from "./_components/PaymentPlanTab";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table";
import { ErrorBoundary, TableErrorFallback } from "@/components/error";
import { DollarSign, TrendingUp, AlertCircle, RefreshCw, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageSection } from "@/components/layouts/PageSection";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

/**
 * Staff Payments Dashboard
 * Payment management with KPIs, filtering, and reconciliation tools
 * Uses DashboardLayout and PageSection for consistent structure
 */

interface PaymentRow {
  id: string;
  businessKey: string;
  caseId: string;
  amount: {
    amount: number;
    currency: string;
  };
  method: string;
  status: string;
  createdAt: Date;
  createdBy: string;
}

export default function StaffPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] = useState(false);
  const [refundPayment, setRefundPayment] = useState<PaymentRow | null>(null);
  const [activeTab, setActiveTab] = useState<"payments" | "reports" | "plans">("payments");
  const [optimisticPayments, setOptimisticPayments] = useState<PaymentRow[]>([]);

  // Fetch payment statistics
  const { data: stats, isLoading: statsLoading } = trpc.payment.getStats.useQuery({
    funeralHomeId: undefined,
  });

  // Fetch payment list
  const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = trpc.payment.list.useQuery({
    funeralHomeId: undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    method: methodFilter !== "all" ? (methodFilter as any) : undefined,
    limit: 50,
    offset: 0,
  });

  // Merge optimistic payments with real payments, updating refunded status
  const serverPayments = paymentsData?.payments ?? [];
  const payments = [
    ...optimisticPayments,
    ...serverPayments.map(p => {
      // Mark as refunded if in optimistic refund state
      if (optimisticPayments.some(op => op.businessKey === p.businessKey && op.status === 'refunded')) {
        return { ...p, status: 'refunded' };
      }
      return p;
    })
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // KPI Cards
  const kpiCards = [
    {
      title: "Total Collected",
      value: formatCurrency(stats?.totalCollected ?? 0),
      icon: DollarSign,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      textColor: "text-green-900",
    },
    {
      title: "Pending",
      value: formatCurrency(stats?.totalPending ?? 0),
      icon: TrendingUp,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-900",
    },
    {
      title: "Failed",
      value: formatCurrency(stats?.totalFailed ?? 0),
      icon: AlertCircle,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      textColor: "text-red-900",
    },
    {
      title: "Refunded",
      value: formatCurrency(stats?.totalRefunded ?? 0),
      icon: RefreshCw,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      textColor: "text-blue-900",
    },
  ];

  // Table columns
  const columns = useMemo<ColumnDef<PaymentRow>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "caseId",
        header: "Case",
        cell: ({ row }) => (
          <Link
            href={`/staff/cases/${row.original.caseId}`}
            className="text-sm font-medium text-[--navy] hover:underline"
          >
            View Case
          </Link>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(row.original.amount.amount)}
          </span>
        ),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          return rowA.original.amount.amount - rowB.original.amount.amount;
        },
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => {
          const methodLabels: Record<string, string> = {
            credit_card: "Credit Card",
            debit_card: "Debit Card",
            ach: "ACH",
            check: "Check",
            cash: "Cash",
            insurance_assignment: "Insurance",
            payment_plan: "Payment Plan",
          };
          return (
            <span className="text-sm text-gray-700">
              {methodLabels[row.original.method] || row.original.method}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const statusColors: Record<string, string> = {
            succeeded: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            processing: "bg-blue-100 text-blue-800",
            failed: "bg-red-100 text-red-800",
            cancelled: "bg-gray-100 text-gray-800",
            refunded: "bg-purple-100 text-purple-800",
          };
          return (
            <span
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                statusColors[row.original.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {row.original.status.toUpperCase()}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link
              href={`/staff/payments/${row.original.businessKey}`}
              className="text-sm text-[--navy] hover:underline"
            >
              View
            </Link>
            {row.original.status === "succeeded" && (
              <button
                className="text-sm text-red-600 hover:underline"
                onClick={() => setRefundPayment(row.original)}
              >
                Refund
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  if (statsLoading || paymentsLoading) {
    return <DashboardSkeleton statsCount={4} showChart={false} />;
  }

  return (
    <DashboardLayout
      title="Payments"
      subtitle="Payment processing and reconciliation"
      actionButtons={[
        <button
          key="record-payment"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition"
          onClick={() => setIsManualPaymentModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>,
      ]}
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("payments")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === "payments"
                ? "border-[--navy] text-[--navy]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === "reports"
                ? "border-[--navy] text-[--navy]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Financial Reports
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === "plans"
                ? "border-[--navy] text-[--navy]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Payment Plans
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "payments" ? (
        <>
          {/* KPI Cards */}
          <PageSection title="Payment Statistics" withCard={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((card) => (
                <div
                  key={card.title}
                  className={`${card.bgColor} rounded-lg p-6 border border-gray-200`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className={`text-2xl font-bold ${card.textColor} mt-2`}>
                        {card.value}
                      </p>
                    </div>
                    <div className={`${card.iconColor}`}>
                      <card.icon className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PageSection>

          {/* Filters */}
          <PageSection title="Filters" withCard={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={methodFilter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                >
                  <option value="all">All Methods</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="ach">ACH</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="insurance_assignment">Insurance</option>
                </select>
              </div>
            </div>
          </PageSection>

          {/* Payment Table */}
          <PageSection title="Payment Transactions" withCard={true}>
            <ErrorBoundary fallback={(error, reset) => <TableErrorFallback error={error} reset={reset} />}>
              <DataTable
                data={payments}
                columns={columns}
                isLoading={false}
                enableColumnVisibility={true}
                enableExport={true}
                enableStickyHeader={false}
                pageSize={25}
                exportFilename="payments"
                emptyState={
                  <div className="p-8 text-center text-gray-500">
                    No payments found. Try adjusting your filters.
                  </div>
                }
              />
            </ErrorBoundary>
          </PageSection>
        </>
      ) : activeTab === "reports" ? (
        <FinancialReportsTab />
      ) : (
        <PaymentPlanTab />
      )}

      {/* Manual Payment Modal */}
      <ManualPaymentModal
        isOpen={isManualPaymentModalOpen}
        onClose={() => setIsManualPaymentModalOpen(false)}
        onSuccess={() => {
          // Clear optimistic payments on success
          setOptimisticPayments([]);
          refetchPayments();
        }}
        onOptimisticUpdate={(payment) => {
          // Add optimistic payment to list
          setOptimisticPayments([payment]);
        }}
        onRollback={() => {
          // Remove optimistic payment on error
          setOptimisticPayments([]);
        }}
      />

      {/* Refund Modal */}
      {refundPayment && (
        <RefundModal
          isOpen={!!refundPayment}
          onClose={() => setRefundPayment(null)}
          onSuccess={() => {
            // Clear optimistic state on success
            setOptimisticPayments([]);
            refetchPayments();
            setRefundPayment(null);
          }}
          payment={{
            businessKey: refundPayment.businessKey,
            amount: refundPayment.amount.amount,
            method: refundPayment.method,
            status: refundPayment.status,
          }}
          onOptimisticUpdate={(paymentKey) => {
            // Mark payment as refunded optimistically
            setOptimisticPayments([{
              id: paymentKey,
              businessKey: paymentKey,
              caseId: refundPayment.caseId,
              amount: refundPayment.amount,
              method: refundPayment.method,
              status: 'refunded',
              createdAt: refundPayment.createdAt,
              createdBy: refundPayment.createdBy,
            }]);
          }}
          onRollback={() => {
            // Remove optimistic refund on error
            setOptimisticPayments([]);
          }}
        />
      )}
    </DashboardLayout>
  );
}
