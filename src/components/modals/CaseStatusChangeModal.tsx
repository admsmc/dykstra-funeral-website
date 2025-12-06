'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@dykstra/ui/components/dialog';
import { CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { api } from '@/trpc/react';

/**
 * Case Status Change Modal
 * 
 * Professional workflow for changing case status with:
 * - Status dropdown with workflow validation
 * - Reason textarea (required for certain transitions)
 * - Notification toggles (family, staff)
 * - Success celebration with updated status
 */

interface CaseStatusChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  currentStatus: string;
  decedentName: string;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'INQUIRY', label: 'Inquiry', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'SERVICE_SCHEDULED', label: 'Service Scheduled', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { value: 'ARCHIVED', label: 'Archived', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  INQUIRY: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['SERVICE_SCHEDULED', 'ARCHIVED'],
  SERVICE_SCHEDULED: ['IN_PROGRESS', 'ACTIVE'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [], // Terminal state
};

export function CaseStatusChangeModal({
  open,
  onOpenChange,
  caseId,
  currentStatus,
  decedentName,
  onSuccess,
}: CaseStatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const [notifyFamily, setNotifyFamily] = useState(true);
  const [notifyStaff, setNotifyStaff] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const updateStatusMutation = api.case.updateStatus.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setShowSuccess(false);
        setNewStatus('');
        setReason('');
      }, 2000);
    },
  });

  const validTransitions = WORKFLOW_TRANSITIONS[currentStatus] || [];
  const validStatuses = STATUS_OPTIONS.filter(s => validTransitions.includes(s.value));

  const handleSubmit = () => {
    if (!newStatus) return;

    updateStatusMutation.mutate({
      caseId,
      status: newStatus as any,
      reason: reason.trim() || undefined,
    });
  };

  const requiresReason = newStatus === 'ARCHIVED' || currentStatus === 'COMPLETED';

  // Success celebration
  if (showSuccess) {
    const selectedStatus = STATUS_OPTIONS.find(s => s.value === newStatus);
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="md" className="text-center">
          <div className="py-8">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[--navy] mb-2">
              Status Updated!
            </h3>
            <p className="text-gray-600 mb-4">
              {decedentName}'s case is now <strong>{selectedStatus?.label}</strong>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-[--navy]">
            Change Case Status
          </DialogTitle>
          <DialogDescription>
            Update the workflow status for {decedentName}'s case
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status Display */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_OPTIONS.find(s => s.value === currentStatus)?.color}`}>
                {STATUS_OPTIONS.find(s => s.value === currentStatus)?.label || currentStatus}
              </span>
            </div>
          </div>

          {/* New Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status *
            </label>
            {validStatuses.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      No valid transitions available
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      This case is in a terminal state or requires manual intervention.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {validStatuses.map(status => (
                  <button
                    key={status.value}
                    onClick={() => setNewStatus(status.value)}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      newStatus === status.value
                        ? 'border-[--navy] bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border mb-2 ${status.color}`}>
                      {status.label}
                    </span>
                    <p className="text-xs text-gray-600">
                      {status.value === 'ARCHIVED' && 'Close this case'}
                      {status.value === 'ACTIVE' && 'Begin case management'}
                      {status.value === 'SERVICE_SCHEDULED' && 'Service date confirmed'}
                      {status.value === 'IN_PROGRESS' && 'Service is underway'}
                      {status.value === 'COMPLETED' && 'Service completed'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reason Textarea */}
          {newStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason {requiresReason && '*'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Provide context for this status change..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] resize-none"
                required={requiresReason}
              />
              {requiresReason && (
                <p className="text-xs text-gray-500 mt-1">
                  A reason is required for this status change
                </p>
              )}
            </div>
          )}

          {/* Notification Toggles */}
          {newStatus && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Notifications
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyFamily}
                    onChange={(e) => setNotifyFamily(e.target.checked)}
                    className="w-4 h-4 text-[--navy] rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Notify Family</div>
                    <div className="text-xs text-gray-600">Send email to primary family contact</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyStaff}
                    onChange={(e) => setNotifyStaff(e.target.checked)}
                    className="w-4 h-4 text-[--navy] rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Notify Staff</div>
                    <div className="text-xs text-gray-600">Alert assigned staff members</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Error Display */}
          {updateStatusMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  {updateStatusMutation.error?.message || 'Failed to update status. Please try again.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={updateStatusMutation.isPending}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newStatus || (requiresReason && !reason.trim()) || updateStatusMutation.isPending}
            className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition-all disabled:bg-gray-400 flex items-center gap-2 font-medium"
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Update Status
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
