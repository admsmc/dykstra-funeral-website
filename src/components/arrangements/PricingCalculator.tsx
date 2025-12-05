"use client";

import { motion } from "framer-motion";
import { DollarSign, Download, AlertCircle } from "lucide-react";

interface PricingItem {
  id: string;
  name: string;
  price: number;
  category: "service" | "product";
}

interface PricingCalculatorProps {
  items: PricingItem[];
  budgetMax?: number;
  onExportPDF?: () => void;
}

export default function PricingCalculator({
  items,
  budgetMax,
  onExportPDF,
}: PricingCalculatorProps) {
  // Calculate totals
  const servicesTotal = items
    .filter((item) => item.category === "service")
    .reduce((sum, item) => sum + item.price, 0);

  const productsTotal = items
    .filter((item) => item.category === "product")
    .reduce((sum, item) => sum + item.price, 0);

  const subtotal = servicesTotal + productsTotal;
  const tax = 0; // Optional: subtotal * 0.07 for 7% tax
  const total = subtotal + tax;

  // Budget status
  const isOverBudget = budgetMax ? total > budgetMax : false;
  const budgetPercentage = budgetMax ? (total / budgetMax) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="sticky top-4 bg-white border-2 border-gray-200 rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[--navy]" />
            <h3 className="font-semibold text-gray-900">Pricing Summary</h3>
          </div>
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="p-2 text-gray-600 hover:text-[--navy] hover:bg-gray-100 rounded transition"
              title="Export to PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p className="text-sm">No items selected yet</p>
            <p className="text-xs mt-1">Add services and products to see pricing</p>
          </div>
        ) : (
          <>
            {/* Services */}
            {items.filter((item) => item.category === "service").length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Services
                </h4>
                <div className="space-y-2">
                  {items
                    .filter((item) => item.category === "service")
                    .map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start justify-between text-sm"
                      >
                        <span className="text-gray-700 flex-1">{item.name}</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.price)}
                        </span>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}

            {/* Products */}
            {items.filter((item) => item.category === "product").length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Products
                </h4>
                <div className="space-y-2">
                  {items
                    .filter((item) => item.category === "product")
                    .map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start justify-between text-sm"
                      >
                        <span className="text-gray-700 flex-1">{item.name}</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.price)}
                        </span>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Services Subtotal</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(servicesTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Products Subtotal</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(productsTotal)}
            </span>
          </div>
          {tax > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(tax)}
              </span>
            </div>
          )}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">
              Estimated Total
            </span>
            <motion.span
              key={total}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-[--navy]"
            >
              {formatCurrency(total)}
            </motion.span>
          </div>
        </div>
      )}

      {/* Budget Guidance */}
      {budgetMax && items.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Budget</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(budgetMax)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                transition={{ duration: 0.5 }}
                className={`h-2 rounded-full transition-colors ${
                  isOverBudget ? "bg-red-500" : "bg-green-500"
                }`}
              />
            </div>

            {/* Budget Status */}
            {isOverBudget ? (
              <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-900">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Over Budget</p>
                  <p>
                    Current total exceeds budget by{" "}
                    {formatCurrency(total - budgetMax)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-green-700">
                {formatCurrency(budgetMax - total)} remaining
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
