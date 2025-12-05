'use client';

import { useState } from 'react';
import { DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';
import { BillPaymentsTableSkeleton } from '@/components/skeletons/FinancialSkeletons';

export default function BillPaymentsPage() {
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'check' | 'ach' | 'wire'>('check');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: bills, isLoading, refetch } = api.financial.ap.listBills.useQuery({
    status: 'approved',
    funeralHomeId: 'fh-001',
  });

  const payBill = api.financial.ap.payBill.useMutation({
    onSuccess: () => refetch(),
  });

  const toggleBill = (billId: string) => {
    setSelectedBills(prev =>
      prev.includes(billId) ? prev.filter(id => id !== billId) : [...prev, billId]
    );
  };

  const handlePaySelected = () => {
    selectedBills.forEach(billId => {
      const bill = bills?.find(b => b.id === billId);
      if (bill) {
        payBill.mutate({
          billId,
          vendorId: bill.vendorId,
          paymentDate: new Date(paymentDate),
          paymentMethod,
          amount: bill.amount,
          funeralHomeId: 'fh-001',
        });
      }
    });
    setSelectedBills([]);
  };

  const selectedTotal = bills?.filter(b => selectedBills.includes(b.id)).reduce((sum, b) => sum + b.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <DollarSign className="w-8 h-8 text-[--navy]" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-[--navy]">Bill Payments</h1>
            <p className="text-gray-600">Process payments for approved bills</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="font-semibold">Approved Bills</h2>
              </div>
              {isLoading ? (
                <div className="p-4">
                  <BillPaymentsTableSkeleton rows={6} />
                </div>
              ) : (
                <div className="divide-y">
                  {bills?.map(bill => (
                  <label key={bill.id} className="flex items-center p-4 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBills.includes(bill.id)}
                      onChange={() => toggleBill(bill.id)}
                      className="w-5 h-5 text-[--navy] rounded"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold">{bill.vendor}</div>
                      <div className="text-sm text-gray-600">{bill.billNumber} • Due: {new Date(bill.dueDate).toLocaleDateString()}</div>
                    </div>
                      <div className="font-bold text-[--navy]">${bill.amount.toLocaleString()}</div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="font-semibold mb-4">Payment Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="check">Check</option>
                    <option value="ach">ACH</option>
                    <option value="wire">Wire Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[--cream] border-2 border-[--navy] rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Selected Bills: {selectedBills.length}</div>
              <div className="text-3xl font-bold text-[--navy] mb-4">${selectedTotal.toLocaleString()}</div>
              <button
                onClick={handlePaySelected}
                disabled={selectedBills.length === 0 || payBill.isPending}
                className="w-full px-4 py-3 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {payBill.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Process Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
