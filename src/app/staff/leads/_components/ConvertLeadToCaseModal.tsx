"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { convertLeadWithDetailsSchema, type ConvertLeadWithDetailsInput } from "@dykstra/domain";
import { trpc } from "@/lib/trpc/client";
import { Modal } from "@/components/ui/Modal";
import { Form, FormInput, FormSelect } from "@/components/ui/Form";
import { SuccessCelebration } from "@/components/ui/SuccessCelebration";
import { ArrowRight } from "lucide-react";

interface ConvertLeadToCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  leadId: string;
  leadName: string;
}

export function ConvertLeadToCaseModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  leadId,
  leadName,
}: ConvertLeadToCaseModalProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [caseData, setCaseData] = useState<{ caseId: string; decedentName: string } | null>(null);

  const form = useForm<ConvertLeadWithDetailsInput>({
    resolver: zodResolver(convertLeadWithDetailsSchema),
    defaultValues: {
      leadId,
      decedentName: "",
      caseType: "AT_NEED",
    },
  });

  const convertMutation = trpc.lead.convertToCase.useMutation({
    onSuccess: (data) => {
      setCaseData({
        caseId: data.case.id,
        decedentName: data.case.decedentName,
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
      console.error("Failed to convert lead:", error);
      alert(`Failed to convert lead: ${error.message}`);
    },
  });

  const handleClose = () => {
    if (!convertMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  const onSubmit = (data: ConvertLeadWithDetailsInput) => {
    convertMutation.mutate({
      ...data,
      caseId: crypto.randomUUID(), // Generate case ID
    });
  };

  if (showCelebration && caseData) {
    return (
      <SuccessCelebration
        message={`${leadName} has been converted to case ${caseData.caseId}. You can now manage the case from the Cases page.`}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Convert Lead to Case" size="md">
      <Form form={form} onSubmit={onSubmit}>
        <div className="space-y-6">
          {/* Lead Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Converting Lead</p>
              <p className="text-lg font-semibold text-blue-900">{leadName}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">To Case</p>
              <p className="text-sm text-blue-700">New case will be created</p>
            </div>
          </div>

          {/* Case Type */}
          <FormSelect
            name="caseType"
            label="Case Type"
            options={[
              { label: "At-Need (Active funeral arrangements)", value: "AT_NEED" },
              { label: "Pre-Need (Pre-planning)", value: "PRE_NEED" },
              { label: "Inquiry (Information only)", value: "INQUIRY" },
            ]}
            required
          />

          {/* Decedent Name */}
          <FormInput
            name="decedentName"
            label="Decedent Name"
            placeholder="Enter full name of the deceased"
            required
          />

          {/* Info Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Once converted, the lead status will be marked as "converted" and a new case will be created. This action cannot be undone.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={convertMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={convertMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {convertMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Convert to Case</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
