"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText, Package, Check } from "lucide-react";
import {
  useContractBuilder,
  ContractBuilderHeader,
  ProgressSteps,
  ServiceSelectionStep,
  ProductServicesStep,
  ReviewGenerateStep,
  type StepConfig,
} from "@/features/contract-builder";

/**
 * Contract Builder Page - Refactored
 * Multi-step wizard for creating funeral contracts
 */

export default function ContractBuilderPage() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get('caseId');

  const {
    state,
    viewModel,
    setServiceType,
    nextStep,
    prevStep,
    addService,
    addProduct,
    updateQuantity,
  } = useContractBuilder(caseId || '');

  if (!caseId) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Missing Case ID</p>
          <p className="text-sm mt-1">Please select a case before creating a contract.</p>
          <Link href="/staff/cases" className="text-sm text-red-600 hover:underline mt-2 inline-block">
            Go to Cases
          </Link>
        </div>
      </div>
    );
  }

  const steps: StepConfig[] = [
    { number: 1, label: 'Service Type', icon: FileText },
    { number: 2, label: 'Products & Services', icon: Package },
    { number: 3, label: 'Review & Generate', icon: Check },
  ];

  return (
    <div className="space-y-6">
      <ContractBuilderHeader caseId={caseId} />
      <ProgressSteps steps={steps} currentStep={viewModel.currentStep} />

      <div className="bg-white rounded-lg border border-gray-200">
        {state.step === 1 && (
          <ServiceSelectionStep
            selectedServiceType={state.serviceType}
            onSelectServiceType={setServiceType}
            onNext={nextStep}
          />
        )}
        
        {state.step === 2 && (
          <ProductServicesStep
            state={state}
            onAddService={addService}
            onAddProduct={addProduct}
            onUpdateQuantity={updateQuantity}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {state.step === 3 && (
          <ReviewGenerateStep
            viewModel={viewModel}
            onPrev={prevStep}
          />
        )}
      </div>
    </div>
  );
}
