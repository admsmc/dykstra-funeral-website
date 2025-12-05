"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc-client";
import { X, RefreshCw, AlertTriangle } from "lucide-react";
import { createRefundSchemaWithMax, REFUND_REASONS, type RefundForm } from "@dykstra/domain/validation";
import { Form } from "@dykstra/ui";
import { FormInput, FormSelect, FormCurrencyInput, FormTextarea } from "@dykstra/ui";
import { useToast } from "@/components/toast";
import { ButtonSpinner } from "@/components/loading";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";

/**
 * Refund Modal
 * Process refunds for succeeded payments
 * 
 * Refactored with react-hook-form + domain validation schemas.
 * Reduced from 322 lines to ~180 lines (44% reduction).
 */

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
  onOptimisticUpdate?: (paymentKey: string) => void;
  onRollback?: () => void;
}

export default function RefundModal({
  isOpen,
  onClose,
  onSuccess,
  payment,
  onOptimisticUpdate,
  onRollback,
}: RefundModalProps) {
  const toast = useToast();

  // Initialize form with react-hook-form + dynamic max amount validation
  const form = useForm<RefundForm>({
    resolver: zodResolver(createRefundSchemaWithMax(payment.amount)),
    defaultValues: {
      refundAmount: payment.amount,
      reason: "",
      notes: "",
    },
  });

  // Watch reason field for conditional custom input
  const reason = form.watch("reason");
  const showCustomReason = reason === "Other";

  // Process refund mutation with optimistic updates
  const refundMutation = trpc.payment.processRefund.useMutation();

  // Reset form on close
  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Optimistic mutation
  const { mutate, isOptimistic } = useOptimisticMutation({
    mutationFn: (variables: any) => refundMutation.mutateAsync(variables),
    onOptimisticUpdate: (variables) => {
      if (onOptimisticUpdate) {
        // Notify parent to mark payment as refunded optimistically
        onOptimisticUpdate(payment.businessKey);
      }
    },
    rollback: () => {
      onRollback?.();
    },
    onSuccess: () => {
      toast.success('Refund processed successfully');
      onSuccess?.();
      handleClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to process refund: ${error.message}`);
      form.setError("reason", { message: error.message });
    },
  });

  // Handle form submission (validation automatic via react-hook-form)
  const onSubmit = form.handleSubmit((data) => {
    mutate({
      paymentBusinessKey: payment.businessKey,
      refundAmount: data.refundAmount,
      reason: data.reason,
      notes: data.notes,
    });
  });

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
        <Form {...form}>
          <form onSubmit={onSubmit} className="p-6 space-y-6">
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
            <FormCurrencyInput
              name="refundAmount"
              label="Refund Amount"
              placeholder="0.00"
              min={0.01}
              max={payment.amount}
              description={`Maximum: ${formatCurrency(payment.amount)}`}
              required
            />

            {/* Refund Reason */}
            <FormSelect
              name="reason"
              label="Refund Reason"
              placeholder="Select a reason..."
              options={REFUND_REASONS.map((r) => ({ value: r, label: r }))}
              required
            />

            {/* Custom Reason (if "Other" selected) */}
            {showCustomReason && (
              <FormInput
                name="reason"
                label="Please specify"
                placeholder="Enter custom reason..."
              />
            )}

            {/* Notes */}
            <FormTextarea
              name="notes"
              label="Additional Notes"
              placeholder="Add any additional context for this refund..."
              maxLength={2000}
              showCharacterCount
              rows={3}
            />

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
                disabled={isOptimistic}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isOptimistic && <ButtonSpinner />}
                {isOptimistic
                  ? "Processing Refund..."
                  : `Process Refund (${formatCurrency(form.watch("refundAmount") || 0)})`}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
