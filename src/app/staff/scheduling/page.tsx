'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Staff Scheduling Page - Linear/Notion Style
 * Visual staff scheduler and calendar
 * 
 * Features:
 * - Weekly calendar view
 * - Staff shift assignments
 * - On-call rotation tracking
 * - Room/resource bookings
 * - Drag-and-drop scheduling (future)
 */

interface Shift {
  id: string;
  staffName: string;
  role: string;
  startTime: string;
  endTime: string;
  type: 'regular' | 'on-call' | 'service';
  location?: string | null;
}


export default function SchedulingPage() {
  const [currentWeek, setCurrentWeek] = useState('Dec 2-8, 2024');
  const [view, setView] = useState<'week' | 'day'>('week');

  // Fetch shifts from API
  const { data: allShifts = [], isLoading, error } = trpc.scheduling.list.useQuery({
    startDate: '2024-12-02',
    endDate: '2024-12-08',
    shiftType: 'all',
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Group shifts by day of week
  const scheduleByDay = days.reduce((acc, day) => {
    acc[day] = allShifts.filter(shift => shift.dayOfWeek === day);
    return acc;
  }, {} as Record<string, typeof allShifts>);

  // Calculate stats
  const totalShifts = allShifts.length;
  const onCallCount = allShifts.filter(s => s.type === 'on-call').length;
  const serviceCount = allShifts.filter(s => s.type === 'service').length;
  const staffCount = new Set(allShifts.map(s => s.staffName)).size;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900">Staff Scheduling</h1>
        <p className="text-lg text-gray-600">Manage shifts, on-call rotation, and service coverage</p>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading schedule...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load schedule. Please try again.
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Staff Scheduled" value={staffCount.toString()} color="indigo" delay={0} />
        <StatsCard icon={Calendar} label="Total Shifts" value={totalShifts.toString()} color="green" delay={0.1} />
        <StatsCard icon={Clock} label="On-Call" value={onCallCount.toString()} color="amber" delay={0.2} />
        <StatsCard icon={MapPin} label="Services" value={serviceCount.toString()} color="blue" delay={0.3} />
      </div>
      )}

      {/* Calendar Controls */}
      {!isLoading && !error && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">{currentWeek}</h2>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  view === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  view === 'day' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Day
              </button>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
              <Plus className="w-4 h-4" />
              Add Shift
            </button>
          </div>
        </div>

        {/* Weekly Calendar Grid */}
        <div className="grid grid-cols-7 gap-4">
          {days.map((day, index) => (
            <DayColumn key={day} day={day} shifts={scheduleByDay[day]} index={index} />
          ))}
        </div>
      </motion.div>
      )}

      {/* Legend */}
      {!isLoading && !error && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-6 text-sm text-gray-600"
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border-l-4 border-blue-500" />
          <span>Regular Shift</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-100 border-l-4 border-amber-500" />
          <span>On-Call</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border-l-4 border-green-500" />
          <span>Service</span>
        </div>
      </motion.div>
      )}
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, delay }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

function DayColumn({ day, shifts, index }: { day: string; shifts: Shift[]; index: number }) {
  const getShiftColor = (type: string) => {
    switch (type) {
      case 'on-call':
        return 'bg-amber-100 border-l-4 border-amber-500 text-amber-900';
      case 'service':
        return 'bg-green-100 border-l-4 border-green-500 text-green-900';
      default:
        return 'bg-blue-100 border-l-4 border-blue-500 text-blue-900';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.05 }}
      className="space-y-2"
    >
      <div className="text-center pb-3 border-b border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase">{day}</div>
        <div className="text-sm text-gray-600 mt-1">Dec {index + 2}</div>
      </div>

      <div className="space-y-2 min-h-[200px]">
        {shifts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No shifts</p>
          </div>
        ) : (
          shifts.map((shift) => (
            <motion.div
              key={shift.id}
              whileHover={{ scale: 1.02 }}
              className={`p-3 rounded-lg ${getShiftColor(shift.type)} cursor-pointer transition`}
            >
              <div className="font-semibold text-sm">{shift.staffName}</div>
              <div className="text-xs mt-1">{shift.role}</div>
              <div className="text-xs mt-1 opacity-75">
                {shift.startTime} - {shift.endTime}
              </div>
              {shift.location && (
                <div className="text-xs mt-1 flex items-center gap-1 opacity-75">
                  <MapPin className="w-3 h-3" />
                  {shift.location}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
