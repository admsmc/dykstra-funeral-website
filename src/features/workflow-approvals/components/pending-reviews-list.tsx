import type { PendingReviewViewModel } from '../view-models/workflow-view-model';
import type { ReviewDecision } from '../types';

interface PendingReviewsListProps {
  reviews: PendingReviewViewModel[];
  onViewDetails: (workflowId: string) => void;
  onSubmitReview: (reviewId: string, decision: ReviewDecision, notes?: string) => Promise<void>;
}

export function PendingReviewsList({
  reviews,
  onViewDetails,
  onSubmitReview,
}: PendingReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <div className="text-5xl mb-4">✅</div>
        <p className="text-gray-600">No pending reviews</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {review.templateBusinessKey}
              </h3>
              <p className="text-sm text-gray-600">
                Stage {review.stageOrder}: {review.stageName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Submitted {review.submittedDate}
              </p>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              Awaiting Your Review
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              {review.stages.map((stage, idx) => (
                <div key={stage.id} className="flex-1 flex items-center">
                  <div className={`flex-1 h-2 rounded ${stage.indicatorColor}`} />
                  {idx < review.stages.length - 1 && (
                    <div className="w-2 h-2 bg-gray-300 rounded-full mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Review Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(review.workflow.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              View Details
            </button>
            <button
              onClick={() => {
                const notes = prompt('Add approval notes (optional):');
                void onSubmitReview(review.id, 'approved', notes || undefined);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => {
                const notes = prompt('Reason for rejection (required):');
                if (notes) {
                  void onSubmitReview(review.id, 'rejected', notes);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              ✗ Reject
            </button>
            <button
              onClick={() => {
                const notes = prompt('Request specific changes:');
                if (notes) {
                  void onSubmitReview(review.id, 'request_changes', notes);
                }
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              ⚠ Request Changes
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
