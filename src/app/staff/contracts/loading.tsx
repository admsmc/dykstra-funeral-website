import { Spinner, CardSkeleton } from "@/components/loading";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton count={3} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Table Loading */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="text-center space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <p className="text-gray-600">Loading contracts...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
