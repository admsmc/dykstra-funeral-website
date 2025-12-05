import { useMemo } from 'react';
import { trpc } from '@/lib/trpc-client';
import type { ToastInstance } from '@/components/toast';
import {
  WorkflowViewModel,
  PendingReviewViewModel,
} from '../view-models/workflow-view-model';
import type { ReviewDecision } from '../types';

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
    () => activeWorkflowsQuery.data?.map((w) => new WorkflowViewModel(w)) ?? [],
    [activeWorkflowsQuery.data]
  );

  const pendingReviews = useMemo(
    () => pendingReviewsQuery.data?.map((r) => new PendingReviewViewModel(r)) ?? [],
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
    () => workflowQuery.data ? new WorkflowViewModel(workflowQuery.data) : null,
    [workflowQuery.data]
  );

  return {
    workflow,
    isLoading: workflowQuery.isLoading,
    refetch: workflowQuery.refetch,
  };
}

export function useSubmitReview(toast: ToastInstance, onSuccess?: () => void) {
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
