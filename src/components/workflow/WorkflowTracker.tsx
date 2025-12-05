/**
 * Workflow Tracker Component
 * Visual progress tracker for case workflow with audit log integration
 */

"use client";

import { CheckCircle, Circle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

interface WorkflowStep {
  status: string;
  label: string;
  description?: string;
}

interface WorkflowTrackerProps {
  caseId: string;
  currentStatus?: string;
  compact?: boolean;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    status: "inquiry",
    label: "Initial Inquiry",
    description: "Family contacts funeral home",
  },
  {
    status: "active",
    label: "Arrangement",
    description: "Arrangement conference scheduled",
  },
  {
    status: "service_scheduled",
    label: "Service Scheduled",
    description: "Service date and time confirmed",
  },
  {
    status: "in_progress",
    label: "In Progress",
    description: "Service preparation underway",
  },
  {
    status: "completed",
    label: "Service Completed",
    description: "Service concluded",
  },
  {
    status: "archived",
    label: "Case Finalized",
    description: "All accounting and paperwork complete",
  },
];

export function WorkflowTracker({ caseId, currentStatus, compact = false }: WorkflowTrackerProps) {
  // Fetch audit log to determine step dates
  const { data: auditLog, isLoading } = trpc.case.getAuditLog.useQuery(
    { caseId, limit: 100 },
    { enabled: !currentStatus } // Only fetch if currentStatus not provided
  );

  // Determine completed steps from audit log or current status
  const getStepStatus = (stepStatus: string): "completed" | "active" | "pending" => {
    if (currentStatus) {
      const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.status === currentStatus);
      const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.status === stepStatus);
      
      if (stepIndex < currentIndex) return "completed";
      if (stepIndex === currentIndex) return "active";
      return "pending";
    }

    // Check audit log for this step
    if (auditLog?.entries) {
      const hasStep = auditLog.entries.some((entry) => 
        entry.action === "UPDATED" && 
        entry.changes?.status?.to?.toLowerCase() === stepStatus
      );
      return hasStep ? "completed" : "pending";
    }

    return "pending";
  };

  const getStepDate = (stepStatus: string): Date | null => {
    if (!auditLog?.entries) return null;
    
    const entry = auditLog.entries.find(
      (e) => e.action === "UPDATED" && e.changes?.status?.to?.toLowerCase() === stepStatus
    );
    
    return entry ? entry.timestamp : null;
  };

  if (isLoading && !currentStatus) {
    return (
      <div className="flex items-center justify-center py-8">
        <Clock className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading workflow...</span>
      </div>
    );
  }

  if (compact) {
    // Compact horizontal stepper
    return (
      <div className="flex items-center gap-2">
        {WORKFLOW_STEPS.map((step, index) => {
          const status = getStepStatus(step.status);
          const isLast = index === WORKFLOW_STEPS.length - 1;

          return (
            <div key={step.status} className="flex items-center">
              {/* Step indicator */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full transition ${
                  status === "completed"
                    ? "bg-green-100 text-green-600"
                    : status === "active"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-400"
                }`}
                title={step.label}
              >
                {status === "completed" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`w-8 h-0.5 ${
                    status === "completed" ? "bg-green-300" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full vertical stepper with details
  return (
    <div className="space-y-6">
      {WORKFLOW_STEPS.map((step, index) => {
        const status = getStepStatus(step.status);
        const date = getStepDate(step.status);
        const isLast = index === WORKFLOW_STEPS.length - 1;

        return (
          <div key={step.status} className="relative">
            <div className="flex gap-4">
              {/* Step indicator with vertical line */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition ${
                    status === "completed"
                      ? "bg-green-50 border-green-500 text-green-600"
                      : status === "active"
                      ? "bg-blue-50 border-blue-500 text-blue-600 animate-pulse"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {status === "completed" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : status === "active" ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>

                {/* Vertical connector line */}
                {!isLast && (
                  <div
                    className={`w-0.5 h-full min-h-[40px] mt-2 ${
                      status === "completed" ? "bg-green-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-8">
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={`font-semibold ${
                      status === "completed"
                        ? "text-green-900"
                        : status === "active"
                        ? "text-blue-900"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </h3>
                  {date && (
                    <span className="text-sm text-gray-500">
                      {new Date(date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm ${
                    status === "pending" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {step.description}
                </p>
                {status === "active" && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    In Progress
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Workflow Progress Bar
 * Simple progress bar showing percentage complete
 */
export function WorkflowProgressBar({ currentStatus }: { currentStatus: string }) {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.status === currentStatus);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / WORKFLOW_STEPS.length) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Case Progress</span>
        <span className="text-gray-500">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        Step {currentIndex + 1} of {WORKFLOW_STEPS.length}
      </p>
    </div>
  );
}
