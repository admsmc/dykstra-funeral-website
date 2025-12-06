"use client";

import { trpc } from "@/lib/trpc-client";
import Link from "next/link";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import ManualPaymentModal from "./_components/ManualPaymentModal";
import RefundModal from "./_components/RefundModal";
import FinancialReportsTab from "./_components/FinancialReportsTab";
import PaymentPlanTab from "./_components/PaymentPlanTab";
import PaymentSearchBar from "@/components/search/PaymentSearchBar";
import BulkPaymentActions from "@/components/bulk/BulkPaymentActions";
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
  const [searchFilters, setSearchFilters] = useState<any>(null);
  const [selectedPayments, setSelectedPayments] = useState<PaymentRow[]>([]);

  // Fetch payment statistics
  const { data: stats, isLoading: statsLoading } = trpc.payment.getStats.useQuery({
    funeralHomeId: undefined,
  });

  // Fetch payment list (merge search filters with dropdown filters)
  const effectiveStatus = searchFilters?.statuses?.[0] || (statusFilter !== "all" ? statusFilter : undefined);
  const effectiveMethod = searchFilters?.methods?.[0] || (methodFilter !== "all" ? methodFilter : undefined);
  
  const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = trpc.payment.list.useQuery({
    funeralHomeId: undefined,
    status: effectiveStatus as any,
    method: effectiveMethod as any,
    dateFrom: searchFilters?.dateFrom,
    dateTo: searchFilters?.dateTo,
    limit: 50,
    offset: 0,
  });

  // Merge optimistic payments with real payments, updating refunded status
  const serverPayments = paymentsData?.payments ?? [];
  let payments = [
    ...optimisticPayments,
    ...serverPayments.map(p => {
      // Mark as refunded if in optimistic refund state
      if (optimisticPayments.some(op => op.businessKey === p.businessKey && op.status === 'refunded')) {
        return { ...p, status: 'refunded' };
      }
      return p;
    })
  ];

  // Apply client-side amount filter if present
  if (searchFilters?.amountMin !== undefined || searchFilters?.amountMax !== undefined) {
    payments = payments.filter(p => {
      const amount = p.amount.amount;
      const min = searchFilters.amountMin ?? 0;
      const max = searchFilters.amountMax ?? Infinity;
      return amount >= min && amount <= max;
    });
  }

  // Apply client-side search query filter
  if (searchFilters?.searchQuery) {
    const query = searchFilters.searchQuery.toLowerCase();
    payments = payments.filter(p => {
      const caseId = p.caseId?.toLowerCase() || "";
      const amount = p.amount.amount.toString();
      const method = p.method?.toLowerCase() || "";
      const businessKey = p.businessKey?.toLowerCase() || "";
      return (
        caseId.includes(query) ||
        amount.includes(query) ||
        method.includes(query) ||
        businessKey.includes(query)
      );
    });
  }

  // Calculate active filter count
  const activeFilterCount = (
    (statusFilter !== "all" ? 1 : 0) +
    (methodFilter !== "all" ? 1 : 0) +
    (searchFilters?.dateFrom ? 1 : 0) +
    (searchFilters?.dateTo ? 1 : 0) +
    (searchFilters?.amountMin !== undefined ? 1 : 0) +
    (searchFilters?.amountMax !== undefined ? 1 : 0)
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Export selected payments to CSV
  const exportSelectedToCSV = () => {
    const paymentsToExport = selectedPayments.length > 0 ? selectedPayments : payments;
    
    const headers = ["Date", "Case ID", "Amount", "Method", "Status", "Business Key"];
    const rows = paymentsToExport.map((p) => [
      new Date(p.createdAt).toLocaleDateString(),
      p.caseId,
      p.amount.amount,
      p.method,
      p.status,
      p.businessKey,
    ]);
    
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = selectedPayments.length > 0 
      ? `selected-payments_${new Date().toISOString().split("T")[0]}.csv`
      : `all-payments_${new Date().toISOString().split("T")[0]}.csv`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle batch refund
  const handleBatchRefund = async (paymentsToRefund: PaymentRow[]) => {
    // Process refunds sequentially
    for (const payment of paymentsToRefund) {
      setRefundPayment(payment);
    }
    // In a real implementation, this would trigger the RefundModal for each payment
    // or a batch refund API endpoint
    alert(`Batch refund initiated for ${paymentsToRefund.length} payment(s)`);
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
      actions={
        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition"
          onClick={() => setIsManualPaymentModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      }
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
          {/* Search Bar */}
          <div className="mb-6">
            <PaymentSearchBar onFiltersChange={setSearchFilters} />
          </div>

          {/* KPI Cards */}
          <PageSection title="Payment Statistics" withCard={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className={`${card.bgColor} rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer`}
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
                </motion.div>
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
            {/* Bulk Actions Bar */}
            <BulkPaymentActions
              selectedPayments={selectedPayments}
              onClearSelection={() => {
                setSelectedPayments([]);
              }}
              onExportSelected={exportSelectedToCSV}
              onBatchRefund={handleBatchRefund}
            />

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
                enableRowSelection={true}
                emptyState={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-12 text-center"
                  >
                    <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                      <DollarSign className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Payments Found
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {searchFilters?.searchQuery || activeFilterCount > 0
                        ? "Try adjusting your search or filters"
                        : "No payment transactions yet"}
                    </p>
                    {(searchFilters?.searchQuery || activeFilterCount > 0) && (
                      <button
                        onClick={() => {
                          setSearchFilters(null);
                          setStatusFilter("all");
                          setMethodFilter("all");
                        }}
                        className="px-4 py-2 text-sm font-medium text-[--navy] border border-[--navy] rounded-lg hover:bg-[--cream] transition"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </motion.div>
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
