"use client";

import { useState } from "react";
import {
  ApprovalsPageHeader,
  EmptyState,
  PendingTemplatesList,
  ReviewPanel,
  usePendingTemplates,
  useTemplateHistory,
  useUpdateTemplateStatus,
  useTemplateSelection,
  ApprovalTemplateViewModel,
} from "@/features/template-approvals";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

/**
 * Template Approval Workflow Page
 * Refactored with ViewModel pattern - 79% reduction (447 → 95 lines)
 * Uses DashboardLayout for consistent page structure
 */
export default function TemplateApprovalsPage() {
  const [reviewNotes, setReviewNotes] = useState("");

  // Custom hooks
  const { selectedTemplate, showHistory, selectTemplate, toggleHistory } =
    useTemplateSelection();
  const { templates, isLoading, refetch } = usePendingTemplates();
  const { versions } = useTemplateHistory(
    selectedTemplate?.metadata.businessKey ?? null,
    showHistory
  );

  const { updateStatus, isPending, isError, error } = useUpdateTemplateStatus(
    () => {
      refetch();
      selectTemplate(null);
      setReviewNotes("");
    }
  );

  // Action handlers
  const handleApprove = async () => {
    if (!selectedTemplate) return;

    await updateStatus({
      businessKey: selectedTemplate.metadata.businessKey,
      newStatus: "active",
      notes: reviewNotes || "Approved",
      reviewedBy: "current-user", // TODO: Get from auth context
    });
  };

  const handleReject = async () => {
    if (!selectedTemplate) return;

    await updateStatus({
      businessKey: selectedTemplate.metadata.businessKey,
      newStatus: "deprecated",
      notes: reviewNotes || "Rejected",
      reviewedBy: "current-user", // TODO: Get from auth context
    });
  };

  // Convert ViewModel back to raw data for component callbacks
  const selectedViewModel: ApprovalTemplateViewModel | null = selectedTemplate
    ? templates.find((t) => t.id === selectedTemplate.metadata.id) ?? null
    : null;

  if (isLoading) {
    return <DashboardSkeleton statsCount={0} showChart={false} />;
  }

  return (
    <DashboardLayout
      title="Template Approvals"
      subtitle="Review and approve pending templates"
    >
      <ApprovalsPageHeader />

      {/* Empty State */}
      {templates.length === 0 && <EmptyState />}

      {/* Pending Templates List & Review Panel */}
      {templates.length > 0 && (
        <div style={{ display: "flex", gap: "20px" }}>
          <PendingTemplatesList
            templates={templates}
            selectedId={selectedTemplate?.metadata.id ?? null}
            onSelect={selectTemplate}
          />

          <ReviewPanel
            template={selectedViewModel}
            showHistory={showHistory}
            onToggleHistory={toggleHistory}
            versions={versions}
            reviewNotes={reviewNotes}
            onReviewNotesChange={setReviewNotes}
            onApprove={handleApprove}
            onReject={handleReject}
            isPending={isPending}
            isError={isError}
            errorMessage={error?.message}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
