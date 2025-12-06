"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignInsuranceSchema, type AssignInsuranceInput, INSURANCE_COMPANIES } from "@dykstra/domain";
import { trpc } from "@/lib/trpc/client";
import { Modal } from "@/components/ui/Modal";
import { Form, FormInput, FormSelect, FormTextarea } from "@/components/ui/Form";
import { SuccessCelebration } from "@/components/ui/SuccessCelebration";

interface AssignInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  caseId: string;
  caseName?: string;
}

export function AssignInsuranceModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  caseId,
  caseName,
}: AssignInsuranceModalProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [insuranceData, setInsuranceData] = useState<{ company: string; amount: number } | null>(null);

  const form = useForm<AssignInsuranceInput>({
    resolver: zodResolver(assignInsuranceSchema),
    defaultValues: {
      caseId,
      insuranceCompany: "",
      policyNumber: "",
      policyHolderName: "",
      assignedAmount: 0,
      claimNumber: "",
      notes: "",
    },
  });

  const assignInsuranceMutation = trpc.payment.assignInsurance.useMutation({
    onSuccess: (data) => {
      const formData = form.getValues();
      setInsuranceData({
        company: formData.insuranceCompany,
        amount: formData.assignedAmount,
      });
      setShowCelebration(true);
      form.reset();
      setTimeout(() => {
        setShowCelebration(false);
        onClose();
        onSuccess?.();
      }, 3000);
    },
    onError: (error) => {
      console.error("Failed to assign insurance:", error);
      alert(`Failed to assign insurance: ${error.message}`);
    },
  });

  const handleClose = () => {
    if (!assignInsuranceMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  const onSubmit = (data: AssignInsuranceInput) => {
    assignInsuranceMutation.mutate(data);
  };

  if (showCelebration && insuranceData) {
    return (
      <SuccessCelebration
        message={`${insuranceData.company} policy assigned for $${insuranceData.amount.toLocaleString()} to ${caseName || "this case"}.`}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Insurance to Case" size="lg">
      <Form form={form} onSubmit={onSubmit}>
        <div className="space-y-6">
          {/* Case Info */}
          {caseName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Case:</strong> {caseName}
              </p>
            </div>
          )}

          {/* Insurance Company */}
          <FormSelect
            name="insuranceCompany"
            label="Insurance Company"
            options={[
              { label: "Select company...", value: "" },
              ...INSURANCE_COMPANIES.map((company) => ({
                label: company,
                value: company,
              })),
            ]}
            required
          />

          {/* Policy Details */}
          <div>
            <h3 className="text-sm font-semibold text-[--charcoal] mb-3">Policy Details</h3>
            <div className="space-y-4">
              <FormInput
                name="policyNumber"
                label="Policy Number"
                placeholder="Enter policy number"
                required
              />
              
              <FormInput
                name="policyHolderName"
                label="Policy Holder Name"
                placeholder="Enter policy holder name"
                required
              />

              <FormInput
                name="claimNumber"
                label="Claim Number (Optional)"
                placeholder="Enter claim number if available"
              />
            </div>
          </div>

          {/* Assigned Amount */}
          <FormInput
            name="assignedAmount"
            label="Assigned Amount"
            type="number"
            placeholder="0.00"
            required
          />

          {/* Notes */}
          <FormTextarea
            name="notes"
            label="Notes (Optional)"
            placeholder="Additional notes about this insurance assignment..."
            rows={4}
          />

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The insurance assignment will be recorded and can be tracked in the case's financial summary. Status updates can be managed from the AR page.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={assignInsuranceMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignInsuranceMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[--navy] rounded-lg hover:bg-[--navy]/90 disabled:opacity-50 flex items-center space-x-2"
            >
              {assignInsuranceMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Assign Insurance</span>
              )}
            </button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
