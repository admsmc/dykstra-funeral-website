"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc-client";
import { SuccessCelebration } from "@/components/SuccessCelebration";

const approveTimesheetFormSchema = z.object({
  entryIds: z.array(z.string()).min(1, "Select at least one entry"),
});

type ApproveTimesheetForm = z.infer<typeof approveTimesheetFormSchema>;

interface TimesheetEntry {
  id: string;
  date: string;
  hours: number;
  projectCode?: string;
  caseId?: string;
  notes?: string;
}

interface ApproveTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  timesheetId: string;
  employeeName: string;
  entries: TimesheetEntry[];
}

export function ApproveTimesheetModal({
  isOpen,
  onClose,
  onSuccess,
  timesheetId,
  employeeName,
  entries,
}: ApproveTimesheetModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set(entries.map((e) => e.id))
  );

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<ApproveTimesheetForm>({
    resolver: zodResolver(approveTimesheetFormSchema),
  });

  const approveTimesheet = trpc.timesheet.approve.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        reset();
        onClose();
        onSuccess?.();
      }, 2000);
    },
  });

  const rejectTimesheet = trpc.timesheet.reject.useMutation({
    onSuccess: () => {
      reset();
      setShowRejectReason(false);
      setRejectReason('');
      onClose();
      onSuccess?.();
    },
  });

  const onSubmit = () => {
    approveTimesheet.mutate({
      entryIds: Array.from(selectedEntries),
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectTimesheet.mutate({
      entryIds: Array.from(selectedEntries),
      reason: rejectReason,
    });
  };

  const toggleEntry = (entryId: string) => {
    const updated = new Set(selectedEntries);
    if (updated.has(entryId)) {
      updated.delete(entryId);
    } else {
      updated.add(entryId);
    }
    setSelectedEntries(updated);
  };

  const totalHours = entries
    .filter((e) => selectedEntries.has(e.id))
    .reduce((sum, e) => sum + e.hours, 0);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-serif text-[--navy]">Approve Timesheet</h2>
                <p className="text-gray-600 mt-1">
                  Review and approve time entries for {employeeName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Selected Entries: {selectedEntries.size} of {entries.length}
                    </p>
                    <p className="text-lg font-bold text-blue-900 mt-1">
                      Total Hours: {totalHours.toFixed(1)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEntries(new Set(entries.map((e) => e.id)))}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEntries(new Set())}
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Entries */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-[--navy]">Time Entries</h3>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    {entries.map((entry) => (
                      <label
                        key={entry.id}
                        className={`flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedEntries.has(entry.id) ? "bg-blue-50" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(entry.id)}
                          onChange={() => toggleEntry(entry.id)}
                          className="w-4 h-4 text-[--navy] border-gray-300 rounded focus:ring-2 focus:ring-[--navy]"
                        />
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(entry.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {entry.hours}h
                            </p>
                          </div>
                          <div className="col-span-2">
                            {entry.caseId && (
                              <p className="text-sm text-gray-600">
                                Case: {entry.caseId}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-xs text-gray-500 mt-1">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Validation */}
              {selectedEntries.size === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    Please select at least one time entry to approve.
                  </p>
                </div>
              )}

              {/* Error Display */}
              {approveTimesheet.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    {approveTimesheet.error.message || "Failed to approve timesheet. Please try again."}
                  </p>
                </div>
              )}

              {/* Reject Reason */}
              {showRejectReason && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Reason for Rejection *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                    placeholder="Explain why these entries are being rejected..."
                  />
                  {!rejectReason.trim() && (
                    <p className="text-red-600 text-sm">Reason is required for rejection</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between gap-3 pt-4">
                <div>
                  {!showRejectReason && (
                    <button
                      type="button"
                      onClick={() => setShowRejectReason(true)}
                      disabled={isSubmitting || selectedEntries.size === 0}
                      className="px-4 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject Entries
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (showRejectReason) {
                        setShowRejectReason(false);
                        setRejectReason('');
                      } else {
                        onClose();
                      }
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    {showRejectReason ? 'Back' : 'Cancel'}
                  </button>
                  {showRejectReason ? (
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={rejectTimesheet.isPending || !rejectReason.trim()}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rejectTimesheet.isPending ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || selectedEntries.size === 0}
                      className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Approving..." : `Approve ${selectedEntries.size} Entries`}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSuccess && (
        <SuccessCelebration
          message={`Approved ${selectedEntries.size} time entries!`}
          onComplete={() => setShowSuccess(false)}
        />
      )}
    </>
  );
}
