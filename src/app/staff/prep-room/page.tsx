'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertTriangle, Plus, Search, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Prep Room Management Page - Linear/Notion Style
 * Visual schedule and reservation management for preparation rooms
 * 
 * Features:
 * - Timeline view of room reservations
 * - Check-in/check-out tracking
 * - Conflict detection and resolution
 * - Room availability status
 * - Case linkage for labor costing
 */

interface Reservation {
  id: string;
  room: string;
  caseId: string;
  decedentName: string;
  embalmer: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'conflict';
  duration: number; // in hours
}

const ROOMS = ['Prep Room 1', 'Prep Room 2'];

export default function PrepRoomPage() {
  const [selectedDate, setSelectedDate] = useState('2024-12-05');
  const [selectedRoom, setSelectedRoom] = useState<string | 'all'>('all');

  // Fetch reservations from API
  const { data: allReservations = [], isLoading, error } = trpc.prepRoom.list.useQuery({
    date: selectedDate,
    status: 'all',
  });

  const filteredReservations = allReservations.filter(r => {
    if (selectedRoom === 'all') return true;
    return r.room === selectedRoom;
  });

  const totalReservations = allReservations.length;
  const inProgressCount = allReservations.filter(r => r.status === 'in-progress').length;
  const scheduledCount = allReservations.filter(r => r.status === 'scheduled').length;
  const conflictCount = allReservations.filter(r => r.status === 'conflict').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900">Prep Room Management</h1>
        <p className="text-lg text-gray-600">Schedule and manage preparation room reservations</p>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading reservations...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load reservations. Please try again.
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Calendar} label="Total Reservations" value={totalReservations.toString()} color="indigo" delay={0} />
        <StatsCard icon={Clock} label="In Progress" value={inProgressCount.toString()} color="blue" delay={0.1} />
        <StatsCard icon={CheckCircle} label="Scheduled" value={scheduledCount.toString()} color="green" delay={0.2} />
        <StatsCard icon={AlertTriangle} label="Conflicts" value={conflictCount.toString()} color="red" delay={0.3} />
      </div>
      )}

      {/* Controls */}
      {!isLoading && !error && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Rooms</option>
            {ROOMS.map(room => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
          <Plus className="w-4 h-4" />
          Reserve Room
        </button>
      </motion.div>

      {/* Room Schedule Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Room Schedule - December 5, 2024</h2>

        <div className="space-y-6">
          {ROOMS.map((room, roomIndex) => (
            <div key={room} className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900">{room}</h3>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                  {allReservations.filter(r => r.room === room).length} reservations
                </span>
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Time markers */}
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>8 AM</span>
                  <span>10 AM</span>
                  <span>12 PM</span>
                  <span>2 PM</span>
                  <span>4 PM</span>
                  <span>6 PM</span>
                </div>

                {/* Timeline bar */}
                <div className="relative h-20 bg-gray-50 rounded-lg border border-gray-200">
                  {allReservations
                    .filter(r => r.room === room && (selectedRoom === 'all' || selectedRoom === room))
                    .map((reservation, index) => (
                      <ReservationBlock
                        key={reservation.id}
                        reservation={reservation}
                        index={index}
                      />
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      )}

      {/* Reservation List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Reservation Details</h2>

        <div className="space-y-3">
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reservations found</p>
            </div>
          ) : (
            filteredReservations.map((reservation, index) => (
              <ReservationCard key={reservation.id} reservation={reservation} index={index} />
            ))
          )}
        </div>
      </motion.div>
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

function ReservationBlock({ reservation, index }: { reservation: Reservation; index: number }) {
  // Calculate position based on time (8 AM = 0%, 6 PM = 100%)
  const startHour = parseInt(reservation.startTime.split(' ')[1].split(':')[0]);
  const startMinute = parseInt(reservation.startTime.split(' ')[1].split(':')[1]);
  const startPercent = ((startHour - 8) * 60 + startMinute) / (10 * 60) * 100;
  const widthPercent = (reservation.duration / 10) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'bg-blue-500 border-blue-600';
      case 'completed': return 'bg-green-500 border-green-600';
      case 'conflict': return 'bg-red-500 border-red-600';
      default: return 'bg-indigo-500 border-indigo-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
      className={`absolute top-2 h-16 rounded border-2 ${getStatusColor(reservation.status)} text-white p-2 cursor-pointer hover:shadow-lg transition`}
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
      }}
    >
      <div className="text-xs font-semibold truncate">{reservation.decedentName}</div>
      <div className="text-xs opacity-90 truncate">{reservation.embalmer}</div>
      <div className="text-xs opacity-75">{reservation.startTime.split(' ')[1]} - {reservation.endTime.split(' ')[1]}</div>
    </motion.div>
  );
}

function ReservationCard({ reservation, index }: { reservation: Reservation; index: number }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'conflict': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Calendar className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'conflict': return 'bg-red-100 text-red-800';
      default: return 'bg-indigo-100 text-indigo-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'conflict': return 'Conflict';
      default: return 'Scheduled';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.65 + index * 0.05 }}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon(reservation.status)}
            <h3 className="font-semibold text-gray-900">{reservation.decedentName}</h3>
            <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(reservation.status)}`}>
              {getStatusLabel(reservation.status)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Case ID</p>
              <p className="text-indigo-600 font-medium">{reservation.caseId}</p>
            </div>
            <div>
              <p className="text-gray-500">Room</p>
              <p className="text-gray-900">{reservation.room}</p>
            </div>
            <div>
              <p className="text-gray-500">Embalmer</p>
              <p className="text-gray-900">{reservation.embalmer}</p>
            </div>
            <div>
              <p className="text-gray-500">Time</p>
              <p className="text-gray-900">{reservation.startTime.split(' ')[1]} - {reservation.endTime.split(' ')[1]}</p>
            </div>
          </div>
        </div>

        <div className="ml-4 flex gap-2">
          {reservation.status === 'scheduled' && (
            <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Check In
            </button>
          )}
          {reservation.status === 'in-progress' && (
            <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Check Out
            </button>
          )}
          {reservation.status === 'conflict' && (
            <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              Resolve
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
