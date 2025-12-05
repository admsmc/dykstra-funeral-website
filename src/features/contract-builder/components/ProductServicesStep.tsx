import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ContractBuilderState } from "../types";

// Simplified version - full implementation in original file
export function ProductServicesStep({
  state,
  onAddService,
  onAddProduct,
  onUpdateQuantity,
  onNext,
  onPrev,
}: {
  state: ContractBuilderState;
  onAddService: (service: any) => void;
  onAddProduct: (product: any) => void;
  onUpdateQuantity: (id: string, type: 'service' | 'product', delta: number) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Select Products & Services</h2>
        <p className="text-gray-600 mt-1">
          Add additional products and services to customize the contract.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeTab === 'services'
              ? 'border-[--navy] text-[--navy]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Services
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeTab === 'products'
              ? 'border-[--navy] text-[--navy]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Products
        </button>
      </div>

      {/* Content Area - Placeholder */}
      <div className="min-h-[400px] flex items-center justify-center text-gray-500">
        <p>Select {activeTab === 'services' ? 'services' : 'products'} to add to contract</p>
      </div>

      {/* Shopping Cart Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Selected: {state.selectedServices.length + state.selectedProducts.length} items
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={state.selectedServices.length === 0 && state.selectedProducts.length === 0}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
