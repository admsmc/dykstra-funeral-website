import { ArrowRight, Check, ChevronRight, DollarSign } from "lucide-react";
import type { ServiceType } from "../types";
import { SERVICE_TYPE_OPTIONS } from "../constants/service-types";

export function ServiceSelectionStep({
  selectedServiceType,
  onSelectServiceType,
  onNext,
}: {
  selectedServiceType: ServiceType | null;
  onSelectServiceType: (type: ServiceType) => void;
  onNext: () => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Select Service Type</h2>
        <p className="text-gray-600 mt-1">
          Choose the type of service that best fits your needs. You can customize products and services in the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {SERVICE_TYPE_OPTIONS.map((service) => {
          const isSelected = selectedServiceType === service.type;
          
          return (
            <button
              key={service.type}
              onClick={() => onSelectServiceType(service.type)}
              className={`text-left p-6 rounded-lg border-2 transition hover:shadow-md ${
                isSelected
                  ? 'border-[--navy] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{service.icon}</div>
                {isSelected && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[--navy] text-white">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {service.name}
              </h3>
              <div className="flex items-center gap-1 text-[--navy] font-semibold mb-3">
                <DollarSign className="w-4 h-4" />
                <span>{service.basePrice.toLocaleString()}</span>
                <span className="text-xs text-gray-500 font-normal">starting at</span>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {service.description}
              </p>

              <div className="space-y-1">
                {service.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span>{feature}</span>
                  </div>
                ))}
                {service.features.length > 3 && (
                  <p className="text-xs text-gray-500 mt-1">
                    +{service.features.length - 3} more services
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div></div>
        <button
          onClick={onNext}
          disabled={!selectedServiceType}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
