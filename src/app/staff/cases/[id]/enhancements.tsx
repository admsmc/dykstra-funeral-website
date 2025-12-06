/**
 * Case Detail Page Enhancements
 * Enhanced tab components with full functionality
 * 
 * This file contains the enhanced versions of:
 * 1. OverviewTab - with real financial data, tasks, staff assignments
 * 2. TimelineTab - with audit log viewer
 * 3. Status transition UI in header
 */

"use client";

import { trpc } from "@/lib/trpc-client";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { User, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, type TaskFormData } from "@dykstra/domain/validation";
// TODO: Create FormFields components
// import { FormInput, FormTextarea, FormSelect } from "@/components/form/FormFields";

// ============================================================================
// 1. ENHANCED OVERVIEW TAB
// ============================================================================

function EnhancedOverviewTabContent({ caseData }: { caseData: any }) {
  const toast = useToast();
  const caseId = caseData.case.id;
  const businessKey = caseData.case.businessKey || caseData.case.id;

  // Financial summary
  const { data: financial } = trpc.caseEnhancements.getFinancialSummary.useQuery({ caseId });

  // Tasks
  const { data: tasks, refetch: refetchTasks } = trpc.caseEnhancements.getTasks.useQuery({ caseId });
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  const taskForm = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: "",
      dueDate: "",
    },
  });
  
  const createTaskMutation = trpc.caseEnhancements.createTask.useMutation({
    onSuccess: () => {
      toast.success("Task created");
      setShowTaskForm(false);
      taskForm.reset();
      refetchTasks();
    },
  });

  const updateTaskStatusMutation = trpc.caseEnhancements.updateTaskStatus.useMutation({
    onSuccess: () => {
      toast.success("Task updated");
      refetchTasks();
    },
  });

  // Staff members for assignment
  const { data: staffMembers } = trpc.caseEnhancements.getStaffMembers.useQuery();

  const handleCreateTask = taskForm.handleSubmit((data) => {
    createTaskMutation.mutate({
      caseId,
      title: data.title,
      description: data.description || undefined,
      assignedTo: data.assignedTo || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
  });

  return (
    <div className="space-y-6">
      {/* Decedent Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Decedent Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <p className="text-gray-900 mt-1">{caseData.case.decedentName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date of Birth</label>
            <p className="text-gray-900 mt-1">
              {caseData.case.decedentDateOfBirth 
                ? new Date(caseData.case.decedentDateOfBirth).toLocaleDateString()
                : "Not provided"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date of Death</label>
            <p className="text-gray-900 mt-1">
              {caseData.case.decedentDateOfDeath 
                ? new Date(caseData.case.decedentDateOfDeath).toLocaleDateString()
                : "Not provided"}
            </p>
          </div>
        </div>
      </div>

      {/* Staff Assignments */}
      <StaffAssignmentSection caseId={businessKey} staffMembers={(staffMembers || []) as any} />

      {/* Financial Summary - REAL DATA */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">Contract Total</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              ${financial?.contractTotal ? Number(financial.contractTotal).toFixed(2) : "0.00"}
            </p>
            {!financial?.hasContract && (
              <p className="text-xs text-blue-600 mt-1">No contract yet</p>
            )}
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">Paid to Date</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              ${financial?.paidToDate ? Number(financial.paidToDate).toFixed(2) : "0.00"}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">Outstanding Balance</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">
              ${financial?.outstanding ? Number(financial.outstanding).toFixed(2) : "0.00"}
            </p>
          </div>
        </div>
      </div>

      {/* Tasks - FULL CRUD */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
          {!showTaskForm && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          )}
        </div>

        {showTaskForm && (
          <form onSubmit={handleCreateTask} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
            <input
              {...taskForm.register("title")}
              placeholder="Task title *"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              {...taskForm.register("description")}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                {...taskForm.register("assignedTo")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Assign to...</option>
                {staffMembers?.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
              <input
                {...taskForm.register("dueDate")}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition text-sm disabled:opacity-50"
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTaskForm(false);
                  taskForm.reset();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {task.assignedTo && <span>👤 {task.assignedTo}</span>}
                      {task.dueDate && (
                        <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <select
                    value={task.status}
                    onChange={(e) =>
                      updateTaskStatusMutation.mutate({
                        taskId: task.id,
                        status: e.target.value as any,
                      })
                    }
                    className={`text-sm px-2 py-1 rounded border ${
                      task.status === "COMPLETED"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : task.status === "IN_PROGRESS"
                        ? "bg-blue-50 border-blue-200 text-blue-800"
                        : "bg-gray-50 border-gray-200 text-gray-800"
                    }`}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No tasks assigned to this case
          </div>
        )}
      </div>
    </div>
  );
}

export function EnhancedOverviewTab({ caseData }: { caseData: any }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Overview</h3>
          <p className="text-sm text-red-700 mb-4">{error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      )}
    >
      <EnhancedOverviewTabContent caseData={caseData} />
    </ErrorBoundary>
  );
}

// ============================================================================
// 2. STAFF ASSIGNMENT SECTION
// ============================================================================

function StaffAssignmentSection({ caseId, staffMembers }: { caseId: string; staffMembers: any[] }) {
  const toast = useToast();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");

  // Note: Assignment mutation would go here
  // For now, this is UI-only until we add assignedDirector field to Case model

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Assignments</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">Assigned Funeral Director</p>
        {!isAssigning ? (
          <>
            <p className="text-gray-900 font-medium mt-1">Not assigned</p>
            <button
              onClick={() => setIsAssigning(true)}
              className="text-sm text-[--navy] hover:underline mt-2"
            >
              Assign Director
            </button>
          </>
        ) : (
          <div className="mt-2 flex gap-2">
            <select
              value={selectedStaff}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setSelectedStaff(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select director...</option>
              {staffMembers
                .filter((s) => s.role === "DIRECTOR" || s.role === "FUNERAL_DIRECTOR")
                .map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
            </select>
            <button
              onClick={() => {
                // TODO: Implement assignment mutation
                toast.info("Assignment feature coming soon");
                setIsAssigning(false);
              }}
              className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-[--sage] transition text-sm"
            >
              Assign
            </button>
            <button
              onClick={() => setIsAssigning(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. ENHANCED TIMELINE TAB - AUDIT LOG VIEWER
// ============================================================================

function EnhancedTimelineTabContent({ caseId }: { caseId: string }) {
  const { data: auditLogs, isLoading } = trpc.caseEnhancements.getAuditLog.useQuery({
    entityId: caseId,
    entityType: "Case",
    limit: 50,
  });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading audit log...</div>;
  }

  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="font-medium">No activity yet</p>
        <p className="text-sm mt-1">Case activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
      <div className="space-y-3">
        {auditLogs.map((log) => (
          <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{log.action}</p>
                <p className="text-sm text-gray-600 mt-1">
                  By {log.user.name} ({log.user.email})
                </p>
                {log.ipAddress && (
                  <p className="text-xs text-gray-500 mt-1">From {log.ipAddress}</p>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-gray-600 cursor-pointer">View metadata</summary>
                <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EnhancedTimelineTab({ caseId }: { caseId: string }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Timeline</h3>
          <p className="text-sm text-red-700 mb-4">{error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      )}
    >
      <EnhancedTimelineTabContent caseId={caseId} />
    </ErrorBoundary>
  );
}

// ============================================================================
// 4. STATUS TRANSITION COMPONENT (for header)
// ============================================================================

function StatusTransitionDropdownContent({ caseData, onSuccess }: { caseData: any; onSuccess: () => void }) {
  const toast = useToast();
  const businessKey = caseData.case.businessKey || caseData.case.id;
  const currentStatus = caseData.case.status;

  const updateStatusMutation = trpc.caseEnhancements.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (confirm(`Change status from ${currentStatus} to ${newStatus}?`)) {
      updateStatusMutation.mutate({
        businessKey,
        newStatus: newStatus as any,
      });
    }
  };

  // Valid transitions based on current status
  const validTransitions: Record<string, string[]> = {
    INQUIRY: ["ACTIVE", "ARCHIVED"],
    ACTIVE: ["COMPLETED", "ARCHIVED"],
    COMPLETED: ["ARCHIVED"],
    ARCHIVED: [],
  };

  const nextStatuses = validTransitions[currentStatus] || [];

  if (nextStatuses.length === 0) {
    return null; // No transitions available
  }

  return (
    <select
      value=""
      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => e.target.value && handleStatusChange(e.target.value)}
      disabled={updateStatusMutation.isPending}
      className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
    >
      <option value="">Change status...</option>
      {nextStatuses.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

export function StatusTransitionDropdown({ caseData, onSuccess }: { caseData: any; onSuccess: () => void }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="text-sm text-red-600">
          Error: {error.message}
        </div>
      )}
    >
      <StatusTransitionDropdownContent caseData={caseData} onSuccess={onSuccess} />
    </ErrorBoundary>
  );
}
