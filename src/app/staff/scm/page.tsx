'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TruckIcon, Package, MapPin, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Shipments/SCM Page - Linear/Notion Style
 * Supply chain and shipment tracking
 */

interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: string;
  origin: string;
  destination: string;
  status: 'in_transit' | 'delivered' | 'pending' | 'delayed';
  eta: string;
}

export default function ShipmentsPage() {
  const { data: shipments = [], isLoading, error } = trpc.shipment.list.useQuery({ status: 'all' });
  const inTransit = shipments.filter(s => s.status === 'in_transit').length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const delayed = shipments.filter(s => s.status === 'delayed').length;

  return (
    <div className="space-y-8">
      {isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><span className="ml-3">Loading shipments...</span></div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Failed to load shipments.</div>}
      {!isLoading && !error && (
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-gray-900">Shipments</h1>
        <p className="text-lg text-gray-600 mt-2">Track deliveries and logistics</p>
      </motion.div>
      )}

      {!isLoading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Package} label="Total" value={shipments.length.toString()} color="indigo" />
        <StatsCard icon={TruckIcon} label="In Transit" value={inTransit.toString()} color="blue" pulse={inTransit > 0} />
        <StatsCard icon={CheckCircle2} label="Delivered" value={delivered.toString()} color="green" />
        <StatsCard icon={AlertTriangle} label="Delayed" value={delayed.toString()} color="red" pulse={delayed > 0} />
      </div>
      )}

      {!isLoading && !error && (
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {shipments.map((shipment, idx) => (
            <ShipmentCard key={shipment.id} shipment={shipment} index={idx} />
          ))}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, pulse }: any) {
  const colors: Record<string, string> = { indigo: 'bg-indigo-50 text-indigo-600', blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600' };
  return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm font-medium text-gray-600">{label}</p><p className="text-3xl font-bold text-gray-900 mt-2">{value}</p></div><div className={`p-3 rounded-xl ${colors[color]}`}><motion.div animate={pulse ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}><Icon className="w-6 h-6" /></motion.div></div></div></motion.div>;
}

function ShipmentCard({ shipment, index }: { shipment: Shipment; index: number }) {
  const statusConfig: Record<string, any> = {
    in_transit: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Transit' },
    delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
    delayed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Delayed' },
  };
  const status = statusConfig[shipment.status];

  return (
    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ x: 4 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center"><TruckIcon className="w-6 h-6 text-indigo-600" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1"><span className="font-bold text-gray-900">{shipment.trackingNumber}</span><span className={`px-3 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text}`}>{status.label}</span></div>
            <div className="flex items-center gap-3 text-sm text-gray-600"><span>{shipment.carrier}</span><span>•</span><MapPin className="w-3 h-3" /><span>{shipment.origin} → {shipment.destination}</span></div>
          </div>
        </div>
        <div className="text-right"><div className="flex items-center gap-1 text-sm text-gray-600"><Clock className="w-4 h-4" /><span>{new Date(shipment.eta).toLocaleDateString()}</span></div></div>
      </div>
    </motion.div>
  );
}
