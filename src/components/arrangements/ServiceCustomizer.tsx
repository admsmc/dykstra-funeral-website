"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Search, ChevronDown } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  required: boolean;
  category: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
}

interface ServiceCustomizerProps {
  availableServices: Service[];
  availableProducts: Product[];
  selectedServiceIds: string[];
  selectedProductIds: string[];
  onToggleService: (serviceId: string) => void;
  onToggleProduct: (productId: string) => void;
}

export default function ServiceCustomizer({
  availableServices,
  availableProducts,
  selectedServiceIds,
  selectedProductIds,
  onToggleService,
  onToggleProduct,
}: ServiceCustomizerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("services");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Filter services by search
  const filteredServices = availableServices.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter products by search
  const filteredProducts = availableProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group products by type
  const productsByType = filteredProducts.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = [];
    }
    acc[product.type].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Customize Arrangement
        </h2>
        <p className="text-sm text-gray-600">
          Add or remove services and products to create a personalized arrangement
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search services and products..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
        />
      </div>

      {/* Services Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleCategory("services")}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Services</h3>
            <span className="px-2 py-0.5 bg-[--navy] text-white text-xs font-semibold rounded-full">
              {selectedServiceIds.length}/{filteredServices.length}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform ${
              expandedCategory === "services" ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {expandedCategory === "services" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {filteredServices.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No services found
                  </p>
                ) : (
                  filteredServices.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    const isRequired = service.required;

                    return (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg border transition ${
                          isSelected
                            ? "border-[--navy] bg-[--cream]"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                {service.name}
                              </h4>
                              {isRequired && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {service.description}
                            </p>
                            <p className="text-sm font-semibold text-[--navy]">
                              {formatCurrency(service.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => onToggleService(service.id)}
                            disabled={isRequired}
                            className={`p-2 rounded-lg transition ${
                              isRequired
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : isSelected
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-[--navy] text-white hover:bg-opacity-90"
                            }`}
                          >
                            {isSelected ? (
                              <Minus className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Products Sections */}
      {Object.entries(productsByType).map(([type, products]) => (
        <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleCategory(type)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 capitalize">{type}s</h3>
              <span className="px-2 py-0.5 bg-[--sage] text-white text-xs font-semibold rounded-full">
                {
                  products.filter((p) => selectedProductIds.includes(p.id))
                    .length
                }
                /{products.length}
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform ${
                expandedCategory === type ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {expandedCategory === type && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {products.map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg border transition ${
                          isSelected
                            ? "border-[--sage] bg-green-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {product.name}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                              {product.description}
                            </p>
                            <p className="text-sm font-semibold text-[--sage]">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => onToggleProduct(product.id)}
                            className={`p-2 rounded-lg transition ${
                              isSelected
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-[--sage] text-white hover:bg-opacity-90"
                            }`}
                          >
                            {isSelected ? (
                              <Minus className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Empty State */}
      {filteredServices.length === 0 && Object.keys(productsByType).length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <p className="text-sm font-medium mb-1">No results found</p>
          <p className="text-xs">Try different search terms</p>
        </div>
      )}
    </div>
  );
}
