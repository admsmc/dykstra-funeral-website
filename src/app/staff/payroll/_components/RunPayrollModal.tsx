"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc-client";
import { SuccessCelebration } from "@/components/SuccessCelebration";

const runPayrollSchema = z.object({
  periodStart: z.string().min(1, "Period start required"),
  periodEnd: z.string().min(1, "Period end required"),
  payDate: z.string().min(1, "Pay date required"),
  notes: z.string().optional(),
}).refine((data) => new Date(data.periodEnd) >= new Date(data.periodStart), {
  message: "Period end must be after start",
  path: ["periodEnd"],
}).refine((data) => new Date(data.payDate) >= new Date(data.periodEnd), {
  message: "Pay date must be after period end",
  path: ["payDate"],
});

type RunPayrollForm = z.infer<typeof runPayrollSchema>;

interface RunPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RunPayrollModal({ isOpen, onClose, onSuccess }: RunPayrollModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<RunPayrollForm>({
    resolver: zodResolver(runPayrollSchema),
    defaultValues: {
      periodStart: "",
      periodEnd: "",
      payDate: "",
    },
  });

  const runPayroll = trpc.payroll.runPayroll.useMutation({
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

  const onSubmit = (data: RunPayrollForm) => {
    runPayroll.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-serif text-[--navy]">Run Payroll</h2>
                <p className="text-gray-600 mt-1">Process biweekly payroll</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl" aria-label="Close">×</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800"><strong>Important:</strong> Ensure all timesheets are approved before running payroll.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period Start *</label>
                  <input {...register("periodStart")} type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy]" />
                  {errors.periodStart && <p className="text-red-600 text-sm mt-1">{errors.periodStart.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period End *</label>
                  <input {...register("periodEnd")} type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy]" />
                  {errors.periodEnd && <p className="text-red-600 text-sm mt-1">{errors.periodEnd.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date *</label>
                <input {...register("payDate")} type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy]" />
                {errors.payDate && <p className="text-red-600 text-sm mt-1">{errors.payDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea {...register("notes")} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy]"
                  placeholder="Payroll notes..." />
              </div>

              {runPayroll.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{runPayroll.error.message || "Payroll run failed."}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                  className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                  {isSubmitting ? "Processing..." : "Run Payroll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSuccess && <SuccessCelebration message="Payroll processed successfully!" onComplete={() => setShowSuccess(false)} />}
    </>
  );
}
