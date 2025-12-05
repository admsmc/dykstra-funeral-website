"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  Calendar,
  DollarSign,
  Edit,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface ArrangementsTabProps {
  caseId: string;
  arrangement?: {
    id: string;
    serviceType: string;
    completionPercentage: number;
    totalProductCost: number;
    isComplete: boolean;
    ceremonyDetails?: {
      date: Date;
      location: string;
      officiant: string;
    };
    selectedProductCount: number;
  };
}

export default function ArrangementsTab({
  caseId,
  arrangement,
}: ArrangementsTabProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(date));
  };

  // Empty state
  if (!arrangement) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg border border-gray-200 p-12 text-center"
      >
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Service Arrangement Yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Create a personalized service arrangement for this case, including
          service selection, product customization, and ceremony planning.
        </p>
        <button
          onClick={() => router.push(`/staff/arrangements/${caseId}/select`)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition"
        >
          Create Arrangement
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-lg p-4 flex items-center justify-between ${
          arrangement.isComplete
            ? "bg-green-50 border border-green-200"
            : "bg-blue-50 border border-blue-200"
        }`}
      >
        <div className="flex items-center gap-3">
          {arrangement.isComplete ? (
            <>
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">
                  Arrangement Complete
                </p>
                <p className="text-sm text-green-700">
                  Ready for service execution
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">In Progress</p>
                <p className="text-sm text-blue-700">
                  {arrangement.completionPercentage}% complete
                </p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => router.push(`/staff/arrangements/${caseId}`)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
        >
          <Edit className="w-4 h-4" />
          Edit Arrangement
        </button>
      </motion.div>

      {/* Progress Bar */}
      {!arrangement.isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Completion Progress
            </span>
            <span className="text-sm font-semibold text-[--navy]">
              {arrangement.completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${arrangement.completionPercentage}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[--navy] h-2 rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Key Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Service Type */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[--navy]" />
            <h4 className="font-semibold text-gray-900">Service Type</h4>
          </div>
          <p className="text-sm text-gray-700">
            {arrangement.serviceType.replace(/_/g, " ")}
          </p>
        </motion.div>

        {/* Estimated Cost */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[--navy]" />
            <h4 className="font-semibold text-gray-900">Estimated Cost</h4>
          </div>
          <p className="text-lg font-bold text-[--navy]">
            {formatCurrency(arrangement.totalProductCost)}
          </p>
          <p className="text-xs text-gray-600">
            {arrangement.selectedProductCount} products selected
          </p>
        </motion.div>

        {/* Ceremony Date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-[--navy]" />
            <h4 className="font-semibold text-gray-900">Ceremony</h4>
          </div>
          {arrangement.ceremonyDetails?.date ? (
            <>
              <p className="text-sm text-gray-700 mb-1">
                {formatDate(arrangement.ceremonyDetails.date)}
              </p>
              <p className="text-xs text-gray-600">
                {arrangement.ceremonyDetails.location || "Location TBD"}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">Not scheduled yet</p>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-lg border border-gray-200 p-4"
      >
        <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() =>
              router.push(`/staff/arrangements/${caseId}/customize`)
            }
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Customize Products
          </button>
          <button
            onClick={() =>
              router.push(`/staff/arrangements/${caseId}/ceremony`)
            }
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Plan Ceremony
          </button>
          <button
            onClick={() => router.push(`/staff/arrangements/${caseId}`)}
            className="px-4 py-2 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition"
          >
            View Full Details
          </button>
        </div>
      </motion.div>
    </div>
  );
}
