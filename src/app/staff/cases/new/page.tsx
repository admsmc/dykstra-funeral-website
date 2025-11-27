"use client";

import { trpc } from "@/lib/trpc-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

/**
 * Case Creation Page
 * Form to create a new funeral case
 */

export default function NewCasePage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  
  const createCase = trpc.case.create.useMutation({
    // Optimistic update: immediately add to cache before server confirms
    onMutate: async (newCase) => {
      // Cancel outgoing refetches
      await utils.case.listAll.cancel();
      
      // Snapshot current value
      const previousCases = utils.case.listAll.getInfiniteData();
      
      // Optimistically update cache
      utils.case.listAll.setInfiniteData(
        { limit: 50 },
        (old) => {
          if (!old) return old;
          
          const optimisticCase = {
            id: `temp-${Date.now()}`, // Temporary ID
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
      
      return { previousCases };
    },
    // On error, roll back to previous value
    onError: (err, newCase, context) => {
      if (context?.previousCases) {
        utils.case.listAll.setInfiniteData({ limit: 50 }, context.previousCases);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      utils.case.listAll.invalidate();
    },
  });

  const [formData, setFormData] = useState({
    decedentName: "",
    type: "AT_NEED" as "AT_NEED" | "PRE_NEED" | "INQUIRY",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};

    if (!formData.decedentName.trim()) {
      newErrors.decedentName = "Decedent name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await createCase.mutateAsync({
        decedentName: formData.decedentName.trim(),
        type: formData.type,
      });

      toast.success("Case created successfully");
      router.push(`/staff/cases/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create case");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
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
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Decedent Name */}
        <div>
          <label htmlFor="decedentName" className="block text-sm font-medium text-gray-900 mb-2">
            Decedent Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="decedentName"
            value={formData.decedentName}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
              setFormData({ ...formData, decedentName: e.target.value });
              setErrors({ ...errors, decedentName: "" });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent ${
              errors.decedentName ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            placeholder="Enter decedent's full name"
          />
          {errors.decedentName && (
            <p className="mt-1 text-sm text-red-600">{errors.decedentName}</p>
          )}
        </div>

        {/* Case Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-900 mb-2">
            Case Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as typeof formData.type })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          >
            <option value="AT_NEED">At-Need</option>
            <option value="PRE_NEED">Pre-Need</option>
            <option value="INQUIRY">Inquiry</option>
          </select>
          <p className="mt-1 text-sm text-gray-600">
            {formData.type === "AT_NEED" && "Family is currently in need of services"}
            {formData.type === "PRE_NEED" && "Pre-planning for future arrangements"}
            {formData.type === "INQUIRY" && "Initial inquiry, not yet committed"}
          </p>
        </div>

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
          <button
            type="submit"
            disabled={createCase.isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {createCase.isLoading ? "Creating..." : "Create Case"}
          </button>
          <Link
            href="/staff/cases"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>

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
