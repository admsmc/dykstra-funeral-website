"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc-client";
import { SuccessCelebration } from "@/components/SuccessCelebration";

const insuranceClaimSchema = z.object({
  caseId: z.string().min(1, "Case ID is required"),
  insuranceCompany: z.string().min(1, "Insurance company is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  policyHolderName: z.string().min(1, "Policy holder name is required"),
  assignedAmount: z.number().positive("Amount must be positive"),
  claimNumber: z.string().optional(),
  notes: z.string().optional(),
});

type InsuranceClaimForm = z.infer<typeof insuranceClaimSchema>;

interface RecordInsuranceClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  caseId?: string;
  caseName?: string;
}

export function RecordInsuranceClaimModal({
  isOpen,
  onClose,
  onSuccess,
  caseId,
  caseName,
}: RecordInsuranceClaimModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InsuranceClaimForm>({
    resolver: zodResolver(insuranceClaimSchema),
    defaultValues: {
      caseId: caseId || "",
    },
  });

  const recordClaim = trpc.payment.assignInsurance.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        reset();
        onClose();
        onSuccess?.();
      }, 2000);
    },
  });

  const onSubmit = (data: InsuranceClaimForm) => {
    recordClaim.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-serif text-[--navy]">Record Insurance Claim</h2>
                {caseName && <p className="text-gray-600 mt-1">Case: {caseName}</p>}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Case ID (if not pre-filled) */}
              {!caseId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case ID *
                  </label>
                  <input
                    {...register("caseId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                    placeholder="C-2024-123"
                  />
                  {errors.caseId && (
                    <p className="text-red-600 text-sm mt-1">{errors.caseId.message}</p>
                  )}
                </div>
              )}

              {/* Insurance Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Company *
                </label>
                <select
                  {...register("insuranceCompany")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                >
                  <option value="">Select insurance company...</option>
                  <option value="Blue Cross Blue Shield">Blue Cross Blue Shield</option>
                  <option value="Aetna">Aetna</option>
                  <option value="UnitedHealthcare">UnitedHealthcare</option>
                  <option value="Cigna">Cigna</option>
                  <option value="Humana">Humana</option>
                  <option value="Medicare">Medicare</option>
                  <option value="Medicaid">Medicaid</option>
                  <option value="Veterans Affairs">Veterans Affairs (VA)</option>
                  <option value="Other">Other</option>
                </select>
                {errors.insuranceCompany && (
                  <p className="text-red-600 text-sm mt-1">{errors.insuranceCompany.message}</p>
                )}
              </div>

              {/* Policy Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Policy Number *
                  </label>
                  <input
                    {...register("policyNumber")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                    placeholder="POL-123456"
                  />
                  {errors.policyNumber && (
                    <p className="text-red-600 text-sm mt-1">{errors.policyNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Policy Holder Name *
                  </label>
                  <input
                    {...register("policyHolderName")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                    placeholder="John Doe"
                  />
                  {errors.policyHolderName && (
                    <p className="text-red-600 text-sm mt-1">{errors.policyHolderName.message}</p>
                  )}
                </div>
              </div>

              {/* Claim Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Claim Amount *
                  </label>
                  <input
                    {...register("assignedAmount", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                    placeholder="0.00"
                  />
                  {errors.assignedAmount && (
                    <p className="text-red-600 text-sm mt-1">{errors.assignedAmount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Claim Number (Optional)
                  </label>
                  <input
                    {...register("claimNumber")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                    placeholder="CLM-789012"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  placeholder="Additional claim information, special instructions, etc."
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will assign the insurance claim to the case and
                  track the expected payment. Actual payment posting is handled separately when
                  the insurance company remits payment.
                </p>
              </div>

              {/* Error Display */}
              {recordClaim.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    {recordClaim.error.message || "Failed to record insurance claim. Please try again."}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Recording Claim..." : "Record Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSuccess && (
        <SuccessCelebration
          message="Insurance claim recorded successfully!"
          onComplete={() => setShowSuccess(false)}
        />
      )}
    </>
  );
}
