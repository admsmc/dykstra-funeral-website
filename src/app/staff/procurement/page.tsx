'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ShoppingCart, TruckIcon, CheckCircle2, Clock, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc-client';

/**
 * Purchase Orders Page - Linear/Notion Style
 * 
 * Modern Features:
 * - Kanban-style workflow stages
 * - Inline PO creation
 * - Real-time status tracking
 * - Quick actions and filters
 * 
 * Uses:
 * - Use Case 5.1: Purchase Order Creation
 * - Use Case 5.2: Receipt Recording
 * - Use Case 5.3: Vendor Return Processing
 */

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  items: number;
  total: number;
  status: 'draft' | 'approved' | 'ordered' | 'received' | 'closed';
  createdAt: string;
}

export default function ProcurementPage() {
  const [filter, setFilter] = useState<string>('all');
  
  // Fetch POs from API
  const { data: orders, isLoading, error } = trpc.financial.procurement.listPOs.useQuery({
    status: filter as any,
  });

  const allOrders = orders || [];
  
  const stats = {
    total: allOrders.length,
    draft: allOrders.filter(o => o.status === 'draft').length,
    pending: allOrders.filter(o => ['approved', 'ordered'].includes(o.status)).length,
    received: allOrders.filter(o => o.status === 'received').length,
  };

  const filteredOrders = filter === 'all' ? allOrders : allOrders.filter(o => o.status === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-lg text-gray-600 mt-2">Manage procurement and vendor orders</p>
        </div>
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
          <Plus className="w-5 h-5" />
          New PO
        </button>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Loading purchase orders...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load purchase orders. Please try again.
        </div>
      )}

      {/* Stats */}
      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={FileText} label="Total POs" value={stats.total.toString()} color="indigo" delay={0} />
        <StatsCard icon={Clock} label="Pending" value={stats.pending.toString()} color="amber" delay={0.1} pulse={stats.pending > 0} />
        <StatsCard icon={TruckIcon} label="In Transit" value="2" color="blue" delay={0.2} />
        <StatsCard icon={CheckCircle2} label="Received" value={stats.received.toString()} color="green" delay={0.3} />
      </div>
      )}

      {/* Filters */}
      {!isLoading && !error && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-2"
      >
        {['all', 'draft', 'approved', 'ordered', 'received'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </motion.div>
      )}

      {/* PO Cards */}
      {!isLoading && !error && (
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((po, index) => (
            <POCard key={po.id} po={po} index={index} />
          ))}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, delay, pulse }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <motion.div animate={pulse ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}>
            <Icon className="w-6 h-6" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function POCard({ po, index }: { po: PurchaseOrder; index: number }) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    approved: 'bg-blue-100 text-blue-700',
    ordered: 'bg-amber-100 text-amber-700',
    received: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  };

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
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-bold text-gray-900">{po.poNumber}</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[po.status]}`}>
                {po.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{po.vendor}</span>
              <span>•</span>
              <span>{po.items} items</span>
              <span>•</span>
              <span>{new Date(po.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">${po.total.toLocaleString()}</div>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1">View Details →</button>
        </div>
      </div>
    </motion.div>
  );
}
