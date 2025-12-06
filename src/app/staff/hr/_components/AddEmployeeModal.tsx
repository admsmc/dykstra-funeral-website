"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hireEmployeeSchema, type HireEmployeeInput, DEPARTMENTS, POSITION_TITLES } from "@dykstra/domain";
import { trpc } from "@/lib/trpc/client";
import { Modal } from "@/components/ui/Modal";
import { Form, FormInput, FormSelect } from "@/components/ui/Form";
import { SuccessCelebration } from "@/components/ui/SuccessCelebration";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [employeeData, setEmployeeData] = useState<{ fullName: string; employeeNumber: string } | null>(null);

  const form = useForm<HireEmployeeInput>({
    resolver: zodResolver(hireEmployeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      hireDate: new Date(),
      positionTitle: "",
      department: "Operations",
      positionId: "",
    },
  });

  const hireEmployeeMutation = trpc.staff.employees.hire.useMutation({
    onSuccess: (data) => {
      setEmployeeData({
        fullName: data.fullName,
        employeeNumber: data.employeeNumber,
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
      console.error("Failed to hire employee:", error);
      alert(`Failed to hire employee: ${error.message}`);
    },
  });

  const handleClose = () => {
    if (!hireEmployeeMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  const onSubmit = (data: HireEmployeeInput) => {
    // Generate positionId if not provided (using department + title)
    const positionId = data.positionId || `${data.department.toLowerCase()}-${data.positionTitle.toLowerCase().replace(/\s+/g, '-')}`;
    
    hireEmployeeMutation.mutate({
      ...data,
      positionId,
    });
  };

  if (showCelebration && employeeData) {
    return (
      <SuccessCelebration
        message={`${employeeData.fullName} (${employeeData.employeeNumber}) has been added to the team. Onboarding checklist has been generated.`}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Employee" size="lg">
      <Form form={form} onSubmit={onSubmit}>
        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-[--charcoal] mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="firstName"
                label="First Name"
                placeholder="Enter first name"
                required
              />
              <FormInput
                name="lastName"
                label="Last Name"
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-[--charcoal] mb-3">Contact Information</h3>
            <FormInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="employee@dykstra.com"
              required
            />
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="text-sm font-semibold text-[--charcoal] mb-3">Employment Details</h3>
            <div className="space-y-4">
              <FormInput
                name="hireDate"
                label="Hire Date"
                type="date"
                required
              />
              
              <FormSelect
                name="department"
                label="Department"
                options={DEPARTMENTS.map((dept) => ({
                  label: dept,
                  value: dept,
                }))}
                required
              />

              <FormSelect
                name="positionTitle"
                label="Position Title"
                options={POSITION_TITLES.map((title) => ({
                  label: title,
                  value: title,
                }))}
                required
              />
            </div>
          </div>

          {/* Note about onboarding */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After hiring, an onboarding checklist will be automatically generated including I-9, W-4, benefits enrollment, and other required tasks.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={hireEmployeeMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={hireEmployeeMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[--navy] rounded-lg hover:bg-[--navy]/90 disabled:opacity-50 flex items-center space-x-2"
            >
              {hireEmployeeMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Hiring...</span>
                </>
              ) : (
                <span>Hire Employee</span>
              )}
            </button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
