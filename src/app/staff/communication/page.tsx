import { Suspense } from "react";
import { CommunicationPageClient } from "./CommunicationPageClient";

export default function CommunicationPage() {
  return (
    <Suspense fallback={<div className="space-y-6">Loading communication...</div>}>
      <CommunicationPageClient />
    </Suspense>
  );
}
