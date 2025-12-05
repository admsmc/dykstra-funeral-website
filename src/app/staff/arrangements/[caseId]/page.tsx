"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Circle,
  Edit,
  Save,
  ArrowRight,
  Package,
  Calendar,
  FileCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";

interface PageProps {
  params: Promise<{ caseId: string }>;
}

const steps = [
  { id: "type", label: "Service Type", icon: Package },
  { id: "customize", label: "Customize", icon: Edit },
  { id: "ceremony", label: "Ceremony", icon: Calendar },
  { id: "review", label: "Review", icon: FileCheck },
];

export default function ArrangementOverviewPage({ params }: PageProps) {
  const { caseId } = use(params);
  const router = useRouter();

  // Fetch arrangement data
  const { data: arrangement, isLoading } = trpc.arrangements.get.useQuery({
    caseId,
  });

  const completionPercentage = arrangement?.completionPercentage ?? 0;
  const currentStep = completionPercentage < 25 ? 0 : completionPercentage < 50 ? 1 : completionPercentage < 75 ? 2 : 3;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[--navy]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[--navy] mb-2">
            Service Arrangements
          </h1>
          <p className="text-gray-600">
            Create and manage service arrangement for Case #{caseId}
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
            <span className="text-sm font-medium text-[--navy]">
              {completionPercentage}% Complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-[--navy] h-2 rounded-full"
            />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-4 gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-[--navy] text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium text-center ${
                      isComplete || isCurrent ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Current Arrangement Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Current Arrangement
            </h2>
            {arrangement?.serviceType && (
              <button
                onClick={() => router.push(`/staff/arrangements/${caseId}/customize`)}
                className="flex items-center gap-2 text-sm font-medium text-[--navy] hover:underline"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {!arrangement?.serviceType ? (
            <div className="py-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No service type selected yet</p>
              <button
                onClick={() => router.push(`/staff/arrangements/${caseId}/select`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Service Type */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Service Type
                </h3>
                <p className="text-base font-semibold text-gray-900">
                  {arrangement.serviceType.replace(/_/g, " ")}
                </p>
              </div>

              {/* Products */}
              {arrangement.products && arrangement.products.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Selected Products ({arrangement.selectedProductCount})
                  </h3>
                  <div className="space-y-1">
                    {arrangement.products
                      .filter((p: any) => p.selected)
                      .slice(0, 3)
                      .map((product: any) => (
                        <p key={product.id} className="text-sm text-gray-700">
                          • {product.name} - {formatCurrency(product.price)}
                        </p>
                      ))}
                    {arrangement.selectedProductCount > 3 && (
                      <p className="text-sm text-gray-500 italic">
                        +{arrangement.selectedProductCount - 3} more products
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Total Cost */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">
                    Estimated Total
                  </span>
                  <span className="text-xl font-bold text-[--navy]">
                    {formatCurrency(arrangement.totalProductCost || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {!arrangement?.isComplete && arrangement?.serviceType && (
            <button
              onClick={() => {
                const nextRoute =
                  currentStep === 0
                    ? "select"
                    : currentStep === 1
                    ? "customize"
                    : "ceremony";
                router.push(`/staff/arrangements/${caseId}/${nextRoute}`);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {arrangement?.isComplete && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Arrangement Complete</span>
            </div>
          )}

          <button
            onClick={() => router.push(`/staff/cases/${caseId}`)}
            className="px-6 py-3 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Back to Case
          </button>
        </div>
      </div>
    </div>
  );
}
