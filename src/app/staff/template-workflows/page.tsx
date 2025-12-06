'use client';

import { useState } from 'react';
import {
  WorkflowSummaryCards,
  PendingReviewsList,
  ActiveWorkflowsList,
  WorkflowDetailModal,
  useWorkflowApprovals,
  useWorkflowDetail,
  useSubmitReview,
} from '@/features/workflow-approvals';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageSection } from '@/components/layouts/PageSection';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { useToast } from '@/components/toast';

export default function TemplateWorkflowsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const currentUserId = 'current-user'; // TODO: Get from auth context
  const toast = useToast();

  const { activeWorkflows, pendingReviews, isLoading, refetchWorkflows, refetchPendingReviews } =
    useWorkflowApprovals(currentUserId);

  const { workflow: selectedWorkflow, refetch: refetchWorkflow } =
    useWorkflowDetail(selectedWorkflowId);

  const { submitReview } = useSubmitReview(toast, () => {
    void refetchWorkflows();
    void refetchPendingReviews();
    void refetchWorkflow();
  });

  const handleReviewSubmit = async (reviewId: string, decision: any, notes?: string) => {
    const result = await submitReview(reviewId, decision, notes);
    
    if (result.action === 'workflow_approved') {
      alert('✅ Workflow approved! Template is now active.');
    } else if (result.action === 'rejected') {
      alert('❌ Workflow rejected. Template will not be activated.');
    } else if (result.action === 'advanced_to_next_stage') {
      alert('✅ Stage approved! Moving to next stage.');
    }
  };

  if (isLoading) {
    return <DashboardSkeleton statsCount={2} showChart={false} />;
  }

  return (
    <DashboardLayout
      title="Template Approval Workflows"
      subtitle="Multi-stage review and approval process"
    >
      <WorkflowSummaryCards
        activeCount={activeWorkflows.length}
        pendingCount={pendingReviews.length}
      />

      <PageSection title="Your Pending Reviews" withCard={false}>
        <PendingReviewsList
          reviews={pendingReviews}
          onViewDetails={setSelectedWorkflowId}
          onSubmitReview={handleReviewSubmit}
        />
      </PageSection>

      <PageSection title="All Active Workflows" withCard={false}>
        <ActiveWorkflowsList
          workflows={activeWorkflows}
          onViewTimeline={setSelectedWorkflowId}
        />
      </PageSection>

      <WorkflowDetailModal workflow={selectedWorkflow} onClose={() => setSelectedWorkflowId(null)} />
    </DashboardLayout>
  );
}
