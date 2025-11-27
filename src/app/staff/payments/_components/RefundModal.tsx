"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { X, RefreshCw, DollarSign, AlertTriangle } from "lucide-react";
import { z } from "zod";

/**
 * Refund Modal
 * Process refunds for succeeded payments
 * 
 * Features:
 * - Pre-filled amount (editable up to original amount)
 * - Refund reason dropdown + custom option
 * - Notes textarea
 * - Validation with max amount check
 * - tRPC mutation integration
 * - Creates SCD2 audit trail
 */

// Refund reasons
const REFUND_REASONS = [
  "Customer request",
  "Duplicate payment",
  "Service cancellation",
  "Pricing error",
  "Billing dispute",
  "Other",
] as const;

// Validation schema
const refundSchema = z.object({
  refundAmount: z.number().positive("Refund amount must be greater than zero"),
  reason: z.string().min(1, "Please select a reason"),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional(),
});

type RefundForm = z.infer<typeof refundSchema>;

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  payment: {
    businessKey: string;
    amount: number;
    method: string;
    status: string;
  };
}

export default function RefundModal({
  isOpen,
  onClose,
  onSuccess,
  payment,
}: RefundModalProps) {
  const [formData, setFormData] = useState<RefundForm>({
    refundAmount: payment.amount,
    reason: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RefundForm, string>>>({});
  const [showCustomReason, setShowCustomReason] = useState(false);

  // Process refund mutation
  const refundMutation = trpc.payment.processRefund.useMutation({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      setErrors({ reason: error.message });
    },
  });

  // Reset form on close
  const handleClose = () => {
    setFormData({
      refundAmount: payment.amount,
      reason: "",
      notes: "",
    });
    setErrors({});
    setShowCustomReason(false);
    onClose();
  };

  // Handle reason change
  const handleReasonChange = (value: string) => {
    setFormData({ ...formData, reason: value });
    setShowCustomReason(value === "Other");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate refund amount doesn't exceed original
    if (formData.refundAmount > payment.amount) {
      setErrors({
        refundAmount: `Refund amount cannot exceed original payment amount of $${payment.amount.toFixed(2)}`,
      });
      return;
    }

    // Validate form
    const result = refundSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RefundForm, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof RefundForm] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Submit refund
    refundMutation.mutate({
      paymentBusinessKey: payment.businessKey,
      refundAmount: formData.refundAmount,
      reason: formData.reason,
      notes: formData.notes,
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Process Refund</h2>
              <p className="text-sm text-gray-600">
                Refund payment • {payment.method.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mx-6 mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-900 mb-1">
              This action cannot be undone
            </p>
            <p className="text-yellow-800">
              Processing this refund will create a permanent audit trail and
              update the payment status. Both the original payment and refund
              will be tracked in the version history.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Original Payment Amount */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-1">
              Original Payment
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(payment.amount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Payment ID: {payment.businessKey}
            </p>
          </div>

          {/* Refund Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Amount <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={payment.amount}
                value={formData.refundAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    refundAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.refundAmount ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.refundAmount && (
              <p className="text-red-600 text-sm mt-1">{errors.refundAmount}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {formatCurrency(payment.amount)}
            </p>
          </div>

          {/* Refund Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Reason <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.reason}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => handleReasonChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.reason ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select a reason...</option>
              {REFUND_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p className="text-red-600 text-sm mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Custom Reason (if "Other" selected) */}
          {showCustomReason && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify
              </label>
              <input
                type="text"
                placeholder="Enter custom reason..."
                value={formData.reason === "Other" ? "" : formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              placeholder="Add any additional context for this refund..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.notes?.length || 0} / 2000 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={refundMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={refundMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refundMutation.isPending
                ? "Processing Refund..."
                : `Process Refund (${formatCurrency(formData.refundAmount)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
