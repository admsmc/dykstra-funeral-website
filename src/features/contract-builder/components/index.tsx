import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import type { StepConfig } from "../types";

// Header Component
export function ContractBuilderHeader({ caseId }: { caseId: string }) {
  return (
    <div>
      <Link
        href={`/staff/cases/${caseId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Case
      </Link>
      
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Builder</h1>
          <p className="text-gray-600 mt-1">
            Create a new contract for this case
          </p>
        </div>
      </div>
    </div>
  );
}

// Progress Steps Component
export function ProgressSteps({ steps, currentStep }: { steps: StepConfig[]; currentStep: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          
          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex items-center flex-1">
                {/* Step Circle */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition ${
                    isCompleted
                      ? 'bg-green-100 border-green-600 text-green-600'
                      : isActive
                      ? 'bg-[--navy] border-[--navy] text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                {/* Step Label */}
                <div className="ml-3">
                  <p
                    className={`text-sm font-medium ${
                      isActive ? 'text-[--navy]' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    Step {step.number}
                  </p>
                  <p
                    className={`text-xs ${
                      isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-4 ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export step components from separate files
export { ServiceSelectionStep } from "./ServiceSelectionStep";
export { ProductServicesStep } from "./ProductServicesStep";
export { ReviewGenerateStep } from "./ReviewGenerateStep";
