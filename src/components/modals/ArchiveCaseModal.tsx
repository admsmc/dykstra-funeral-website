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
import { Archive, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';

/**
 * Archive Case Modal
 * 
 * Two-step confirmation with cascading effects warning
 */

interface ArchiveCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  decedentName: string;
  onSuccess?: () => void;
}

const ARCHIVE_REASONS = [
  { value: 'COMPLETED', label: 'Service Completed' },
  { value: 'CANCELLED', label: 'Service Cancelled' },
  { value: 'DUPLICATE', label: 'Duplicate Case' },
  { value: 'OTHER', label: 'Other Reason' },
];

export function ArchiveCaseModal({
  open,
  onOpenChange,
  caseId,
  decedentName,
  onSuccess,
}: ArchiveCaseModalProps) {
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [reason, setReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const archiveMutation = api.case.updateStatus.useMutation({
    onSuccess: () => {
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setStep('confirm');
        setReason('');
        setAdditionalNotes('');
      }, 2000);
    },
  });

  const handleArchive = () => {
    archiveMutation.mutate({
      caseId,
      status: 'ARCHIVED' as any,
      reason: `${ARCHIVE_REASONS.find(r => r.value === reason)?.label}${additionalNotes ? ': ' + additionalNotes : ''}`,
    });
  };

  // Success screen
  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="md" className="text-center">
          <div className="py-8">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[--navy] mb-2">
              Case Archived
            </h3>
            <p className="text-gray-600">
              {decedentName}'s case has been archived
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
          <DialogTitle className="text-2xl font-serif text-[--navy] flex items-center gap-2">
            <Archive className="w-6 h-6" />
            Archive Case
          </DialogTitle>
          <DialogDescription>
            Archive {decedentName}'s case - this action can be undone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning Box */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800 mb-1">
                  This will affect the following:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Case will be hidden from active list</li>
                  <li>• Family portal access will be read-only</li>
                  <li>• Staff notifications will be disabled</li>
                  <li>• Financial reports will mark as closed</li>
                </ul>
                <p className="text-sm text-yellow-700 mt-2 font-medium">
                  Don't worry: You can unarchive this case later if needed.
                </p>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archive Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
              required
            >
              <option value="">Select a reason...</option>
              {ARCHIVE_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              placeholder="Add any additional context..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] resize-none"
            />
          </div>

          {/* Error Display */}
          {archiveMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {archiveMutation.error?.message || 'Failed to archive case'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={archiveMutation.isPending}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={!reason || archiveMutation.isPending}
            className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition-all disabled:bg-gray-400 flex items-center gap-2 font-medium"
          >
            {archiveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Archive Case
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
