"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import ServiceCustomizer from "@/components/arrangements/ServiceCustomizer";
import PricingCalculator from "@/components/arrangements/PricingCalculator";

interface PageProps {
  params: Promise<{ caseId: string }>;
}

export default function ServiceCustomizerPage({ params }: PageProps) {
  const { caseId } = use(params);
  const router = useRouter();

  // Fetch current arrangement and catalog
  const { data: arrangement, isLoading: arrangementLoading } =
    trpc.arrangements.get.useQuery({ caseId });

  const { data: catalog, isLoading: catalogLoading } =
    trpc.arrangements.browseCatalog.useQuery({});

  // Local state for selected items
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Sync local state with arrangement data
  useEffect(() => {
    if (arrangement) {
      setSelectedServices(
        arrangement.services?.filter((s: any) => s.selected).map((s: any) => s.id) ?? []
      );
      setSelectedProducts(
        arrangement.products?.filter((p: any) => p.selected).map((p: any) => p.id) ?? []
      );
    }
  }, [arrangement]);

  // Calculate pricing
  const { data: pricing, refetch: refetchPricing } =
    trpc.arrangements.calculatePricing.useQuery(
      {
        serviceIds: selectedServices,
        productIds: selectedProducts,
      },
      { enabled: selectedServices.length > 0 || selectedProducts.length > 0 }
    );

  // Save mutation
  const saveMutation = trpc.arrangements.save.useMutation({
    onSuccess: () => {
      router.push(`/staff/arrangements/${caseId}`);
    },
  });

  // Handlers
  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
    refetchPricing();
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
    refetchPricing();
  };

  const handleSave = () => {
    saveMutation.mutate({
      caseId,
      serviceType: arrangement?.serviceType ?? "",
      products: selectedProducts.map((id) => ({
        productId: id,
        selected: true,
      })),
      ceremonyDetails: arrangement?.ceremonyDetails ?? {
        date: new Date(),
        location: "",
        officiant: "",
        music: [],
        readings: [],
        specialRequests: "",
      },
      isComplete: false,
    });
  };

  if (arrangementLoading || catalogLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[--navy]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[--navy] mb-2">
            Customize Service Arrangement
          </h1>
          <p className="text-gray-600">
            Add or remove services and products to personalize the arrangement
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Service customizer (2/3 width) */}
          <div className="lg:col-span-2">
            <ServiceCustomizer
              services={catalog?.services ?? []}
              products={catalog?.products ?? []}
              selectedServices={selectedServices}
              selectedProducts={selectedProducts}
              onServiceToggle={handleServiceToggle}
              onProductToggle={handleProductToggle}
            />
          </div>

          {/* Right column: Pricing calculator (1/3 width, sticky) */}
          <div className="lg:col-span-1">
            <PricingCalculator
              services={
                catalog?.services
                  ?.filter((s: any) => selectedServices.includes(s.id))
                  .map((s: any) => ({ name: s.name, price: s.price })) ?? []
              }
              products={
                catalog?.products
                  ?.filter((p: any) => selectedProducts.includes(p.id))
                  .map((p: any) => ({ name: p.name, price: p.price })) ?? []
              }
              total={pricing?.total ?? 0}
              budgetGuidance={{
                min: 5000,
                max: 15000,
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.push(`/staff/arrangements/${caseId}`)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>

            <button
              onClick={() => router.push(`/staff/arrangements/${caseId}/ceremony`)}
              disabled={selectedServices.length === 0 && selectedProducts.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-[--navy] text-white font-medium rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Ceremony Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
