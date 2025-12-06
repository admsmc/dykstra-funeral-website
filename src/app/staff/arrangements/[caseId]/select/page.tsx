"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import ServiceTypeSelector from "@/components/arrangements/ServiceTypeSelector";
import ServiceRecommendationsCard from "@/components/arrangements/ServiceRecommendationsCard";

interface PageProps {
  params: Promise<{ caseId: string }>;
}

type WizardStep = "type" | "budget" | "recommendations" | "confirm";

type ServiceType =
  | "TRADITIONAL_BURIAL"
  | "CREMATION_WITH_MEMORIAL"
  | "DIRECT_CREMATION"
  | "MEMORIAL_SERVICE"
  | "GRAVESIDE_SERVICE"
  | "DIRECT_BURIAL";

const budgetRanges = [
  { id: "under_5k", label: "Under $5,000", min: 0, max: 5000 },
  { id: "5k_10k", label: "$5,000 - $10,000", min: 5000, max: 10000 },
  { id: "10k_15k", label: "$10,000 - $15,000", min: 10000, max: 15000 },
  { id: "15k_plus", label: "$15,000+", min: 15000, max: 999999 },
  { id: "flexible", label: "Flexible", min: 0, max: 999999 },
];

export default function ServiceSelectionWizard({ params }: PageProps) {
  const { caseId } = use(params);
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<WizardStep>("type");
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | undefined>(undefined);
  const [selectedBudget, setSelectedBudget] = useState<string>("");
  const [selectedArrangementId, setSelectedArrangementId] = useState<string>("");

  // tRPC queries and mutations
  const { data: recommendations, isLoading: recommendationsLoading } =
    trpc.arrangements.getRecommendations.useQuery(
      {
        serviceType: selectedServiceType as ServiceType, // Safe because query is disabled when empty
        budgetRange: selectedBudget
          ? budgetRanges.find((b) => b.id === selectedBudget)
          : undefined,
      },
      { enabled: step === "recommendations" && !!selectedServiceType }
    );

  const saveMutation = trpc.arrangements.save.useMutation({
    onSuccess: () => {
      router.push(`/staff/arrangements/${caseId}`);
    },
  });

  const handleNext = () => {
    if (step === "type" && selectedServiceType) {
      setStep("budget");
    } else if (step === "budget" && selectedBudget) {
      setStep("recommendations");
    } else if (step === "recommendations" && selectedArrangementId) {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "budget") setStep("type");
    else if (step === "recommendations") setStep("budget");
    else if (step === "confirm") setStep("recommendations");
  };

  const handleAcceptArrangement = (arrangement: any) => {
    // Extract products from all suggested product categories
    const allProducts = [
      ...(arrangement.suggestedProducts?.caskets || []),
      ...(arrangement.suggestedProducts?.urns || []),
      ...(arrangement.suggestedProducts?.flowers || []),
      ...(arrangement.suggestedProducts?.memorialCards || []),
      ...(arrangement.suggestedProducts?.other || []),
    ];

    saveMutation.mutate({
      caseId,
      serviceType: arrangement.serviceType || selectedServiceType,
      products: allProducts.map((p: any) => ({
        id: p.id,
        type: p.type,
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl || null,
        selected: true,
      })),
      ceremony: {
        date: null,
        time: null,
        location: null,
        officiant: null,
        musicSelections: [],
        readings: [],
        specialRequests: null,
      },
    });
  };

  const handleCustomize = (arrangement: any) => {
    // Extract products from all suggested product categories
    const allProducts = [
      ...(arrangement.suggestedProducts?.caskets || []),
      ...(arrangement.suggestedProducts?.urns || []),
      ...(arrangement.suggestedProducts?.flowers || []),
      ...(arrangement.suggestedProducts?.memorialCards || []),
      ...(arrangement.suggestedProducts?.other || []),
    ];

    // Save arrangement in incomplete state, then navigate to customizer
    saveMutation.mutate(
      {
        caseId,
        serviceType: arrangement.serviceType || selectedServiceType,
        products: allProducts.map((p: any) => ({
          id: p.id,
          type: p.type,
          name: p.name,
          description: p.description,
          price: p.price,
          imageUrl: p.imageUrl || null,
          selected: true,
        })),
        ceremony: {
          date: null,
          time: null,
          location: null,
          officiant: null,
          musicSelections: [],
          readings: [],
          specialRequests: null,
        },
      },
      {
        onSuccess: () => {
          router.push(`/staff/arrangements/${caseId}/customize`);
        },
      }
    );
  };

  const canProceed =
    (step === "type" && selectedServiceType) ||
    (step === "budget" && selectedBudget) ||
    (step === "recommendations" && selectedArrangementId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[--navy] mb-2">
            Select Service Arrangement
          </h1>
          <p className="text-gray-600">
            Choose a service type and budget to see personalized recommendations
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["type", "budget", "recommendations"].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                  step === s
                    ? "bg-[--navy] text-white"
                    : ["type", "budget", "recommendations"].indexOf(step) > idx
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {["type", "budget", "recommendations"].indexOf(step) > idx ? (
                  <Check className="w-5 h-5" />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < 2 && (
                <div
                  className={`w-16 h-1 mx-2 transition ${
                    ["type", "budget", "recommendations"].indexOf(step) > idx
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Step 1: Select Service Type
                </h2>
                <ServiceTypeSelector
                  selectedType={selectedServiceType}
                  onSelect={setSelectedServiceType}
                />
              </div>
            </motion.div>
          )}

          {step === "budget" && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Step 2: Select Budget Range
                </h2>
                <p className="text-gray-600 mb-6">
                  This helps us recommend options that fit your family's needs
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {budgetRanges.map((budget) => (
                    <button
                      key={budget.id}
                      onClick={() => setSelectedBudget(budget.id)}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        selectedBudget === budget.id
                          ? "border-[--navy] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-semibold text-gray-900 mb-1">
                        {budget.label}
                      </div>
                      {budget.id !== "flexible" && (
                        <div className="text-sm text-gray-600">
                          ${budget.min.toLocaleString()} - $
                          {budget.max.toLocaleString()}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === "recommendations" && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Step 3: Choose an Arrangement
                </h2>
                <p className="text-gray-600 mb-6">
                  We've curated these arrangements based on your selections. You can
                  accept as-is or customize further.
                </p>

                {recommendationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[--navy]" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Primary Recommendation */}
                    {recommendations?.primaryArrangement && (
                      <ServiceRecommendationsCard
                        arrangement={recommendations.primaryArrangement}
                        isPrimary
                        onAccept={() => handleAcceptArrangement(recommendations.primaryArrangement)}
                        onCustomize={() => handleCustomize(recommendations.primaryArrangement)}
                      />
                    )}

                    {/* Alternatives */}
                    {recommendations?.alternativeArrangements &&
                      recommendations.alternativeArrangements.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Alternative Options
                          </h3>
                          <div className="space-y-4">
                            {recommendations.alternativeArrangements.map((alt, index) => (
                              <ServiceRecommendationsCard
                                key={alt.name + index}
                                arrangement={alt}
                                isPrimary={false}
                                onAccept={() => handleAcceptArrangement(alt)}
                                onCustomize={() => handleCustomize(alt)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === "type"}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/staff/arrangements/${caseId}`)}
              className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition"
            >
              Cancel
            </button>

            {step !== "recommendations" && (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex items-center gap-2 px-6 py-3 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
