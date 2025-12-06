"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc-client";
import { SuccessCelebration } from "@/components/SuccessCelebration";

const payVendorBillSchema = z.object({
  billId: z.string().min(1, "Bill ID is required"),
  paymentAmount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["check", "ach", "wire", "card"]),
  paymentDate: z.string().min(1, "Payment date required"),
  notes: z.string().optional(),
});

type PayVendorBillForm = z.infer<typeof payVendorBillSchema>;

interface PayVendorBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  billId?: string;
  billAmount?: number;
  vendorName?: string;
}

export function PayVendorBillModal({
  isOpen,
  onClose,
  onSuccess,
  billId,
  billAmount,
  vendorName,
}: PayVendorBillModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PayVendorBillForm>({
    resolver: zodResolver(payVendorBillSchema),
    defaultValues: {
      billId: billId || "",
      paymentAmount: billAmount || 0,
      paymentMethod: "check",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  // TODO: Wire this modal to the real financial.ap.payBill endpoint.
  const onSubmit = (data: PayVendorBillForm) => {
    // For now, simulate a successful payment without calling the backend.
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      reset();
      onClose();
      onSuccess?.();
    }, 2000);
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
                <h2 className="text-2xl font-serif text-[--navy]">Pay Vendor Bill</h2>
                {vendorName && <p className="text-gray-600 mt-1">Paying: {vendorName}</p>}
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl" aria-label="Close">×</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                  <input {...register("paymentAmount", { valueAsNumber: true })} type="number" min="0" step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy]" />
                  {errors.paymentAmount && <p className="text-red-600 text-sm mt-1">{errors.paymentAmount.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                  <input {...register("paymentDate")} type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select {...register("paymentMethod")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy]">
                  <option value="check">Check</option>
                  <option value="ach">ACH Transfer</option>
                  <option value="wire">Wire Transfer</option>
                  <option value="card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea {...register("notes")} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy]"
                  placeholder="Payment notes..." />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isSubmitting}
                  className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                  {isSubmitting ? "Processing..." : "Pay Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSuccess && <SuccessCelebration message="Vendor bill paid successfully!" onComplete={() => setShowSuccess(false)} />}
    </>
  );
}
