'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface AdjustInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  item?: {
    id: string;
    description: string;
    sku: string;
    locations: {
      locationId: string;
      locationName: string;
      quantityOnHand: number;
    }[];
  };
}

export function AdjustInventoryModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: AdjustInventoryModalProps) {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Adjust mutation
  const adjustMutation = trpc.inventory.adjust.useMutation({
    onSuccess: () => {
      toast.success('Inventory adjusted successfully');
      handleClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to adjust inventory');
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedLocation) {
      newErrors.location = 'Location is required';
    }
    if (newQuantity === '' || isNaN(Number(newQuantity))) {
      newErrors.quantity = 'Valid quantity is required';
    } else if (Number(newQuantity) < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }
    if (!reason) {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !item) {
      toast.error('Please fix the form errors');
      return;
    }

    adjustMutation.mutate({
      itemId: item.id,
      locationId: selectedLocation,
      newQuantity: Number(newQuantity),
      reason,
      notes: notes || undefined,
    });
  };

  const handleClose = () => {
    setSelectedLocation('');
    setNewQuantity('');
    setReason('');
    setNotes('');
    setErrors({});
    onClose();
  };

  if (!isOpen || !item) return null;

  const selectedLoc = item.locations.find(l => l.locationId === selectedLocation);
  const currentQuantity = selectedLoc?.quantityOnHand ?? 0;
  const difference = Number(newQuantity) - currentQuantity;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Adjust Inventory</h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Cycle count for {item.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={adjustMutation.isPending}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Item Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="text-sm text-gray-600 font-mono">{item.sku}</p>
                  </div>
                </div>
              </div>

              {/* Location Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <select
                  value={selectedLocation}
                onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setErrors(prev => ({ ...prev, location: '' }));
                  }}
                  disabled={adjustMutation.isPending}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select location...</option>
                  {item.locations.map((loc) => (
                    <option key={loc.locationId} value={loc.locationId}>
                      {loc.locationName} (Current: {loc.quantityOnHand} units)
                    </option>
                  ))}
                </select>
                {errors.location && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Current vs New Quantity */}
              {selectedLocation && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Current Quantity</p>
                    <p className="text-3xl font-bold text-gray-900">{currentQuantity}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      New Quantity *
                    </label>
                    <input
                      type="number"
                      value={newQuantity}
                      onChange={(e) => {
                        setNewQuantity(e.target.value);
                        setErrors(prev => ({ ...prev, quantity: '' }));
                      }}
                      disabled={adjustMutation.isPending}
                      min="0"
                      step="1"
                      placeholder="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed ${
                        errors.quantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.quantity}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Difference Indicator */}
              {selectedLocation && newQuantity && !errors.quantity && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg p-4 ${
                    difference > 0
                      ? 'bg-green-50 border border-green-200'
                      : difference < 0
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {difference > 0 && '+ '}
                      {difference < 0 && ''}
                      {difference === 0 && 'No '}
                      Change
                    </p>
                    <p className={`text-2xl font-bold ${
                      difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {difference > 0 ? '+' : ''}{difference}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setErrors(prev => ({ ...prev, reason: '' }));
                  }}
                  disabled={adjustMutation.isPending}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.reason ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select reason...</option>
                  <option value="Cycle Count">Cycle Count</option>
                  <option value="Physical Inventory">Physical Inventory</option>
                  <option value="Damage">Damage</option>
                  <option value="Loss">Loss</option>
                  <option value="Found">Found</option>
                  <option value="Correction">Correction</option>
                  <option value="Other">Other</option>
                </select>
                {errors.reason && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.reason}
                  </p>
                )}
              </div>

              {/* Notes (Optional) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={adjustMutation.isPending}
                  rows={3}
                  placeholder="Add any additional context for this adjustment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                />
              </div>

              {/* Warning Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-900">
                      Important Notes
                    </p>
                    <ul className="text-xs text-amber-800 space-y-1">
                      <li>• This will immediately update the inventory quantity</li>
                      <li>• All changes are logged for audit purposes</li>
                      <li>• Ensure accurate count before submitting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleClose}
                disabled={adjustMutation.isPending}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjustMutation.isPending || !selectedLocation || !newQuantity || !reason}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center gap-2"
              >
                {adjustMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adjusting...
                  </>
                ) : (
                  'Adjust Inventory'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
