"use client";

import { motion } from "framer-motion";
import { CheckCircle, DollarSign, Package, Sparkles } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

interface Product {
  id: string;
  name: string;
  category?: string; // Optional to support both 'type' and 'category'
  type?: string;     // Optional for backward compatibility
  price: number;
}

interface Arrangement {
  name: string;
  description: string;
  requiredServices: readonly Service[];
  recommendedServices: readonly Service[];
  suggestedProducts: {
    caskets?: readonly Product[];
    urns?: readonly Product[];
    flowers?: readonly Product[];
    memorialCards?: readonly Product[];
    other?: readonly Product[];
  };
  costEstimate: {
    requiredServicesTotal: number;
    recommendedServicesTotal: number;
    suggestedProductsTotal: number;
    estimatedTotal: number;
  };
}

interface ServiceRecommendationsCardProps {
  arrangement: Arrangement;
  isPrimary?: boolean;
  onCustomize: () => void;
  onAccept: () => void;
}

export default function ServiceRecommendationsCard({
  arrangement,
  isPrimary = false,
  onCustomize,
  onAccept,
}: ServiceRecommendationsCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const allProducts = [
    ...(arrangement.suggestedProducts.caskets || []),
    ...(arrangement.suggestedProducts.urns || []),
    ...(arrangement.suggestedProducts.flowers || []),
    ...(arrangement.suggestedProducts.other || []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-lg border-2 overflow-hidden ${
        isPrimary
          ? "border-[--navy] bg-[--cream]"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-3 py-1 bg-[--navy] text-white text-xs font-semibold rounded-full">
            <Sparkles className="w-3 h-3" />
            Recommended
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-2xl font-semibold text-[--navy] mb-2">
          {arrangement.name}
        </h3>
        <p className="text-sm text-gray-600">{arrangement.description}</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Required Services */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Required Services</h4>
          </div>
          <div className="space-y-2">
            {arrangement.requiredServices.map((service) => (
              <div
                key={service.id}
                className="flex items-start justify-between text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-600">{service.description}</p>
                </div>
                <span className="font-medium text-gray-700 ml-4">
                  {formatCurrency(service.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Services */}
        {arrangement.recommendedServices.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">
                Recommended Services
              </h4>
            </div>
            <div className="space-y-2">
              {arrangement.recommendedServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-start justify-between text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-600">
                      {service.description}
                    </p>
                  </div>
                  <span className="font-medium text-gray-700 ml-4">
                    {formatCurrency(service.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Products */}
        {allProducts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Suggested Products</h4>
            </div>
            <div className="space-y-2">
              {allProducts.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="flex items-start justify-between text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-600 capitalize">
                      {(product.category || product.type || '').toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  <span className="font-medium text-gray-700 ml-4">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              ))}
              {allProducts.length > 3 && (
                <p className="text-xs text-gray-500 italic">
                  +{allProducts.length - 3} more products available
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        <div className="pt-4 border-t border-gray-200">
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Required Services</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(arrangement.costEstimate.requiredServicesTotal)}
              </span>
            </div>
            {arrangement.costEstimate.recommendedServicesTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Recommended Services</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(
                    arrangement.costEstimate.recommendedServicesTotal
                  )}
                </span>
              </div>
            )}
            {arrangement.costEstimate.suggestedProductsTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Suggested Products</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(
                    arrangement.costEstimate.suggestedProductsTotal
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[--navy]" />
              <span className="text-base font-semibold text-gray-900">
                Estimated Total
              </span>
            </div>
            <span className="text-2xl font-bold text-[--navy]">
              {formatCurrency(arrangement.costEstimate.estimatedTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center gap-3">
        <button
          onClick={onCustomize}
          className="flex-1 px-4 py-3 bg-white text-[--navy] font-medium border-2 border-[--navy] rounded-lg hover:bg-[--cream] transition"
        >
          Customize
        </button>
        <button
          onClick={onAccept}
          className="flex-1 px-4 py-3 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition"
        >
          Accept Arrangement
        </button>
      </div>
    </motion.div>
  );
}
