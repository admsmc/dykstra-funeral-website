"use client";

import { Download, RefreshCw, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

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

interface BulkPaymentActionsProps {
  selectedPayments: PaymentRow[];
  onClearSelection: () => void;
  onExportSelected: () => void;
  onBatchRefund?: (payments: PaymentRow[]) => void;
}

export default function BulkPaymentActions({
  selectedPayments,
  onClearSelection,
  onExportSelected,
  onBatchRefund,
}: BulkPaymentActionsProps) {
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  const count = selectedPayments.length;
  const totalAmount = selectedPayments.reduce(
    (sum, p) => sum + p.amount.amount,
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Check if any selected payments can be refunded
  const refundableCount = selectedPayments.filter(
    (p) => p.status === "succeeded"
  ).length;

  const handleBatchRefund = () => {
    if (onBatchRefund) {
      const refundablePayments = selectedPayments.filter(
        (p) => p.status === "succeeded"
      );
      onBatchRefund(refundablePayments);
      setShowRefundConfirm(false);
      onClearSelection();
    }
  };

  return (
    <>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sticky top-0 z-40 bg-[--navy] text-white px-6 py-4 rounded-lg shadow-lg mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClearSelection}
                  className="p-1 hover:bg-white/20 rounded transition"
                  aria-label="Clear selection"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <p className="text-sm font-semibold">
                    {count} payment{count > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-xs opacity-90">
                    Total: {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Export Selected */}
                <button
                  onClick={onExportSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>

                {/* Batch Refund */}
                {refundableCount > 0 && onBatchRefund && (
                  <button
                    onClick={() => setShowRefundConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 rounded-lg transition text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refund {refundableCount}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Refund Confirmation Modal */}
      <AnimatePresence>
        {showRefundConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRefundConfirm(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Confirm Batch Refund
                    </h3>
                    <p className="text-sm text-gray-600">
                      You are about to refund {refundableCount} payment
                      {refundableCount > 1 ? "s" : ""} totaling{" "}
                      {formatCurrency(
                        selectedPayments
                          .filter((p) => p.status === "succeeded")
                          .reduce((sum, p) => sum + p.amount.amount, 0)
                      )}
                      .
                    </p>
                    {count > refundableCount && (
                      <p className="text-xs text-amber-600 mt-2">
                        Note: {count - refundableCount} selected payment
                        {count - refundableCount > 1 ? "s" : ""} cannot be
                        refunded (not in "succeeded" status).
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {selectedPayments
                    .filter((p) => p.status === "succeeded")
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                      >
                        <span className="text-gray-600">
                          Case: {payment.caseId}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(payment.amount.amount)}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowRefundConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchRefund}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                  >
                    Confirm Refund
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
