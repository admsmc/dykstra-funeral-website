"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Save } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import CeremonyPlanner from "@/components/arrangements/CeremonyPlanner";

interface PageProps {
  params: Promise<{ caseId: string }>;
}

export default function CeremonyPlanningPage({ params }: PageProps) {
  const { caseId } = use(params);
  const router = useRouter();

  // Fetch current arrangement
  const { data: arrangement, isLoading } = trpc.arrangements.get.useQuery({
    caseId,
  });

  // Local state for ceremony details
  const [ceremonyDetails, setCeremonyDetails] = useState({
    date: new Date(),
    location: "",
    officiant: "",
    music: [] as string[],
    readings: [] as string[],
    specialRequests: "",
  });

  // Sync local state with arrangement data
  useEffect(() => {
    if (arrangement?.ceremony) {
      setCeremonyDetails({
        date: arrangement.ceremony.date
          ? new Date(arrangement.ceremony.date)
          : new Date(),
        location: arrangement.ceremony.location ?? "",
        officiant: arrangement.ceremony.officiant ?? "",
        music: arrangement.ceremony.musicSelections ?? [],
        readings: arrangement.ceremony.readings ?? [],
        specialRequests: arrangement.ceremony.specialRequests ?? "",
      });
    }
  }, [arrangement]);

  // Save mutation
  const saveMutation = trpc.arrangements.save.useMutation({
    onSuccess: () => {
      router.push(`/staff/arrangements/${caseId}`);
    },
  });

  // Handlers
  const handleSave = (isComplete: boolean) => {
    saveMutation.mutate({
      caseId,
      serviceType: arrangement?.serviceType ?? undefined,
      products: arrangement?.products?.filter((p: any) => p.selected) ?? [],
      ceremony: ceremonyDetails,
    });
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
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[--navy] mb-2">
            Ceremony Planning
          </h1>
          <p className="text-gray-600">
            Plan the ceremony details, including date, location, and personalization
          </p>
        </div>

        {/* Ceremony Planner Component */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <CeremonyPlanner
            initialDetails={{
              date: ceremonyDetails.date.toISOString().split('T')[0],
              location: ceremonyDetails.location,
              officiant: ceremonyDetails.officiant,
              musicSelections: ceremonyDetails.music,
              readings: ceremonyDetails.readings,
              specialRequests: ceremonyDetails.specialRequests,
            }}
            onChange={(details) => {
              setCeremonyDetails({
                date: details.date ? new Date(details.date) : new Date(),
                location: details.location ?? '',
                officiant: details.officiant ?? '',
                music: details.musicSelections,
                readings: details.readings,
                specialRequests: details.specialRequests ?? '',
              });
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/staff/arrangements/${caseId}/customize`)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customization
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSave(false)}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={
                saveMutation.isPending ||
                !ceremonyDetails.date ||
                !ceremonyDetails.location
              }
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Arrangement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
