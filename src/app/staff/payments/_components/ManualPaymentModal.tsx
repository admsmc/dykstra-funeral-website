"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { X, DollarSign, Calendar, FileText } from "lucide-react";
import { z } from "zod";

/**
 * Manual Payment Modal
 * Record cash, check, or ACH payments made outside of Stripe
 * 
 * Features:
 * - Case selection with typeahead search
 * - Payment method dropdown (cash/check/ACH)
 * - Amount input with currency formatting
 * - Check number field (conditional on method)
 * - Payment date picker (defaults to today)
 * - Notes textarea
 * - Form validation with Zod
 */

// Validation schema
const manualPaymentSchema = z.object({
  caseId: z.string().min(1, "Please select a case"),
  amount: z.number().positive("Amount must be greater than zero"),
  method: z.enum(["cash", "check", "ach"], {
    errorMap: () => ({ message: "Please select a payment method" }),
  }),
  checkNumber: z.string().optional(),
  paymentDate: z.date(),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional(),
});

type ManualPaymentForm = z.infer<typeof manualPaymentSchema>;

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ManualPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: ManualPaymentModalProps) {
  const [formData, setFormData] = useState<ManualPaymentForm>({
    caseId: "",
    amount: 0,
    method: "cash",
    checkNumber: "",
    paymentDate: new Date(),
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ManualPaymentForm, string>>>({});
  const [caseSearchQuery, setCaseSearchQuery] = useState("");

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

  // Record manual payment mutation
  const recordPaymentMutation = trpc.payment.recordManual.useMutation({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      setErrors({ caseId: error.message });
    },
  });

  // Reset form on close
  const handleClose = () => {
    setFormData({
      caseId: "",
      amount: 0,
      method: "cash",
      checkNumber: "",
      paymentDate: new Date(),
      notes: "",
    });
    setErrors({});
    setCaseSearchQuery("");
    onClose();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = manualPaymentSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ManualPaymentForm, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ManualPaymentForm] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Submit payment
    recordPaymentMutation.mutate({
      caseId: formData.caseId,
      amount: formData.amount,
      method: formData.method,
      checkNumber: formData.method === "check" ? formData.checkNumber : undefined,
      paymentDate: formData.paymentDate,
      notes: formData.notes,
    });
  };

  // Filter cases based on search query
  const filteredCases = casesData?.pages[0]?.items.filter((c) =>
    c.decedentName.toLowerCase().includes(caseSearchQuery.toLowerCase())
  ) ?? [];

  if (!isOpen) return null;

  return (
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Case Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Search by decedent name..."
              value={caseSearchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCaseSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent mb-2"
            />
            <select
              value={formData.caseId}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, caseId: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent ${
                errors.caseId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select a case...</option>
              {filteredCases.map((c) => (
                <option key={c.businessKey} value={c.businessKey}>
                  {c.decedentName} - {c.status}
                </option>
              ))}
            </select>
            {errors.caseId && (
              <p className="text-red-600 text-sm mt-1">{errors.caseId}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.method}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value as any })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent ${
                errors.method ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="ach">ACH / Bank Transfer</option>
            </select>
            {errors.method && (
              <p className="text-red-600 text-sm mt-1">{errors.method}</p>
            )}
          </div>

          {/* Check Number (conditional) */}
          {formData.method === "check" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check Number
              </label>
              <input
                type="text"
                placeholder="e.g., 1234"
                value={formData.checkNumber}
                onChange={(e) =>
                  setFormData({ ...formData, checkNumber: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
              />
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.paymentDate.toISOString().split("T")[0]}
                onChange={(e) =>
                  setFormData({ ...formData, paymentDate: new Date(e.target.value) })
                }
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <textarea
                placeholder="Additional notes about this payment..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
              />
            </div>
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
              disabled={recordPaymentMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
              className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
