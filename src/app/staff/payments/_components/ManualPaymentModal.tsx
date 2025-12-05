"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc-client";
import { X, DollarSign } from "lucide-react";
import { manualPaymentSchema, type ManualPaymentForm } from "@dykstra/domain/validation";
import { Form, SuccessCelebration } from "@dykstra/ui";
import { FormInput, FormSelect, FormCurrencyInput, FormTextarea } from "@dykstra/ui";
import { useToast } from "@/components/toast";
import { ButtonSpinner } from "@/components/loading";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";

/**
 * Manual Payment Modal
 * Record cash, check, or ACH payments made outside of Stripe
 * 
 * Refactored with react-hook-form + domain validation schemas.
 * Reduced from 326 lines to ~150 lines (54% reduction).
 */

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOptimisticUpdate?: (payment: any) => void;
  onRollback?: () => void;
}

export default function ManualPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  onOptimisticUpdate,
  onRollback,
}: ManualPaymentModalProps) {
  const [caseSearchQuery, setCaseSearchQuery] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ amount: 0, caseName: "" });
  const toast = useToast();

  // Initialize form with react-hook-form + Zod validation
  const form = useForm<ManualPaymentForm>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      caseId: "",
      amount: 0,
      method: "cash",
      checkNumber: "",
      paymentDate: new Date(),
      notes: "",
    },
  });

  // Watch payment method for conditional check number field
  const paymentMethod = form.watch("method");

  // Fetch cases for selection (limit to active/inquiry cases)
  const { data: casesData } = trpc.case.listAll.useQuery(
    {
      limit: 20,
      status: undefined,
    },
    {
      enabled: isOpen,
    }
  );

  // Record manual payment mutation with optimistic updates
  const recordPaymentMutation = trpc.payment.recordManual.useMutation();

  // Reset form on close
  const handleClose = () => {
    form.reset();
    setCaseSearchQuery("");
    onClose();
  };

  // Optimistic mutation
  const { mutate, isOptimistic } = useOptimisticMutation({
    mutationFn: (variables: any) => recordPaymentMutation.mutateAsync(variables),
    onOptimisticUpdate: (variables) => {
      if (onOptimisticUpdate) {
        // Create optimistic payment object
        const optimisticPayment = {
          id: `temp-${Date.now()}`,
          businessKey: `temp-${Date.now()}`,
          caseId: variables.caseId,
          amount: {
            amount: variables.amount,
            currency: 'USD',
          },
          method: variables.method,
          status: 'processing',
          createdAt: new Date(),
          createdBy: 'current-user',
        };
        onOptimisticUpdate(optimisticPayment);
      }
    },
    rollback: () => {
      onRollback?.();
    },
    onSuccess: (data, variables) => {
      // Show celebration with payment details
      const selectedCase = casesData?.pages[0]?.items.find(c => c.businessKey === variables.caseId);
      setCelebrationData({
        amount: variables.amount,
        caseName: selectedCase?.decedentName || "Family",
      });
      setShowCelebration(true);
      
      toast.success('Payment recorded successfully');
      onSuccess?.();
      
      // Close modal after celebration
      setTimeout(() => {
        handleClose();
      }, 3000);
    },
    onError: (error: any) => {
      toast.error(`Failed to record payment: ${error.message}`);
      form.setError("caseId", { message: error.message });
    },
  });

  // Handle form submission (validation automatic via react-hook-form)
  const onSubmit = form.handleSubmit((data) => {
    mutate({
      caseId: data.caseId,
      amount: data.amount,
      method: data.method,
      checkNumber: data.method === "check" ? data.checkNumber : undefined,
      paymentDate: data.paymentDate,
      notes: data.notes,
    });
  });

  // Memoized case options for FormSelect
  const caseOptions = useMemo(() => {
    const cases = casesData?.pages[0]?.items ?? [];
    const filtered = caseSearchQuery
      ? cases.filter((c) =>
          c.decedentName.toLowerCase().includes(caseSearchQuery.toLowerCase())
        )
      : cases;
    
    return filtered.map((c) => ({
      value: c.businessKey,
      label: `${c.decedentName} - ${c.status}`,
    }));
  }, [casesData, caseSearchQuery]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[--navy] rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Record Manual Payment</h2>
              <p className="text-sm text-gray-600">Cash, check, or ACH payment</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={onSubmit} className="p-6 space-y-6">
            {/* Case Search + Selection */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search by decedent name..."
                value={caseSearchQuery}
                onChange={(e) => setCaseSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
              />
              <FormSelect
                name="caseId"
                label="Case"
                placeholder="Select a case..."
                options={caseOptions}
                required
              />
            </div>

            {/* Payment Method */}
            <FormSelect
              name="method"
              label="Payment Method"
              options={[
                { value: "cash", label: "Cash" },
                { value: "check", label: "Check" },
                { value: "ach", label: "ACH / Bank Transfer" },
              ]}
              required
            />

            {/* Check Number (conditional) */}
            {paymentMethod === "check" && (
              <FormInput
                name="checkNumber"
                label="Check Number"
                placeholder="e.g., 1234"
              />
            )}

            {/* Amount */}
            <FormCurrencyInput
              name="amount"
              label="Amount"
              placeholder="0.00"
              min={0.01}
              max={999999.99}
              required
            />

            {/* Payment Date */}
            <FormInput
              name="paymentDate"
              label="Payment Date"
              type="date"
              required
            />

            {/* Notes */}
            <FormTextarea
              name="notes"
              label="Notes"
              placeholder="Additional notes about this payment..."
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
                disabled={recordPaymentMutation.isPending}
              >
                Cancel
              </button>
            <button
              type="submit"
              disabled={isOptimistic}
              className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isOptimistic && <ButtonSpinner />}
              {isOptimistic ? "Recording..." : "Record Payment"}
            </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
    
    {/* Success Celebration */}
    <SuccessCelebration
      show={showCelebration}
      message="Payment Recorded!"
      submessage={`$${celebrationData.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} received from ${celebrationData.caseName}`}
      onComplete={() => setShowCelebration(false)}
    />
    </>
  );
}
