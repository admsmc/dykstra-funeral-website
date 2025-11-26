"use client";

import { trpc } from "@/lib/trpc-client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  RefreshCw,
  Download,
} from "lucide-react";

/**
 * Payment Details Page
 * Shows individual payment information with SCD2 version history
 * 
 * Features:
 * - Payment summary card
 * - Case information link
 * - Transaction details
 * - SCD2 version history timeline
 * - Action buttons (refund, download receipt)
 */

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;

  // Fetch payment with history
  const { data, isLoading, error } = trpc.payment.getById.useQuery({
    paymentId,
    includeHistory: true,
  });

  const payment = data?.payment;
  const history = data?.history ?? [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date/time
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; icon: any }
    > = {
      succeeded: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
      },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      processing: { bg: "bg-blue-100", text: "text-blue-800", icon: Clock },
      failed: { bg: "bg-red-100", text: "text-red-800", icon: AlertCircle },
      cancelled: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: AlertCircle,
      },
      refunded: { bg: "bg-purple-100", text: "text-purple-800", icon: RefreshCw },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="w-4 h-4" />
        {status.toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[--navy]" />
          <p className="text-gray-600 mt-4">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The payment you're looking for doesn't exist or you don't have access
          to it.
        </p>
        <button
          onClick={() => router.push("/staff/payments")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payments
        </button>
      </div>
    );
  }

  // Payment method labels
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/staff/payments")}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payments
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Details
            </h1>
            <p className="text-gray-600 mt-1">
              Payment ID: {payment.businessKey}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              onClick={() => alert("Download receipt")}
            >
              <Download className="w-4 h-4" />
              Receipt
            </button>
            {payment.status === "succeeded" && (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                onClick={() => alert("Process refund")}
              >
                <RefreshCw className="w-4 h-4" />
                Refund
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Summary Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Amount</p>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(payment.amount.amount)}
              </span>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
            <StatusBadge status={payment.status} />
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Payment Method
            </p>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-lg text-gray-900">
                {methodLabels[payment.method] || payment.method}
              </span>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Payment Date
            </p>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-lg text-gray-900">
                {formatDateTime(payment.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Case Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Case Information
        </h2>
        <Link
          href={`/staff/cases/${payment.caseId}`}
          className="inline-flex items-center gap-2 text-[--navy] hover:underline"
        >
          View Full Case Details
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </Link>
      </div>

      {/* Transaction Details */}
      {(payment.stripePaymentIntentId ||
        payment.stripePaymentMethodId ||
        payment.receiptUrl ||
        payment.failureReason ||
        payment.notes) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Transaction Details
          </h2>
          <div className="space-y-3">
            {payment.stripePaymentIntentId && (
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Stripe Payment Intent ID
                </p>
                <p className="text-sm text-gray-900 font-mono">
                  {payment.stripePaymentIntentId}
                </p>
              </div>
            )}
            {payment.stripePaymentMethodId && (
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Stripe Payment Method ID
                </p>
                <p className="text-sm text-gray-900 font-mono">
                  {payment.stripePaymentMethodId}
                </p>
              </div>
            )}
            {payment.receiptUrl && (
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Receipt URL
                </p>
                <a
                  href={payment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[--navy] hover:underline"
                >
                  {payment.receiptUrl}
                </a>
              </div>
            )}
            {payment.failureReason && (
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Failure Reason
                </p>
                <p className="text-sm text-red-600">{payment.failureReason}</p>
              </div>
            )}
            {payment.notes && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-900">{payment.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Version History (SCD2) */}
      {history.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Version History
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            This payment has {history.length} versions (status changes tracked
            for audit compliance)
          </p>
          <div className="space-y-4">
            {history
              .sort((a, b) => b.version - a.version)
              .map((version, index) => (
                <div
                  key={version.id}
                  className={`flex items-start gap-4 pb-4 ${
                    index < history.length - 1
                      ? "border-b border-gray-200"
                      : ""
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0 ? "bg-[--navy]" : "bg-gray-300"
                      }`}
                    />
                    {index < history.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2" />
                    )}
                  </div>

                  {/* Version details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        Version {version.version}
                      </span>
                      <StatusBadge status={version.status} />
                      {index === 0 && (
                        <span className="text-xs bg-[--navy] text-white px-2 py-0.5 rounded">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Updated: {formatDateTime(version.updatedAt)}</p>
                      <p>Amount: {formatCurrency(version.amount.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
