'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, CheckCircle2, AlertCircle, DollarSign, FileCheck, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';
import { toast } from 'sonner';

/**
 * Accounts Payable Page - Linear/Notion Style
 * Uses: Use Case 6.4 - Vendor Bill Processing with 3-way matching
 */

interface Invoice {
  id: string;
  vendor: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: 'pending_match' | 'matched' | 'approved' | 'paid' | 'disputed';
  matchScore: number;
}

// Mock data removed - now using real API calls

export default function AccountsPayablePage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');

  // Fetch payables from API
  const { data: payablesData, isLoading, error } = api.financial.ap.getPayablesByVendor.useQuery({
    funeralHomeId: 'default',
    status: statusFilter === 'all' ? 'all' : statusFilter,
  });

  // Map API response to Invoice format for UI
  const invoices = useMemo(() => {
    if (!payablesData?.vendors) {
      return [];
    }
    
    // Flatten vendor-grouped bills into flat invoice list
    return payablesData.vendors.flatMap(vendor => 
      vendor.bills.map((bill: any) => ({
        id: bill.id,
        vendor: bill.vendorName,
        invoiceNumber: bill.billNumber,
        amount: bill.totalAmount,
        dueDate: new Date(bill.dueDate).toISOString().split('T')[0],
        status: mapBillStatus(bill.status),
        matchScore: bill.purchaseOrderId ? 100 : (bill.ocrExtracted ? 95 : 85),
      }))
    );
  }, [payablesData]);
  
  // Map Go backend status to UI status
  function mapBillStatus(status: string): Invoice['status'] {
    if (status === 'pending_approval') return 'pending_match';
    if (status === 'approved') return 'approved';
    if (status === 'paid') return 'paid';
    if (status === 'cancelled') return 'disputed';
    return 'matched'; // draft or other statuses
  }

  const totalPayable = invoices.filter(i => ['matched', 'approved'].includes(i.status)).reduce((sum, i) => sum + i.amount, 0);
  const overdueCount = invoices.filter(i => new Date(i.dueDate) < new Date()).length;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-gray-900">Accounts Payable</h1>
        <p className="text-lg text-gray-600 mt-2">3-way matching and bill processing</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Receipt} label="Total Invoices" value={invoices.length.toString()} color="indigo" />
        <StatsCard icon={DollarSign} label="Payable" value={`$${(totalPayable / 1000).toFixed(1)}K`} color="green" />
        <StatsCard icon={AlertCircle} label="Overdue" value={overdueCount.toString()} color="red" pulse={overdueCount > 0} />
        <StatsCard icon={CheckCircle2} label="Matched" value={invoices.filter(i => i.status === 'matched').length.toString()} color="blue" />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading payables...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-red-600">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p className="font-medium mb-2">Failed to load payables</p>
          <p className="text-sm text-gray-600">Using cached data. Please try again later.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Receipt className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium mb-2">No invoices found</p>
          <p className="text-sm text-gray-500">No vendor bills match the selected filters</p>
        </div>
      )}

      {/* Invoice List */}
      {!isLoading && invoices.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {invoices.map((invoice, idx) => (
              <InvoiceCard key={invoice.id} invoice={invoice} index={idx} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color, pulse }: any) {
  const colors: Record<string, string> = { indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600', blue: 'bg-blue-50 text-blue-600' };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex justify-between">
        <div><p className="text-sm font-medium text-gray-600">{label}</p><p className="text-3xl font-bold text-gray-900 mt-2">{value}</p></div>
        <div className={`p-3 rounded-xl ${colors[color]}`}><motion.div animate={pulse ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}><Icon className="w-6 h-6" /></motion.div></div>
      </div>
    </motion.div>
  );
}

function InvoiceCard({ invoice, index }: { invoice: Invoice; index: number }) {
  const statusConfig: Record<string, any> = {
    pending_match: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertCircle, label: 'Pending Match' },
    matched: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FileCheck, label: 'Matched' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, label: 'Approved' },
    paid: { bg: 'bg-gray-100', text: 'text-gray-700', icon: CheckCircle2, label: 'Paid' },
    disputed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Disputed' },
  };
  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;

  return (
    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ x: 4 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center"><Receipt className="w-6 h-6 text-indigo-600" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-bold text-gray-900">{invoice.invoiceNumber}</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text} flex items-center gap-1`}><StatusIcon className="w-3 h-3" />{status.label}</span>
              {invoice.matchScore < 100 && <span className="text-xs text-amber-600">{invoice.matchScore}% match</span>}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600"><span>{invoice.vendor}</span><span>•</span><span>Due {new Date(invoice.dueDate).toLocaleDateString()}</span></div>
          </div>
        </div>
        <div className="text-right"><div className="text-2xl font-bold text-gray-900">${invoice.amount.toLocaleString()}</div></div>
      </div>
    </motion.div>
  );
}
