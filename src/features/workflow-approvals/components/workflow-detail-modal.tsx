import type { WorkflowViewModel } from '../view-models/workflow-view-model';

interface WorkflowDetailModalProps {
  workflow: WorkflowViewModel | null;
  onClose: () => void;
}

export function WorkflowDetailModal({ workflow, onClose }: WorkflowDetailModalProps) {
  if (!workflow) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{workflow.workflowName}</h2>
              <p className="text-gray-600 mt-1">
                {workflow.templateBusinessKey} v{workflow.templateVersion}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Detailed Stage Timeline */}
          <div className="space-y-6">
            {workflow.stages.map((stage) => (
              <div key={stage.id} className="border-l-4 border-gray-200 pl-6 pb-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  Stage {stage.stageOrder}: {stage.stageName}
                </h3>
                <p className="text-sm text-gray-600 mb-3">Status: {stage.formattedStatus}</p>

                {/* Reviews */}
                <div className="space-y-2">
                  {stage.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-gray-50 p-3 rounded border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">Reviewer: {review.reviewerId}</span>
                        {review.hasDecision && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${review.decisionColor}`}>
                            {review.decision}
                          </span>
                        )}
                      </div>
                      {review.hasNotes && (
                        <p className="text-xs text-gray-600 mt-1">{review.notes}</p>
                      )}
                      {review.hasDecision && (
                        <p className="text-xs text-gray-500 mt-1">{review.formattedReviewDate}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
