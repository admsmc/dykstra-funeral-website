'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Star, DollarSign, TrendingUp, Package, Plus, Loader2, Download } from 'lucide-react';
import { api } from '@/trpc/react';
import { AddSupplierModal } from '../_components/AddSupplierModal';
import { useModalKeyboardShortcuts } from '@/hooks/useModalKeyboardShortcuts';
import { exportSuppliers } from '@/lib/csv-export';

/**
 * Supplier Management Page - Linear/Notion Style
 * Uses: Use Case 5.6 - Vendor Master Data Management
 */

interface Supplier {
  id: string;
  name: string;
  category: string;
  rating: number;
  totalSpend: number;
  orders: number;
  status: 'active' | 'inactive';
}

export default function SuppliersPage() {
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const { data: suppliers = [], isLoading, error, refetch } = api.financial.procurement.listSuppliers.useQuery({ status: 'all' });

  // Keyboard shortcuts
  useModalKeyboardShortcuts({
    onSupplier: () => setShowAddSupplier(true),
  });
  const totalSpend = suppliers.reduce((sum, s) => sum + s.totalSpend, 0);
  const avgRating = suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length;

  return (
    <div className="space-y-8">
      {isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><span className="ml-3">Loading suppliers...</span></div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Failed to load suppliers.</div>}
      {!isLoading && !error && (
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div><h1 className="text-4xl font-bold text-gray-900">Suppliers</h1><p className="text-lg text-gray-600 mt-2">Manage vendor relationships</p></div>
        <div className="flex gap-3">
          <button onClick={() => exportSuppliers(suppliers)} disabled={suppliers.length === 0} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"><Download className="w-5 h-5" />Export</button>
          <button onClick={() => setShowAddSupplier(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"><Plus className="w-5 h-5" />Add Supplier</button>
        </div>
      </motion.div>
      )}

      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Building2} label="Suppliers" value={suppliers.length.toString()} color="indigo" />
        <StatsCard icon={DollarSign} label="Total Spend" value={`$${(totalSpend / 1000).toFixed(0)}K`} color="green" />
        <StatsCard icon={Star} label="Avg Rating" value={avgRating.toFixed(1)} color="amber" />
        <StatsCard icon={Package} label="Orders YTD" value={suppliers.reduce((sum, s) => sum + s.orders, 0).toString()} color="blue" />
      </div>
      )}

      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {suppliers.map((supplier, idx) => (
            <SupplierCard key={supplier.id} supplier={supplier} index={idx} />
          ))}
        </AnimatePresence>
      </div>
      )}

      <AddSupplierModal
        isOpen={showAddSupplier}
        onClose={() => setShowAddSupplier(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = { indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-green-50 text-green-600', amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600' };
  return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm font-medium text-gray-600">{label}</p><p className="text-3xl font-bold text-gray-900 mt-2">{value}</p></div><div className={`p-3 rounded-xl ${colors[color]}`}><Icon className="w-6 h-6" /></div></div></motion.div>;
}

function SupplierCard({ supplier, index }: { supplier: Supplier; index: number }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
      <div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center"><Building2 className="w-6 h-6 text-indigo-600" /></div><div><h3 className="font-bold text-gray-900">{supplier.name}</h3><p className="text-sm text-gray-600">{supplier.category}</p></div></div><div className="flex items-center gap-1 text-amber-500"><Star className="w-4 h-4 fill-current" /><span className="font-semibold">{supplier.rating}</span></div></div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100"><div><p className="text-xs text-gray-500">Total Spend</p><p className="text-lg font-bold text-gray-900">${supplier.totalSpend.toLocaleString()}</p></div><div><p className="text-xs text-gray-500">Orders</p><p className="text-lg font-bold text-gray-900">{supplier.orders}</p></div></div>
    </motion.div>
  );
}
