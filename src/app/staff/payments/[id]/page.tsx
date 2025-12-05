"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import RefundModal from "../_components/RefundModal";
import { ArrowLeft, AlertCircle, RefreshCw, Download } from "lucide-react";
import {
  PaymentSummaryCard,
  TransactionDetails,
  PaymentHistory,
  usePaymentDetail,
} from "@/features/payment-detail";

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const { payment, history, isLoading, error, refetch } = usePaymentDetail(paymentId);

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
        <p className="text-gray-600 mb-6">
          The payment you're looking for doesn't exist or you don't have access to it.
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

  return (
    <div className="space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            <p className="text-gray-600 mt-1">Payment ID: {payment.businessKey}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              onClick={() => alert("Download receipt")}
            >
              <Download className="w-4 h-4" />
              Receipt
            </button>
            {payment.canRefund && (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                onClick={() => setIsRefundModalOpen(true)}
              >
                <RefreshCw className="w-4 h-4" />
                Refund
              </button>
            )}
          </div>
        </div>
      </div>

      <PaymentSummaryCard payment={payment} />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Information</h2>
        <Link
          href={`/staff/cases/${payment.caseId}`}
          className="inline-flex items-center gap-2 text-[--navy] hover:underline"
        >
          View Full Case Details
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </Link>
      </div>

      <TransactionDetails payment={payment} />

      {history && <PaymentHistory history={history} />}

      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        onSuccess={() => refetch()}
        payment={{
          businessKey: payment.businessKey,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
        }}
      />
    </div>
  );
}
