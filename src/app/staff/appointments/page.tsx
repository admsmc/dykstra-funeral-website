'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, XCircle, Phone, Mail, Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Pre-Planning Appointments Page - Linear/Notion Style
 * Schedule and manage pre-need planning appointments
 * 
 * Features:
 * - Calendar view with appointment slots
 * - Director availability checker
 * - Appointment scheduling
 * - Status tracking (scheduled, completed, cancelled)
 * - Family contact information
 */

interface Appointment {
  id: string;
  familyName: string;
  contactName: string;
  phone: string;
  email: string;
  director: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

const DIRECTORS = ['Sarah M.', 'John D.', 'Michael R.'];

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState('2024-12-05');
  const [selectedDirector, setSelectedDirector] = useState<string | 'all'>('all');

  // Fetch appointments from API
  const { data: allAppointments = [], isLoading, error } = trpc.appointment.list.useQuery({
    status: 'all',
  });

  // Filter appointments by date and director
  const filteredAppointments = allAppointments.filter(apt => {
    const matchesDate = apt.date === selectedDate;
    const matchesDirector = selectedDirector === 'all' || apt.director === selectedDirector;
    return matchesDate && matchesDirector;
  });

  const totalAppointments = allAppointments.length;
  const scheduledCount = allAppointments.filter(a => a.status === 'scheduled').length;
  const completedCount = allAppointments.filter(a => a.status === 'completed').length;
  const cancelledCount = allAppointments.filter(a => a.status === 'cancelled').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900">Pre-Planning Appointments</h1>
        <p className="text-lg text-gray-600">Schedule and manage pre-need planning consultations</p>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading appointments...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load appointments. Please try again.
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Calendar} label="Total Appointments" value={totalAppointments.toString()} color="indigo" delay={0} />
        <StatsCard icon={Clock} label="Scheduled" value={scheduledCount.toString()} color="blue" delay={0.1} />
        <StatsCard icon={CheckCircle} label="Completed" value={completedCount.toString()} color="green" delay={0.2} />
        <StatsCard icon={XCircle} label="Cancelled" value={cancelledCount.toString()} color="red" delay={0.3} />
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
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-semibold"
            />
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedDirector}
              onChange={(e) => setSelectedDirector(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Directors</option>
              {DIRECTORS.map(director => (
                <option key={director} value={director}>{director}</option>
              ))}
            </select>

            <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
              <Plus className="w-4 h-4" />
              Schedule Appointment
            </button>
          </div>
        </div>

        {/* Daily Schedule */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No appointments scheduled for this date</p>
              <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
                <Plus className="w-4 h-4" />
                Add Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment, index) => (
                <AppointmentCard key={appointment.id} appointment={appointment} index={index} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
      )}

      {/* Director Availability */}
      {!isLoading && !error && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Director Availability</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DIRECTORS.map((director, index) => (
            <DirectorAvailability key={director} director={director} date={selectedDate} appointments={allAppointments} delay={0.55 + index * 0.05} />
          ))}
        </div>
      </motion.div>
      )}
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, delay }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
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

function AppointmentCard({ appointment, index }: { appointment: Appointment; index: number }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.45 + index * 0.05 }}
      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {getStatusIcon(appointment.status)}
            <div>
              <h3 className="font-semibold text-gray-900">{appointment.familyName}</h3>
              <p className="text-sm text-gray-600">{appointment.contactName}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(appointment.status)}`}>
              {getStatusLabel(appointment.status)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm mb-3">
            <div>
              <p className="text-gray-500 mb-1">Time</p>
              <div className="flex items-center gap-1 text-gray-900">
                <Clock className="w-4 h-4" />
                {appointment.time} ({appointment.duration} min)
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Director</p>
              <div className="flex items-center gap-1 text-gray-900">
                <User className="w-4 h-4" />
                {appointment.director}
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Phone</p>
              <div className="flex items-center gap-1 text-gray-900">
                <Phone className="w-4 h-4" />
                {appointment.phone}
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Email</p>
              <div className="flex items-center gap-1 text-gray-900">
                <Mail className="w-4 h-4" />
                <span className="truncate">{appointment.email}</span>
              </div>
            </div>
          </div>

          {appointment.notes && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
              <span className="font-medium">Notes:</span> {appointment.notes}
            </div>
          )}
        </div>

        <div className="ml-4 flex gap-2">
          {appointment.status === 'scheduled' && (
            <>
              <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Complete
              </button>
              <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                Reschedule
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DirectorAvailability({ director, date, appointments: allAppointments, delay }: any) {
  // Filter appointments for this director and date
  const appointments = allAppointments.filter((a: Appointment) => a.director === director && a.date === date && a.status === 'scheduled');
  const availableSlots = 8 - appointments.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="border border-gray-200 rounded-lg p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <User className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{director}</h3>
          <p className="text-xs text-gray-500">Funeral Director</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Appointments</span>
          <span className="font-medium text-gray-900">{appointments.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Available Slots</span>
          <span className={`font-medium ${availableSlots > 3 ? 'text-green-600' : availableSlots > 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {availableSlots}
          </span>
        </div>
        <div className="pt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${availableSlots > 3 ? 'bg-green-500' : availableSlots > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${(appointments.length / 8) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
