"use client";

import { motion } from "framer-motion";
import { Church, Flame, Heart, Flower2, TreePine, CheckCircle2 } from "lucide-react";

export type ServiceType =
  | "TRADITIONAL_BURIAL"
  | "CREMATION_WITH_MEMORIAL"
  | "DIRECT_CREMATION"
  | "MEMORIAL_SERVICE"
  | "GRAVESIDE_SERVICE"
  | "DIRECT_BURIAL";

interface ServiceTypeOption {
  value: ServiceType;
  label: string;
  description: string;
  priceRange: string;
  icon: React.ComponentType<{ className?: string }>;
}

const serviceTypes: ServiceTypeOption[] = [
  {
    value: "TRADITIONAL_BURIAL",
    label: "Traditional Burial Service",
    description: "Full service with viewing, ceremony, and burial",
    priceRange: "$7,000 - $12,000",
    icon: Church,
  },
  {
    value: "CREMATION_WITH_MEMORIAL",
    label: "Cremation with Memorial Service",
    description: "Cremation followed by memorial ceremony",
    priceRange: "$4,000 - $8,000",
    icon: Flame,
  },
  {
    value: "DIRECT_CREMATION",
    label: "Direct Cremation",
    description: "Simple cremation without ceremony",
    priceRange: "$1,500 - $3,000",
    icon: Heart,
  },
  {
    value: "MEMORIAL_SERVICE",
    label: "Memorial Service",
    description: "Ceremony without body present",
    priceRange: "$2,000 - $5,000",
    icon: Flower2,
  },
  {
    value: "GRAVESIDE_SERVICE",
    label: "Graveside Service",
    description: "Brief ceremony at burial site",
    priceRange: "$3,000 - $6,000",
    icon: TreePine,
  },
  {
    value: "DIRECT_BURIAL",
    label: "Direct Burial",
    description: "Simple burial without ceremony",
    priceRange: "$2,500 - $5,000",
    icon: Church,
  },
];

interface ServiceTypeSelectorProps {
  selectedType?: ServiceType;
  onSelect: (type: ServiceType) => void;
}

export default function ServiceTypeSelector({
  selectedType,
  onSelect,
}: ServiceTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Select Service Type
        </h2>
        <p className="text-sm text-gray-600">
          Choose the type of service arrangement that best fits the family's needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceTypes.map((service, index) => {
          const Icon = service.icon;
          const isSelected = selectedType === service.value;

          return (
            <motion.button
              key={service.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onClick={() => onSelect(service.value)}
              className={`relative p-6 rounded-lg border-2 text-left transition-all hover:shadow-lg ${
                isSelected
                  ? "border-[--navy] bg-[--cream] shadow-md"
                  : "border-gray-200 bg-white hover:border-[--sage]"
              }`}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4"
                >
                  <CheckCircle2 className="w-6 h-6 text-[--navy]" />
                </motion.div>
              )}

              {/* Icon */}
              <div
                className={`inline-flex p-3 rounded-full mb-4 ${
                  isSelected
                    ? "bg-[--navy] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isSelected ? "text-[--navy]" : "text-gray-900"
                  }`}
                >
                  {service.label}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {service.description}
                </p>
                <p className="text-sm font-medium text-[--sage]">
                  {service.priceRange}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Help Text */}
      {!selectedType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <Heart className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Need help deciding?</p>
            <p>
              Our staff can help guide families through the options and answer any
              questions about what each service includes.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
