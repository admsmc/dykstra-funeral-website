export type WorkflowStageStatus = 'pending' | 'in_review' | 'approved' | 'rejected';
export type ReviewDecision = 'approved' | 'rejected' | 'request_changes';

export interface Review {
  id: string;
  reviewerId: string;
  decision: ReviewDecision | null;
  notes: string | null;
  reviewedAt: Date | string | null;
}

export interface WorkflowStage {
  id: string;
  stageOrder: number;
  stageName: string;
  status: WorkflowStageStatus;
  requiredReviewers: number;
  reviews: Review[];
}

export interface Workflow {
  id: string;
  workflowName: string;
  templateBusinessKey: string;
  templateVersion: number;
  createdAt: Date | string;
  stages: WorkflowStage[];
}

export interface PendingReview {
  id: string;
  stage: {
    stageOrder: number;
    stageName: string;
    workflow: Workflow;
  };
}

export interface SubmitReviewResult {
  action: 'workflow_approved' | 'rejected' | 'advanced_to_next_stage';
}
