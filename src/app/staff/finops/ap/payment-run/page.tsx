'use client';

import { useState, useMemo } from 'react';
import { PlayCircle, DollarSign, CheckCircle2, TrendingDown, Clock, AlertCircle, Calendar } from 'lucide-react';
import { api } from '@/trpc/react';
import { PaymentRunExecutionModal } from '@/components/modals/PaymentRunExecutionModal';

/**
 * Payment Run Page
 * 
 * Generate and execute batch AP payments with:
 * - Bill selection by due date and vendor
 * - Early payment discount calculator
 * - Batch payment execution
 * - Cash flow optimization
 */

interface BillWithDiscount {
  id: string;
  vendor: string;
  vendorId: string;
  billNumber: string;
  amount: number;
  dueDate: string;
  status: 'approved' | 'pending_approval' | 'paid';
  discountTerms?: string; // e.g., "2/10 net 30"
  discountAmount?: number;
  discountDeadline?: string;
  selected: boolean;
}

export default function PaymentRunPage() {
  const [paymentDate, setPaymentDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default 7 days from now
    return date.toISOString().split('T')[0];
  });
  
  const [availableCash, setAvailableCash] = useState<string>('100000');
  const [dueDateThreshold, setDueDateThreshold] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1); // Default 1 month out
    return date.toISOString().split('T')[0];
  });
  
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [showExecutionModal, setShowExecutionModal] = useState(false);

  // Query approved bills
  const { data: billsData, isLoading } = api.financial.ap.listBills.useQuery({
    status: 'approved',
    funeralHomeId: 'fh-001', // TODO: Get from auth context
  });

  // Mock bills with early payment discount data
  // In production, this would come from the API
  const mockBillsWithDiscounts: BillWithDiscount[] = useMemo(() => {
    if (!billsData) return [];

    return billsData.map((bill, idx) => {
      // Add discount terms to some bills (40% chance)
      const hasDiscount = idx % 5 < 2;
      const discountRate = hasDiscount ? (idx % 2 === 0 ? 0.02 : 0.01) : 0;
      const discountDays = hasDiscount ? (idx % 2 === 0 ? 10 : 15) : 0;
      
      const billDate = new Date(bill.dueDate);
      const discountDeadline = new Date(billDate);
      discountDeadline.setDate(billDate.getDate() - (30 - discountDays));

      return {
        id: bill.id,
        vendor: bill.vendor,
        vendorId: bill.vendorId,
        billNumber: bill.billNumber,
        amount: bill.amount,
        dueDate: bill.dueDate,
        status: bill.status as 'approved',
        discountTerms: hasDiscount ? `${discountRate * 100}/${discountDays} net 30` : undefined,
        discountAmount: hasDiscount ? bill.amount * discountRate : undefined,
        discountDeadline: hasDiscount ? discountDeadline.toISOString() : undefined,
        selected: false,
      };
    });
  }, [billsData]);

  // Filter bills by due date
  const filteredBills = useMemo(() => {
    return mockBillsWithDiscounts.filter(bill => {
      const dueDate = new Date(bill.dueDate);
      const threshold = new Date(dueDateThreshold);
      return dueDate <= threshold;
    });
  }, [mockBillsWithDiscounts, dueDateThreshold]);

  // Toggle bill selection
  const toggleBill = (billId: string) => {
    setSelectedBills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(billId)) {
        newSet.delete(billId);
      } else {
        newSet.add(billId);
      }
      return newSet;
    });
  };

  // Select all/none
  const selectAll = () => {
    if (selectedBills.size === filteredBills.length) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(filteredBills.map(b => b.id)));
    }
  };

  // Calculate totals
  const selectedBillsList = filteredBills.filter(b => selectedBills.has(b.id));
  const totalAmount = selectedBillsList.reduce((sum, b) => sum + b.amount, 0);
  
  // Calculate early payment discounts
  const paymentDateObj = new Date(paymentDate);
  const totalDiscounts = selectedBillsList.reduce((sum, bill) => {
    if (!bill.discountAmount || !bill.discountDeadline) return sum;
    const deadlineDate = new Date(bill.discountDeadline);
    if (paymentDateObj <= deadlineDate) {
      return sum + bill.discountAmount;
    }
    return sum;
  }, 0);

  const netPaymentAmount = totalAmount - totalDiscounts;
  const cashAvailable = parseFloat(availableCash) || 0;
  const withinCashLimit = netPaymentAmount <= cashAvailable;

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <PlayCircle className="w-8 h-8 text-[--navy]" />
              <div>
                <h1 className="text-3xl font-serif font-bold text-[--navy]">
                  Payment Run
                </h1>
                <p className="text-gray-600 mt-1">
                  Generate and execute batch AP payments with early payment discounts
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-serif font-semibold text-[--navy]">
                Payment Settings
              </h2>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Bills will be paid on this date
                </p>
              </div>

              {/* Available Cash */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Cash
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={availableCash}
                    onChange={(e) => setAvailableCash(e.target.value)}
                    min="0"
                    step="1000"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum amount available for payments
                </p>
              </div>

              {/* Due Date Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Bills Due Before
                </label>
                <input
                  type="date"
                  value={dueDateThreshold}
                  onChange={(e) => setDueDateThreshold(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only show bills due by this date
                </p>
              </div>

              {/* Summary Card */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bills Selected:</span>
                  <span className="font-semibold text-gray-900">{selectedBills.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
                </div>
                {totalDiscounts > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      Early Pay Discount:
                    </span>
                    <span className="font-semibold text-green-600">-{formatCurrency(totalDiscounts)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span className="text-[--navy]">Net Payment:</span>
                  <span className="text-[--navy]">{formatCurrency(netPaymentAmount)}</span>
                </div>
                
                {/* Cash Limit Warning */}
                {!withinCashLimit && selectedBills.size > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700">
                        Payment amount exceeds available cash by {formatCurrency(netPaymentAmount - cashAvailable)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Execute Button */}
                <button
                  onClick={() => setShowExecutionModal(true)}
                  disabled={selectedBills.size === 0 || !withinCashLimit}
                  className="w-full px-4 py-3 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  <PlayCircle className="w-5 h-5" />
                  Generate Payment Run
                </button>
              </div>
            </div>
          </div>

          {/* Bills Table */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Available Bills ({filteredBills.length})
                </h2>
                <button
                  onClick={selectAll}
                  className="text-sm text-[--navy] hover:underline"
                >
                  {selectedBills.size === filteredBills.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {isLoading ? (
                <div className="p-12 text-center">
                  <Clock className="w-8 h-8 animate-spin text-[--navy] mx-auto mb-3" />
                  <p className="text-gray-600">Loading bills...</p>
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No bills due before {formatDate(dueDateThreshold)}</p>
                  <p className="text-sm mt-1">Adjust the due date threshold to see more bills</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {filteredBills.map((bill) => {
                    const isSelected = selectedBills.has(bill.id);
                    const hasDiscount = bill.discountAmount && bill.discountDeadline;
                    const discountApplies = hasDiscount && new Date(paymentDate) <= new Date(bill.discountDeadline!);

                    return (
                      <label
                        key={bill.id}
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleBill(bill.id)}
                          className="w-5 h-5 text-[--navy] rounded"
                        />
                        
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-3">
                              <p className="font-semibold text-gray-900">{bill.vendor}</p>
                              <span className="text-sm text-gray-500">{bill.billNumber}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-[--navy]">
                                {formatCurrency(bill.amount)}
                              </p>
                              {discountApplies && (
                                <p className="text-sm text-green-600 flex items-center justify-end gap-1">
                                  <TrendingDown className="w-3 h-3" />
                                  Save {formatCurrency(bill.discountAmount!)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {formatDate(bill.dueDate)}
                            </span>
                            {hasDiscount && (
                              <span className={`flex items-center gap-1 ${discountApplies ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                <TrendingDown className="w-3 h-3" />
                                {bill.discountTerms}
                                {discountApplies && ' (Available)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Execution Modal */}
      <PaymentRunExecutionModal
        open={showExecutionModal}
        onOpenChange={setShowExecutionModal}
        bills={selectedBillsList.map(bill => ({
          billId: bill.id,
          vendor: bill.vendor,
          billNumber: bill.billNumber,
          amount: bill.amount,
          discountAmount: bill.discountAmount && new Date(paymentDate) <= new Date(bill.discountDeadline!) ? bill.discountAmount : 0,
          netAmount: bill.amount - (bill.discountAmount && new Date(paymentDate) <= new Date(bill.discountDeadline!) ? bill.discountAmount : 0),
        }))}
        paymentDate={paymentDate}
        totalAmount={totalAmount}
        totalDiscounts={totalDiscounts}
        netPaymentAmount={netPaymentAmount}
        onSuccess={(runId) => {
          console.log('Payment run created:', runId);
          // Clear selections and reset
          setSelectedBills(new Set());
        }}
      />
    </div>
  );
}
