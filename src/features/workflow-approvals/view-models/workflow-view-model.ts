import { BaseViewModel } from '@/lib/view-models/base-view-model';
import type {
  Workflow,
  WorkflowStage,
  PendingReview,
  Review,
  WorkflowStageStatus,
} from '../types';

export class WorkflowViewModel extends BaseViewModel {
  constructor(private workflow: Workflow) {
    super();
  }

  get id(): string {
    return this.workflow.id;
  }

  get workflowName(): string {
    return this.workflow.workflowName;
  }

  get templateBusinessKey(): string {
    return this.workflow.templateBusinessKey;
  }

  get templateVersion(): number {
    return this.workflow.templateVersion;
  }

  get formattedCreatedDate(): string {
    return this.formatDate(this.workflow.createdAt);
  }

  get stages(): WorkflowStageViewModel[] {
    return this.workflow.stages.map((stage) => new WorkflowStageViewModel(stage));
  }

  get totalStages(): number {
    return this.workflow.stages.length;
  }

  get completedStages(): number {
    return this.workflow.stages.filter((s) => s.status === 'approved').length;
  }

  get progress(): number {
    return this.totalStages > 0 ? (this.completedStages / this.totalStages) * 100 : 0;
  }
}

export class WorkflowStageViewModel extends BaseViewModel {
  constructor(private stage: WorkflowStage) {
    super();
  }

  get id(): string {
    return this.stage.id;
  }

  get stageOrder(): number {
    return this.stage.stageOrder;
  }

  get stageName(): string {
    return this.stage.stageName;
  }

  get status(): WorkflowStageStatus {
    return this.stage.status;
  }

  get formattedStatus(): string {
    return this.toTitleCase(this.stage.status.replace('_', ' '));
  }

  get statusColor(): string {
    const colors: Record<WorkflowStageStatus, string> = {
      approved: 'bg-green-100 text-green-700',
      in_review: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      pending: 'bg-gray-100 text-gray-700',
    };
    return colors[this.stage.status];
  }

  get indicatorColor(): string {
    const colors: Record<WorkflowStageStatus, string> = {
      approved: 'bg-green-500',
      in_review: 'bg-blue-500',
      rejected: 'bg-red-500',
      pending: 'bg-gray-300',
    };
    return colors[this.stage.status];
  }

  get approvalProgress(): string {
    const approved = this.stage.reviews.filter((r) => r.decision === 'approved').length;
    return `${approved}/${this.stage.requiredReviewers}`;
  }

  get reviews(): ReviewViewModel[] {
    return this.stage.reviews.map((review) => new ReviewViewModel(review));
  }

  get isApproved(): boolean {
    return this.stage.status === 'approved';
  }

  get isInReview(): boolean {
    return this.stage.status === 'in_review';
  }

  get isPending(): boolean {
    return this.stage.status === 'pending';
  }

  get isRejected(): boolean {
    return this.stage.status === 'rejected';
  }
}

export class ReviewViewModel extends BaseViewModel {
  constructor(private review: Review) {
    super();
  }

  get id(): string {
    return this.review.id;
  }

  get reviewerId(): string {
    return this.review.reviewerId;
  }

  get decision(): string | null {
    return this.review.decision;
  }

  get decisionColor(): string {
    if (!this.review.decision) return 'bg-gray-100 text-gray-700';
    
    const colors: Record<string, string> = {
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      request_changes: 'bg-yellow-100 text-yellow-700',
    };
    return colors[this.review.decision] || 'bg-gray-100 text-gray-700';
  }

  get notes(): string | null {
    return this.review.notes;
  }

  get formattedReviewDate(): string {
    return this.formatDateTime(this.review.reviewedAt);
  }

  get hasDecision(): boolean {
    return this.review.decision !== null;
  }

  get hasNotes(): boolean {
    return !!this.review.notes;
  }
}

export class PendingReviewViewModel extends BaseViewModel {
  constructor(private pendingReview: PendingReview) {
    super();
  }

  get id(): string {
    return this.pendingReview.id;
  }

  get stageOrder(): number {
    return this.pendingReview.stage.stageOrder;
  }

  get stageName(): string {
    return this.pendingReview.stage.stageName;
  }

  get workflow(): WorkflowViewModel {
    return new WorkflowViewModel(this.pendingReview.stage.workflow);
  }

  get templateBusinessKey(): string {
    return this.pendingReview.stage.workflow.templateBusinessKey;
  }

  get submittedDate(): string {
    return this.formatDate(this.pendingReview.stage.workflow.createdAt);
  }

  get stages(): WorkflowStageViewModel[] {
    return this.pendingReview.stage.workflow.stages.map(
      (stage) => new WorkflowStageViewModel(stage)
    );
  }
}
