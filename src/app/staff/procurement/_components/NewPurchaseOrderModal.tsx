"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc-client";
import { SuccessCelebration } from "@/components/SuccessCelebration";
import { Plus, Trash2 } from "lucide-react";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Price must be positive"),
  glAccountId: z.string().min(1, "GL Account required"),
});

const newPOSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  deliveryDate: z.string().min(1, "Delivery date required"),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
  notes: z.string().optional(),
});

type NewPOForm = z.infer<typeof newPOSchema>;

interface NewPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewPurchaseOrderModal({
  isOpen,
  onClose,
  onSuccess,
}: NewPurchaseOrderModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<NewPOForm>({
    resolver: zodResolver(newPOSchema),
    defaultValues: {
      lineItems: [{ description: "", quantity: 1, unitPrice: 0, glAccountId: "5000" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const createPO = trpc.procurement.purchaseOrders.create.useMutation({
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

  const { data: vendors = [] } = trpc.procurement.vendors.list.useQuery({ status: 'active' });

  const lineItems = watch("lineItems");
  const totalAmount = lineItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  const onSubmit = (data: NewPOForm) => {
    createPO.mutate({
      vendorId: data.vendorId,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(data.deliveryDate),
      lineItems: data.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        glAccountId: item.glAccountId,
      })),
      notes: data.notes,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-serif text-[--navy]">New Purchase Order</h2>
                <p className="text-gray-600 mt-1">Create a new PO for vendor supplies</p>
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
              {/* Vendor & Delivery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor *
                  </label>
                  <select
                    {...register("vendorId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map((vendor: any) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  {errors.vendorId && (
                    <p className="text-red-600 text-sm mt-1">{errors.vendorId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Date *
                  </label>
                  <input
                    {...register("deliveryDate")}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  />
                  {errors.deliveryDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.deliveryDate.message}</p>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-[--navy]">Line Items</h3>
                  <button
                    type="button"
                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0, glAccountId: "5000" })}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                          </label>
                          <input
                            {...register(`lineItems.${index}.description`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                            placeholder="Item description"
                          />
                          {errors.lineItems?.[index]?.description && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors.lineItems[index]?.description?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                            type="number"
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                          />
                          {errors.lineItems?.[index]?.quantity && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors.lineItems[index]?.quantity?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Price *
                          </label>
                          <input
                            {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                          />
                          {errors.lineItems?.[index]?.unitPrice && (
                            <p className="text-red-600 text-sm mt-1">
                              {errors.lineItems[index]?.unitPrice?.message}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GL Account *
                          </label>
                          <select
                            {...register(`lineItems.${index}.glAccountId`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                          >
                            <option value="5000">5000 - Cost of Goods Sold</option>
                            <option value="5100">5100 - Operating Expenses</option>
                            <option value="1500">1500 - Inventory</option>
                          </select>
                        </div>

                        {lineItems[index]?.quantity > 0 && lineItems[index]?.unitPrice > 0 && (
                          <div className="md:col-span-2 text-right">
                            <span className="text-sm text-gray-600">Subtotal: </span>
                            <span className="text-lg font-bold text-gray-900">
                              ${(lineItems[index].quantity * lineItems[index].unitPrice).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {errors.lineItems && (
                  <p className="text-red-600 text-sm">{errors.lineItems.message}</p>
                )}
              </div>

              {/* Total */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-blue-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-900">
                    ${totalAmount.toFixed(2)}
                  </span>
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
                  placeholder="Additional notes or special instructions..."
                />
              </div>

              {/* Error Display */}
              {createPO.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    {createPO.error.message || "Failed to create purchase order. Please try again."}
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
                  {isSubmitting ? "Creating PO..." : "Create Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSuccess && (
        <SuccessCelebration
          message="Purchase order created successfully!"
          onComplete={() => setShowSuccess(false)}
        />
      )}
    </>
  );
}
