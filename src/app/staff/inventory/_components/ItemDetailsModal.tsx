'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    sku: string;
    description: string;
    category: string;
    retailPrice: number;
    reorderPoint: number;
    locations: {
      locationId: string;
      locationName: string;
      quantityOnHand: number;
      quantityReserved: number;
      quantityAvailable: number;
    }[];
  } | null;
}

export function ItemDetailsModal({
  isOpen,
  onClose,
  item,
}: ItemDetailsModalProps) {
  if (!isOpen || !item) return null;

  const totalOnHand = item.locations.reduce((sum, loc) => sum + loc.quantityOnHand, 0);
  const totalReserved = item.locations.reduce((sum, loc) => sum + loc.quantityReserved, 0);
  const totalAvailable = item.locations.reduce((sum, loc) => sum + loc.quantityAvailable, 0);
  const isLowStock = totalAvailable <= item.reorderPoint;
  const inventoryValue = totalOnHand * item.retailPrice * 0.62; // Assume 62% cost ratio

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold text-gray-900">{item.description}</h2>
                  {isLowStock && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Low Stock
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-mono text-gray-900">{item.sku}</span>
                  <span className="inline-flex px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                    {item.category}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <p className="text-sm font-medium text-indigo-900">On Hand</p>
                </div>
                <p className="text-3xl font-bold text-indigo-600">{totalOnHand}</p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-900">Reserved</p>
                </div>
                <p className="text-3xl font-bold text-amber-600">{totalReserved}</p>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-green-900">Available</p>
                </div>
                <p className="text-3xl font-bold text-green-600">{totalAvailable}</p>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-900">Value</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  ${(inventoryValue / 1000).toFixed(1)}K
                </p>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Retail Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${item.retailPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reorder Point</p>
                  <p className="text-2xl font-bold text-gray-900">{item.reorderPoint} units</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Alert triggered when available stock reaches this level
                  </p>
                </div>
              </div>
            </div>

            {/* Location Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Breakdown</h3>
              <div className="space-y-3">
                {item.locations.map((location) => (
                  <motion.div
                    key={location.locationId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <MapPin className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{location.locationName}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>{location.quantityOnHand} on hand</span>
                            {location.quantityReserved > 0 && (
                              <span className="text-amber-600">
                                {location.quantityReserved} reserved
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">{location.quantityAvailable}</p>
                        <p className="text-xs text-gray-500">available</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Stock Level</span>
                        <span>{Math.round((location.quantityAvailable / Math.max(location.quantityOnHand, 1)) * 100)}% available</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${(location.quantityAvailable / Math.max(location.quantityOnHand, 1)) * 100}%` 
                          }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className={`h-full ${
                            location.quantityAvailable > item.reorderPoint
                              ? 'bg-green-500'
                              : location.quantityAvailable > 0
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stock Status Alert */}
            {isLowStock && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-4"
              >
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Low Stock Alert
                    </p>
                    <p className="text-sm text-amber-800">
                      Current available stock ({totalAvailable} units) is at or below the reorder point ({item.reorderPoint} units). 
                      Consider restocking this item soon.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
