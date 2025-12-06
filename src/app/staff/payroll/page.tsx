'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, Calendar, FileText, Download, Play, CheckCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { RunPayrollModal } from './_components/RunPayrollModal';
import { useModalKeyboardShortcuts } from '@/hooks/useModalKeyboardShortcuts';

/**
 * Payroll Management Page - Linear/Notion Style
 * Process payroll with time entries from case management
 * 
 * Features:
 * - Payroll run management
 * - Pay period tracking
 * - Employee payroll summary
 * - Direct deposit status
 * - GL posting integration
 */

interface PayrollRun {
  id: string;
  period: string;
  status: 'draft' | 'processing' | 'approved' | 'paid';
  employees: number;
  totalGross: number;
  totalNet: number;
  payDate: string;
}

interface Employee {
  name: string;
  hours: number;
  rate: number;
  gross: number;
  deductions: number;
  net: number;
}

export default function PayrollPage() {
  const [showRunPayrollModal, setShowRunPayrollModal] = useState(false);

  // Keyboard shortcuts
  useModalKeyboardShortcuts({
    onRunPayroll: () => setShowRunPayrollModal(true),
  });
  
  // Fetch payroll runs from API
  const { data: payrollRuns = [], isLoading, error, refetch } = trpc.payroll.list.useQuery({
    status: 'all',
  });

  // Fetch employees for selected run
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const { data: employees = [] } = trpc.payroll.getEmployees.useQuery(
    { payrollRunId: selectedRun?.id || '' },
    { enabled: !!selectedRun }
  );

  // Set selected run when data loads
  if (!selectedRun && payrollRuns.length > 0) {
    setSelectedRun(payrollRuns[0]);
  }

  const totalEmployees = selectedRun?.employees || 12;
  const currentGross = selectedRun?.totalGross || 42500;
  const currentNet = selectedRun?.totalNet || 31800;
  const totalDeductions = currentGross - currentNet;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900">Payroll Management</h1>
        <p className="text-lg text-gray-600">Process payroll with time entries from case management</p>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading payroll data...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load payroll data. Please try again.
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Employees" value={totalEmployees.toString()} color="indigo" delay={0} />
        <StatsCard icon={DollarSign} label="Gross Payroll" value={`$${(currentGross / 1000).toFixed(1)}K`} color="green" delay={0.1} />
        <StatsCard icon={FileText} label="Deductions" value={`$${(totalDeductions / 1000).toFixed(1)}K`} color="amber" delay={0.2} />
        <StatsCard icon={CheckCircle} label="Net Pay" value={`$${(currentNet / 1000).toFixed(1)}K`} color="blue" delay={0.3} />
      </div>
      )}

      {/* Payroll Runs */}
      {!isLoading && !error && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Payroll Runs</h2>
          <button
            onClick={() => setShowRunPayrollModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            Run Payroll
          </button>
        </div>

        <div className="space-y-3">
          {payrollRuns.map((run, index) => (
            <PayrollRunCard
              key={run.id}
              run={run}
              isSelected={selectedRun?.id === run.id}
              onClick={() => setSelectedRun(run)}
              index={index}
            />
          ))}
        </div>
      </motion.div>
      )}

      {/* Employee Details for Selected Run */}
      {!isLoading && !error && selectedRun && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Employee Details</h2>
            <p className="text-sm text-gray-600 mt-1">{selectedRun.period} • {selectedRun.employees} employees</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Employee</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Hours</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Rate</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Gross</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Deductions</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <motion.tr
                  key={employee.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{employee.name}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">{employee.hours}h</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900">${employee.rate}/hr</td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">${employee.gross.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right text-amber-600">${employee.deductions.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">${employee.net.toLocaleString()}</td>
                </motion.tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td className="py-3 px-4 text-sm font-semibold text-gray-900">Total</td>
                <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                  {employees.reduce((sum, e) => sum + e.hours, 0)}h
                </td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                  ${employees.reduce((sum, e) => sum + e.gross, 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-sm text-right font-semibold text-amber-600">
                  ${employees.reduce((sum, e) => sum + e.deductions, 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                  ${employees.reduce((sum, e) => sum + e.net, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
      )}

      <RunPayrollModal
        isOpen={showRunPayrollModal}
        onClose={() => setShowRunPayrollModal(false)}
        onSuccess={() => refetch()}
      />
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

function PayrollRunCard({ run, isSelected, onClick, index }: any) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-amber-100 text-amber-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.45 + index * 0.05 }}
      onClick={onClick}
      className={`border rounded-lg p-4 cursor-pointer transition ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900">{run.id}</h3>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${getStatusColor(run.status)}`}>
              {getStatusIcon(run.status)}
              {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Period</p>
              <p className="text-gray-900 font-medium">{run.period}</p>
            </div>
            <div>
              <p className="text-gray-500">Employees</p>
              <p className="text-gray-900">{run.employees}</p>
            </div>
            <div>
              <p className="text-gray-500">Gross</p>
              <p className="text-gray-900">${run.totalGross.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Net</p>
              <p className="text-green-600 font-medium">${run.totalNet.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <Calendar className="w-5 h-5 text-gray-400 ml-4" />
      </div>
    </motion.div>
  );
}
