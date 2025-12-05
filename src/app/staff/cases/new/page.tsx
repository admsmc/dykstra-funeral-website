"use client";

import { trpc } from "@/lib/trpc-client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/toast";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { newCaseSchema, CASE_TYPES, type NewCaseForm } from "@dykstra/domain/validation";
import { Form } from "@dykstra/ui";
import { FormInput, FormSelect } from "@dykstra/ui";
import { Button, SuccessCelebration } from "@dykstra/ui";
import { useState } from "react";

/**
 * Case Creation Page
 * Form to create a new funeral case
 * 
 * Refactored with react-hook-form + domain validation schemas.
 */

// Case type descriptions for UI
const CASE_TYPE_DESCRIPTIONS: Record<string, string> = {
  AT_NEED: "Family is currently in need of services",
  PRE_NEED: "Pre-planning for future arrangements",
  INQUIRY: "Initial inquiry, not yet committed",
};

export default function NewCasePage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const toast = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Initialize form with react-hook-form + domain validation
  const form = useForm<NewCaseForm>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      decedentName: "",
      type: "AT_NEED",
    },
  });
  
  // Watch case type for description display
  const caseType = form.watch("type");
  
  const createCaseMutation = trpc.case.create.useMutation();
  
  // Store previous cases for rollback
  let previousCases: any = null;
  
  // Optimistic mutation using useOptimisticMutation hook
  const { mutate: createCase, isOptimistic } = useOptimisticMutation({
    mutationFn: async (variables: { decedentName: string; type: string }) => {
      return createCaseMutation.mutateAsync(variables);
    },
    onOptimisticUpdate: async (newCase) => {
      // Cancel outgoing refetches
      await utils.case.listAll.cancel();
      
      // Snapshot current value
      previousCases = utils.case.listAll.getInfiniteData();
      
      // Optimistically update cache
      utils.case.listAll.setInfiniteData(
        { limit: 50 },
        (old) => {
          if (!old) return old;
          
          const optimisticCase = {
            id: `temp-${Date.now()}`,
            businessKey: `temp-${Date.now()}`,
            version: 1,
            decedentName: newCase.decedentName,
            type: newCase.type,
            status: "INQUIRY" as const,
            serviceType: null,
            serviceDate: null,
            createdAt: new Date(),
            createdBy: "current-user",
          };
          
          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                items: [optimisticCase, ...old.pages[0].items],
                total: old.pages[0].total + 1,
              },
              ...old.pages.slice(1),
            ],
          };
        }
      );
    },
    rollback: () => {
      // Roll back to previous value on error
      if (previousCases) {
        utils.case.listAll.setInfiniteData({ limit: 50 }, previousCases);
      }
      utils.case.listAll.invalidate();
    },
    onSuccess: (result) => {
      setShowSuccess(true);
      toast.success("Case created successfully");
      utils.case.listAll.invalidate();
      // Navigate after celebration
      setTimeout(() => {
        router.push(`/staff/cases/${result.id}`);
      }, 2000);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create case");
    },
  });

  // Handle form submission (validation automatic via react-hook-form)
  const onSubmit = form.handleSubmit(async (data) => {
    await createCase({
      decedentName: data.decedentName.trim(),
      type: data.type,
    });
  });

  return (
    <div className="max-w-2xl space-y-6">
      {/* Success Celebration */}
      {showSuccess && (
        <SuccessCelebration
          message="Case created successfully!"
          submessage="Redirecting to case details..."
          onComplete={() => setShowSuccess(false)}
        />
      )}
      {/* Header */}
      <div>
        <Link
          href="/staff/cases"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Case</h1>
        <p className="text-gray-600 mt-1">Start a new funeral arrangement</p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Decedent Name */}
          <FormInput
            name="decedentName"
            label="Decedent Name"
            placeholder="Enter decedent's full name"
            required
          />

          {/* Case Type */}
          <FormSelect
            name="type"
            label="Case Type"
            options={CASE_TYPES.map((type) => ({
              value: type,
              label: type === "AT_NEED" ? "At-Need" : type === "PRE_NEED" ? "Pre-Need" : "Inquiry",
            }))}
            description={CASE_TYPE_DESCRIPTIONS[caseType]}
            required
          />

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Next Steps:</strong> After creating the case, you'll be able to add:
            </p>
            <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>Decedent details (DOB, DOD, service information)</li>
              <li>Family members and contacts</li>
              <li>Service arrangements</li>
              <li>Contract and payment information</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isOptimistic}
              variant="gradient"
              emphasis="high"
              icon={<Save className="w-5 h-5" />}
              isLoading={isOptimistic}
            >
              {isOptimistic ? "Creating..." : "Create Case"}
            </Button>
            <Link
              href="/staff/cases"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Form>

      {/* Help Text */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Getting Started</h3>
        <p className="text-sm text-gray-600">
          Creating a case is the first step in managing a funeral arrangement. You'll be able to
          add more details, invite family members, create contracts, and process payments after
          the case is created.
        </p>
      </div>
    </div>
  );
}
