import { useMemo } from 'react';
import { trpc } from '@/lib/trpc-client';
import {
  WorkflowViewModel,
  PendingReviewViewModel,
} from '../view-models/workflow-view-model';
import type {
  Workflow,
  WorkflowStage,
  Review,
  PendingReview,
  WorkflowStageStatus,
} from '../types';

type ToastLike = {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
};
import type { ReviewDecision } from '../types';

function mapPrismaWorkflowToWorkflow(raw: any): Workflow {
  const stages: WorkflowStage[] = (raw.stages ?? []).map((stage: any) => {
    const reviews: Review[] = (stage.reviews ?? []).map((r: any) => ({
      id: r.id,
      reviewerId: r.reviewerId,
      decision: r.decision as ReviewDecision | null,
      notes: r.notes,
      reviewedAt: r.reviewedAt,
    }));

    return {
      id: stage.id,
      stageOrder: stage.stageOrder,
      stageName: stage.stageName,
      status: (stage.status as WorkflowStageStatus) ?? 'pending',
      requiredReviewers: stage.requiredReviewers ?? reviews.length,
      reviews,
    };
  });

  return {
    id: raw.id,
    workflowName: raw.workflowName ?? 'Template Approval',
    templateBusinessKey: raw.templateBusinessKey,
    templateVersion: raw.templateVersion,
    createdAt: raw.createdAt,
    stages,
  };
}

export function useWorkflowApprovals(currentUserId: string) {
  // Queries
  const activeWorkflowsQuery = trpc.templateApproval.listActiveWorkflows.useQuery({
    reviewerId: currentUserId,
  });

  const pendingReviewsQuery = trpc.templateApproval.getPendingReviews.useQuery({
    reviewerId: currentUserId,
  });

  // Transform to ViewModels
  const activeWorkflows = useMemo(
    () =>
      activeWorkflowsQuery.data?.map((w) => new WorkflowViewModel(mapPrismaWorkflowToWorkflow(w))) ?? [],
    [activeWorkflowsQuery.data]
  );

  const pendingReviews = useMemo(
    () =>
      pendingReviewsQuery.data?.map((r) => {
        const workflow = mapPrismaWorkflowToWorkflow(r.stage.workflow);
        const pending: PendingReview = {
          id: r.id,
          stage: {
            stageOrder: r.stage.stageOrder,
            stageName: r.stage.stageName,
            workflow,
          },
        };
        return new PendingReviewViewModel(pending);
      }) ?? [],
    [pendingReviewsQuery.data]
  );

  // Aggregate loading states
  const isLoading = activeWorkflowsQuery.isLoading || pendingReviewsQuery.isLoading;

  return {
    activeWorkflows,
    pendingReviews,
    isLoading,
    refetchWorkflows: activeWorkflowsQuery.refetch,
    refetchPendingReviews: pendingReviewsQuery.refetch,
  };
}

export function useWorkflowDetail(workflowId: string | null) {
  const workflowQuery = trpc.templateApproval.getWorkflow.useQuery(
    { workflowId: workflowId || '' },
    { enabled: !!workflowId }
  );

  const workflow = useMemo(
    () =>
      workflowQuery.data
        ? new WorkflowViewModel(mapPrismaWorkflowToWorkflow(workflowQuery.data))
        : null,
    [workflowQuery.data]
  );

  return {
    workflow,
    isLoading: workflowQuery.isLoading,
    refetch: workflowQuery.refetch,
  };
}

export function useSubmitReview(toast: ToastLike, onSuccess?: () => void) {
  const submitReviewMutation = trpc.templateApproval.submitReview.useMutation({
    onSuccess: () => {
      toast.success('Review submitted successfully');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to submit review: ${error.message}`);
    },
  });

  const submitReview = async (
    reviewId: string,
    decision: ReviewDecision,
    notes?: string
  ) => {
    return submitReviewMutation.mutateAsync({
      reviewId,
      decision,
      notes: notes || undefined,
    });
  };

  return {
    submitReview,
    isSubmitting: submitReviewMutation.isPending,
  };
}
