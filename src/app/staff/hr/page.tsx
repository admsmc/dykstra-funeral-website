'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Mail, Phone, Calendar, Briefcase, Award, Plus, Search, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * HR & Employee Management Page - Linear/Notion Style
 * Employee directory and HR workflows
 * 
 * Features:
 * - Employee directory with cards
 * - Department and role filtering
 * - Onboarding/offboarding workflows
 * - Employee details
 * - Performance tracking
 */

interface Employee {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  hireDate: string;
  status: 'active' | 'onboarding' | 'offboarding' | 'inactive';
  licenseLevel?: string;
}


const DEPARTMENTS = ['all', 'Operations', 'Finance', 'Admin'];

export default function HRPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'Operations' | 'Finance' | 'Admin'>('all');

  // Fetch employees from API
  const { data: employees = [], isLoading, error } = trpc.staff.employees.list.useQuery({
    status: 'all',
    department: departmentFilter,
  });

  // Filter by search query (client-side)
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const onboardingCount = employees.filter(e => e.status === 'onboarding').length;
  const offboardingCount = employees.filter(e => e.status === 'offboarding').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900">HR & Employee Management</h1>
        <p className="text-lg text-gray-600">Manage employee directory and HR workflows</p>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading employees...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load employees. Please try again.
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Total Employees" value={totalEmployees.toString()} color="indigo" delay={0} />
        <StatsCard icon={Briefcase} label="Active" value={activeEmployees.toString()} color="green" delay={0.1} />
        <StatsCard icon={User} label="Onboarding" value={onboardingCount.toString()} color="blue" delay={0.2} />
        <StatsCard icon={Calendar} label="Offboarding" value={offboardingCount.toString()} color="red" delay={0.3} />
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept as typeof departmentFilter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  departmentFilter === dept
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {dept === 'all' ? 'All' : dept}
              </button>
            ))}
          </div>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </motion.div>
      )}

      {/* Employee Directory */}
      {!isLoading && !error && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {filteredEmployees.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No employees found</p>
          </div>
        ) : (
          filteredEmployees.map((employee, index) => (
            <EmployeeCard key={employee.id} employee={employee} index={index} />
          ))
        )}
      </motion.div>
      )}
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, delay }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
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

function EmployeeCard({ employee, index }: { employee: Employee; index: number }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'onboarding': return 'bg-blue-100 text-blue-800';
      case 'offboarding': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getActionButton = () => {
    switch (employee.status) {
      case 'onboarding':
        return (
          <button className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Continue Onboarding
          </button>
        );
      case 'offboarding':
        return (
          <button className="w-full px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            Complete Offboarding
          </button>
        );
      default:
        return (
          <button className="w-full px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
            View Details
          </button>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.55 + index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:shadow-md transition"
    >
      <div className="space-y-4">
        {/* Avatar & Name */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{employee.name}</h3>
              <p className="text-sm text-gray-600">{employee.title}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(employee.status)}`}>
            {getStatusLabel(employee.status)}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase className="w-4 h-4" />
            {employee.department}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" />
            {employee.phone}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            Hired: {new Date(employee.hireDate).toLocaleDateString()}
          </div>
          {employee.licenseLevel && (
            <div className="flex items-center gap-2 text-gray-600">
              <Award className="w-4 h-4" />
              License: {employee.licenseLevel}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {getActionButton()}
        </div>
      </div>
    </motion.div>
  );
}
