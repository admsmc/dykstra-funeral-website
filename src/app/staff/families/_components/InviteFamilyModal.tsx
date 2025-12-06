"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { familyInvitationSchema } from "@dykstra/domain/validation";
import { trpc } from "@/lib/trpc/client";
import { Modal } from "@/components/ui/Modal";
import { Form, FormInput, FormSelect } from "@/components/ui/Form";
import { SuccessCelebration } from "@/components/ui/SuccessCelebration";
import { Mail } from "lucide-react";

// Reuse the domain-level familyInvitationSchema and extend with caseId for this UI flow.
const inviteFamilySchema = familyInvitationSchema.extend({
  caseId: z.string().min(1, "Case ID is required"),
});

type InviteFamilyInput = z.infer<typeof inviteFamilySchema>;

interface InviteFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  caseId?: string;
  caseName?: string;
}

export function InviteFamilyModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  caseId = "",
  caseName,
}: InviteFamilyModalProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [inviteeData, setInviteeData] = useState<{ name: string; email: string } | null>(null);

  const form = useForm<InviteFamilyInput>({
    resolver: zodResolver(inviteFamilySchema),
    defaultValues: {
      caseId,
      name: "",
      email: "",
      phone: "",
      relationship: "",
      role: "FAMILY_MEMBER",
    },
  });

  const inviteMutation = trpc.invitation.create.useMutation({
    onSuccess: (data) => {
      const formData = form.getValues();
      setInviteeData({
        name: formData.name,
        email: formData.email,
      });
      setShowCelebration(true);
      form.reset({ caseId, name: "", email: "", phone: "", relationship: "", role: "FAMILY_MEMBER" });
      setTimeout(() => {
        setShowCelebration(false);
        onClose();
        onSuccess?.();
      }, 3000);
    },
    onError: (error) => {
      console.error("Failed to send invitation:", error);
      alert(`Failed to send invitation: ${error.message}`);
    },
  });

  const handleClose = () => {
    if (!inviteMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  const onSubmit = (data: InviteFamilyInput) => {
    inviteMutation.mutate({
      ...data,
      permissions: {
        viewDocuments: true,
        viewPhotos: true,
        viewFinancials: data.role === "PRIMARY_CONTACT",
        makePayments: data.role === "PRIMARY_CONTACT",
      },
    });
  };

  if (showCelebration && inviteeData) {
    return (
      <SuccessCelebration
        message={`Invitation sent! Portal magic link emailed to ${inviteeData.name} at ${inviteeData.email}. Valid for 7 days.`}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Family to Portal" size="lg">
      <Form form={form} onSubmit={onSubmit}>
        <div className="space-y-6">
          {/* Case Info */}
          {caseName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Case:</strong> {caseName}
                </p>
              </div>
            </div>
          )}

          {/* Family Member Info */}
          <div>
            <h3 className="text-sm font-semibold text-[--charcoal] mb-3">Family Member Information</h3>
            <div className="space-y-4">
              <FormInput
                name="name"
                label="Full Name"
                placeholder="Enter full name"
                required
              />

              <FormInput
                name="email"
                label="Email Address"
                type="email"
                placeholder="family@example.com"
                required
              />

              <FormInput
                name="phone"
                label="Phone Number (Optional)"
                placeholder="(555) 123-4567"
              />

              <FormInput
                name="relationship"
                label="Relationship (Optional)"
                placeholder="e.g., Son, Daughter, Spouse"
              />
            </div>
          </div>

          {/* Role Selection */}
          <FormSelect
            name="role"
            label="Portal Role"
            options={[
              { label: "Family Member - View only", value: "FAMILY_MEMBER" },
              { label: "Primary Contact - Full access (financials & payments)", value: "PRIMARY_CONTACT" },
            ]}
            required
          />

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> An email with a secure magic link will be sent. The invitation is valid for 7 days. Family members can view case details, photos, and documents. Primary contacts can also make payments and view financials.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={inviteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[--navy] rounded-lg hover:bg-[--navy]/90 disabled:opacity-50 flex items-center space-x-2"
            >
              {inviteMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
