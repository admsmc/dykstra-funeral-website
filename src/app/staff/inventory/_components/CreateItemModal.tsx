'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateItemModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateItemModalProps) {
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create mutation
  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => {
      toast.success('Inventory item created successfully');
      handleClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create item');
    },
  });

  const categories = [
    'Caskets',
    'Urns',
    'Vaults',
    'Flowers',
    'Memorial Products',
    'Transportation',
    'Facilities',
    'Other',
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!category) {
      newErrors.category = 'Category is required';
    }
    if (!retailPrice || isNaN(Number(retailPrice)) || Number(retailPrice) < 0) {
      newErrors.retailPrice = 'Valid retail price is required';
    }
    if (!reorderPoint || isNaN(Number(reorderPoint)) || Number(reorderPoint) < 0) {
      newErrors.reorderPoint = 'Valid reorder point is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    createMutation.mutate({
      sku: sku.trim(),
      description: description.trim(),
      category,
      retailPrice: Number(retailPrice),
      reorderPoint: Number(reorderPoint),
    });
  };

  const handleClose = () => {
    setSku('');
    setDescription('');
    setCategory('');
    setRetailPrice('');
    setReorderPoint('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

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
                  <h2 className="text-xl font-semibold text-gray-900">Create Inventory Item</h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Add a new item to inventory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* SKU */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  SKU *
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => {
                    setSku(e.target.value);
                    setErrors(prev => ({ ...prev, sku: '' }));
                  }}
                  disabled={createMutation.isPending}
                  placeholder="e.g., CASKET-OAK-001"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed font-mono ${
                    errors.sku ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.sku && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.sku}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors(prev => ({ ...prev, description: '' }));
                  }}
                  disabled={createMutation.isPending}
                  placeholder="e.g., Oak Casket - Traditional"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setErrors(prev => ({ ...prev, category: '' }));
                  }}
                  disabled={createMutation.isPending}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Retail Price & Reorder Point */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Retail Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={retailPrice}
                      onChange={(e) => {
                        setRetailPrice(e.target.value);
                        setErrors(prev => ({ ...prev, retailPrice: '' }));
                      }}
                      disabled={createMutation.isPending}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed ${
                        errors.retailPrice ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.retailPrice && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.retailPrice}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Reorder Point *
                  </label>
                  <input
                    type="number"
                    value={reorderPoint}
                    onChange={(e) => {
                      setReorderPoint(e.target.value);
                      setErrors(prev => ({ ...prev, reorderPoint: '' }));
                    }}
                    disabled={createMutation.isPending}
                    min="0"
                    step="1"
                    placeholder="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed ${
                      errors.reorderPoint ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.reorderPoint && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.reorderPoint}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Alert when stock falls to this level
                  </p>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      Initial Setup
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• New items start with zero quantity at all locations</li>
                      <li>• Use "Transfer" or "Adjust" to add initial stock</li>
                      <li>• Reorder point triggers low stock alerts</li>
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
                disabled={createMutation.isPending}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Item'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
