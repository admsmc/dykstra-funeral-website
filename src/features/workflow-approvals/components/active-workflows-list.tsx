import type { WorkflowViewModel } from '../view-models/workflow-view-model';

interface ActiveWorkflowsListProps {
  workflows: WorkflowViewModel[];
  onViewTimeline: (workflowId: string) => void;
}

export function ActiveWorkflowsList({ workflows, onViewTimeline }: ActiveWorkflowsListProps) {
  if (workflows.length === 0) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-gray-600">No active workflows</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workflows.map((workflow) => (
        <div key={workflow.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{workflow.workflowName}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Template: {workflow.templateBusinessKey} v{workflow.templateVersion}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Started {workflow.formattedCreatedDate}
              </p>
            </div>
            <button
              onClick={() => onViewTimeline(workflow.id)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
            >
              View Timeline
            </button>
          </div>

          {/* Workflow Stages Timeline */}
          <div className="space-y-3">
            {workflow.stages.map((stage) => (
              <div key={stage.id} className="flex items-start gap-4">
                {/* Status Indicator */}
                <div className="flex-shrink-0 mt-1">
                  {stage.isApproved && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                  )}
                  {stage.isInReview && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                  {stage.isPending && (
                    <div className="w-6 h-6 bg-gray-300 rounded-full" />
                  )}
                  {stage.isRejected && (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                      ✗
                    </div>
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        Stage {stage.stageOrder}: {stage.stageName}
                      </p>
                      <p className="text-xs text-gray-500">{stage.approvalProgress} approvals</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${stage.statusColor}`}>
                      {stage.formattedStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
