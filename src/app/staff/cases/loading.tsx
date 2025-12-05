import { Spinner } from "@/components/loading";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Spinner size="lg" className="mx-auto" />
        <p className="text-gray-600">Loading cases...</p>
      </div>
    </div>
  );
}
