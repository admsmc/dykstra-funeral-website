"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferInventorySchema } from "@dykstra/domain";
import type { z } from "zod";
import { trpc } from "@/lib/trpc-client";
import { SuccessCelebration } from "@/components/SuccessCelebration";

type TransferInventoryForm = z.infer<typeof transferInventorySchema>;

interface TransferInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  itemId?: string;
  itemName?: string;
}

export function TransferInventoryModal({
  isOpen,
  onClose,
  onSuccess,
  itemId,
  itemName,
}: TransferInventoryModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<TransferInventoryForm>({
    resolver: zodResolver(transferInventorySchema),
    defaultValues: {
      itemId: itemId || "",
      requestedBy: "current-user", // Replace with actual user ID from context
    },
  });

  const fromLocationId = watch("fromLocationId");

  const transferInventory = trpc.inventory.transfer.useMutation({
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

  const { data: locations = [] } = trpc.inventory.listLocations.useQuery();
  const { data: items = [] } = trpc.inventory.listItems.useQuery({});

  const onSubmit = (data: TransferInventoryForm) => {
    transferInventory.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-serif text-[--navy]">Transfer Inventory</h2>
                <p className="text-gray-600 mt-1">Move items between locations</p>
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
              {/* Item Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item *
                </label>
                {itemName ? (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {itemName}
                  </div>
                ) : (
                  <select
                    {...register("itemId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  >
                    <option value="">Select an item...</option>
                    {items.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.sku})
                      </option>
                    ))}
                  </select>
                )}
                {errors.itemId && (
                  <p className="text-red-600 text-sm mt-1">{errors.itemId.message}</p>
                )}
              </div>

              {/* From/To Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Location *
                  </label>
                  <select
                    {...register("fromLocationId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  >
                    <option value="">Select source...</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  {errors.fromLocationId && (
                    <p className="text-red-600 text-sm mt-1">{errors.fromLocationId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Location *
                  </label>
                  <select
                    {...register("toLocationId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  >
                    <option value="">Select destination...</option>
                    {locations
                      .filter((loc: any) => loc.id !== fromLocationId)
                      .map((loc: any) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </select>
                  {errors.toLocationId && (
                    <p className="text-red-600 text-sm mt-1">{errors.toLocationId.message}</p>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  {...register("quantity", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                  placeholder="0"
                />
                {errors.quantity && (
                  <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Transfer *
                </label>
                <select
                  {...register("reason")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                >
                  <option value="">Select reason...</option>
                  <option value="Restock">Restock</option>
                  <option value="Service Request">Service Request</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Balancing Stock">Balancing Stock</option>
                  <option value="Return">Return</option>
                  <option value="Other">Other</option>
                </select>
                {errors.reason && (
                  <p className="text-red-600 text-sm mt-1">{errors.reason.message}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The transfer will update inventory levels at both
                  locations immediately. Ensure sufficient stock is available at the source
                  location before proceeding.
                </p>
              </div>

              {/* Error Display */}
              {transferInventory.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    {transferInventory.error.message || "Failed to transfer inventory. Please try again."}
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
                  {isSubmitting ? "Transferring..." : "Transfer Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSuccess && (
        <SuccessCelebration
          message="Inventory transferred successfully!"
          onComplete={() => setShowSuccess(false)}
        />
      )}
    </>
  );
}
