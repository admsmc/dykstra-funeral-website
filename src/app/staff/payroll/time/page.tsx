'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, AlertCircle, TrendingUp, Plus, Loader2, Download } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ApproveTimesheetModal } from '../_components/ApproveTimesheetModal';
import { CreateTimeEntryModal } from '../_components/CreateTimeEntryModal';
import { RequestPTOModal } from '../_components/RequestPTOModal';
import { useModalKeyboardShortcuts } from '@/hooks/useModalKeyboardShortcuts';
import { toast } from 'sonner';
import { exportTimesheets } from '@/lib/csv-export';

/**
 * Time Tracking Page - Linear/Notion Style
 * 
 * Modern Features:
 * - Weekly calendar view with day cards
 * - Inline time entry with animations
 * - Real-time hour calculations
 * - Status indicators (submitted, approved, pending)
 * - PTO request integration
 * - Overtime warnings
 * 
 * Uses:
 * - Use Case 3.1: Time Entry Recording
 * - Use Case 3.2: Timesheet Approval
 * - Use Case 3.3: PTO Request and Approval
 * - Use Case 3.4: Overtime Calculation
 */

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  projectCode?: string;
  notes?: string;
  status: 'draft' | 'submitted' | 'approved';
}


export default function TimeTrackingPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPTOModal, setShowPTOModal] = useState(false);

  // Keyboard shortcuts
  useModalKeyboardShortcuts({
    onApprove: () => setShowApproveModal(true),
  });

  // Fetch time entries from API
  const { data: entriesData = [], isLoading, error, refetch } = trpc.timesheet.list.useQuery({
    status: 'all',
  });

  // Normalize entries to include draft/submitted/approved statuses
  const entries = entriesData as TimeEntry[];

  // Create time entry mutation
  const createMutation = trpc.timesheet.create.useMutation({
    onSuccess: () => {
      toast.success('Time entry created successfully');
      refetch();
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create time entry');
    },
  });

  // Submit timesheet mutation
  const submitMutation = trpc.timesheet.submit.useMutation({
    onSuccess: () => {
      toast.success('Timesheet submitted for approval');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit timesheet');
    },
  });

  const handleSubmitTimesheet = () => {
    const draftEntries = entries.filter(e => e.status === 'draft');
    if (draftEntries.length === 0) {
      toast.error('No draft entries to submit');
      return;
    }
    const entryIds = draftEntries.map((e) => e.id);
    submitMutation.mutate({ entryIds });
  };

  // Request PTO mutation
  const requestPTOMutation = trpc.timesheet.requestPTO.useMutation({
    onSuccess: () => {
      toast.success('PTO request submitted successfully');
      setShowPTOModal(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit PTO request');
    },
  });

  // Calculate totals
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const approvedHours = entries.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.hours, 0);
  const pendingHours = entries.filter(e => e.status === 'submitted').reduce((sum, e) => sum + e.hours, 0);
  const overtimeHours = Math.max(0, totalHours - 40);

  // Get current week days
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        day: date.getDate(),
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900">Time Tracking</h1>
        <p className="text-lg text-gray-600">Record your hours and manage timesheets</p>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading time entries...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load time entries. Please try again.
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          icon={Clock}
          label="Total Hours"
          value={totalHours.toFixed(1)}
          color="indigo"
          delay={0}
        />
        <StatsCard
          icon={CheckCircle2}
          label="Approved"
          value={approvedHours.toFixed(1)}
          color="green"
          delay={0.1}
        />
        <StatsCard
          icon={AlertCircle}
          label="Pending"
          value={pendingHours.toFixed(1)}
          color="amber"
          delay={0.2}
          pulse={pendingHours > 0}
        />
        <StatsCard
          icon={TrendingUp}
          label="Overtime"
          value={overtimeHours.toFixed(1)}
          color={overtimeHours > 0 ? "red" : "gray"}
          delay={0.3}
          pulse={overtimeHours > 0}
        />
      </div>
      )}

      {/* Weekly Calendar */}
      {!isLoading && !error && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">This Week</h2>
          <div className="flex gap-2">
            <button
              onClick={() => exportTimesheets(entries)}
              disabled={entries.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              disabled={entries.length === 0}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Timesheet
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day, index) => {
            const dayEntries = entries.filter(e => e.date === day.date);
            const dayHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
            const hasEntries = dayEntries.length > 0;
            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isToday
                    ? 'border-indigo-500 bg-indigo-50'
                    : hasEntries
                    ? 'border-green-200 bg-green-50 hover:border-green-300'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-500 mb-1">{day.label}</div>
                  <div className={`text-2xl font-bold mb-2 ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                    {day.day}
                  </div>
                  {hasEntries ? (
                    <div className="text-sm font-semibold text-green-600">{dayHours}h</div>
                  ) : (
                    <div className="text-xs text-gray-400">No entry</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      )}

      {/* Time Entries List */}
      {!isLoading && !error && (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Recent Entries</h3>
        <AnimatePresence mode="popLayout">
          {entries.map((entry, index) => (
            <TimeEntryCard key={entry.id} entry={entry} index={index} />
          ))}
        </AnimatePresence>
      </div>
      )}

      {/* Actions */}
      {!isLoading && !error && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3"
      >
        <button 
          onClick={handleSubmitTimesheet}
          disabled={submitMutation.isPending || entries.filter(e => e.status === 'draft').length === 0}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit Timesheet
        </button>
        <button 
          onClick={() => setShowPTOModal(true)}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Request PTO
        </button>
      </motion.div>
      )}

      <ApproveTimesheetModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onSuccess={() => refetch()}
        timesheetId="current-week"
        employeeName="Current User"
        entries={entries}
      />

      <CreateTimeEntryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => {
          createMutation.mutate({
            ...data,
          });
        }}
        isSubmitting={createMutation.isPending}
        selectedDate={selectedDate || undefined}
      />

      <RequestPTOModal
        isOpen={showPTOModal}
        onClose={() => setShowPTOModal(false)}
        onSubmit={(data) => {
          requestPTOMutation.mutate({
            startDate: data.startDate,
            endDate: data.endDate,
            hours: data.hours,
            ptoType: data.ptoType as 'vacation' | 'sick' | 'personal',
            notes: data.reason,
          });
        }}
        isSubmitting={requestPTOMutation.isPending}
      />
    </div>
  );
}

// Stats Card Component
function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  delay, 
  pulse 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  color: string; 
  delay: number; 
  pulse?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <motion.div
            animate={pulse ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className="w-6 h-6" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Time Entry Card Component
function TimeEntryCard({ entry, index }: { entry: TimeEntry; index: number }) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
  };

  const statusIcons = {
    draft: Clock,
    submitted: AlertCircle,
    approved: CheckCircle2,
  };

  const StatusIcon = statusIcons[entry.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-lg">
            {entry.hours}h
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-semibold text-gray-900">
                {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              {entry.projectCode && (
                <span className="text-xs font-mono px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {entry.projectCode}
                </span>
              )}
            </div>
            {entry.notes && (
              <p className="text-sm text-gray-600">{entry.notes}</p>
            )}
          </div>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${statusColors[entry.status]}`}>
          <StatusIcon className="w-4 h-4" />
          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
        </div>
      </div>
    </motion.div>
  );
}
