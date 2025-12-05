import { ArrowLeft, Download, Eye, Save, Send } from "lucide-react";
import type { ContractBuilderViewModel } from "../view-models/ContractBuilderViewModel";

// Simplified version - full implementation in original file
export function ReviewGenerateStep({
  viewModel,
  onPrev,
}: {
  viewModel: ContractBuilderViewModel;
  onPrev: () => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Review & Generate Contract</h2>
        <p className="text-gray-600 mt-1">
          Review your selections and generate the final contract.
        </p>
      </div>

      {/* Summary Section */}
      <div className="space-y-6">
        {/* Service Type */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Service Type</h3>
          <p className="text-gray-600">{viewModel.serviceType || 'Not selected'}</p>
        </div>

        {/* Selected Services */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Services ({viewModel.selectedServices.length})</h3>
          {viewModel.selectedServices.length > 0 ? (
            <div className="space-y-2">
              {viewModel.selectedServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {service.name} × {service.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    ${(service.price * service.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No services selected</p>
          )}
        </div>

        {/* Selected Products */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Products ({viewModel.selectedProducts.length})</h3>
          {viewModel.selectedProducts.length > 0 ? (
            <div className="space-y-2">
              {viewModel.selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {product.name} × {product.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    ${(product.price * product.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No products selected</p>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{viewModel.formattedSubtotal}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tax (6%)</span>
              <span className="text-gray-900">{viewModel.formattedTax}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-[--navy]">{viewModel.formattedTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center gap-3">
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
          <Save className="w-4 h-4" />
          Save Draft
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition">
          <Send className="w-4 h-4" />
          Generate Contract
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div></div>
      </div>
    </div>
  );
}
