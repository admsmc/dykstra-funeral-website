'use client';

import { useState } from 'react';
import { CheckSquare, AlertTriangle, Search, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';
import { ThreeWayMatchVerification, type ThreeWayMatchData } from '@/components/ThreeWayMatchVerification';
import { SplitScreenSkeleton } from '@/components/skeletons/FinancialSkeletons';

/**
 * Bill Approval Workflow Page
 * 
 * Approve/reject vendor bills with:
 * - List of pending bills
 * - 3-way match verification
 * - Variance highlighting
 * - Approval notes
 */

export default function BillApprovalsPage() {
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Query bills
  const { data: bills, isLoading, error, refetch } = api.financial.ap.listBills.useQuery({
    status: 'pending',
    funeralHomeId: 'fh-001',
  });

  // Approve mutation
  const approveBill = api.financial.ap.approveBill.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedBillId(null);
      setApprovalNotes('');
    },
  });

  // Filter bills by search
  const filteredBills = bills?.filter(bill => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      bill.billNumber.toLowerCase().includes(search) ||
      bill.vendor.toLowerCase().includes(search) ||
      bill.poNumber.toLowerCase().includes(search)
    );
  }) || [];

  // Mock 3-way match data generator
  const generateMatchData = (billId: string): ThreeWayMatchData => {
    const bill = bills?.find(b => b.id === billId);
    if (!bill) {
      return {
        poNumber: '',
        receiptNumber: '',
        invoiceNumber: '',
        vendor: '',
        poTotal: 0,
        receiptTotal: 0,
        invoiceTotal: 0,
        lineItems: [],
        overallStatus: 'rejected',
        totalVariance: 0,
        variancePercentage: 0,
      };
    }

    // Generate realistic line items based on whether bill has variance
    const hasVariance = bill.hasVariance || false;
    const lineItems = [
      {
        description: 'Mahogany Casket - Model XL',
        poQuantity: 2,
        poUnitPrice: 4500,
        poAmount: 9000,
        receiptQuantity: 2,
        invoiceQuantity: 2,
        invoiceUnitPrice: hasVariance ? 4575 : 4500,
        invoiceAmount: hasVariance ? 9150 : 9000,
        quantityVariance: 0,
        priceVariance: hasVariance ? 75 : 0,
        amountVariance: hasVariance ? 150 : 0,
        matchStatus: hasVariance ? ('within-tolerance' as const) : ('exact' as const),
      },
      {
        description: 'Bronze Nameplate',
        poQuantity: 4,
        poUnitPrice: 125,
        poAmount: 500,
        receiptQuantity: 4,
        invoiceQuantity: 4,
        invoiceUnitPrice: 125,
        invoiceAmount: 500,
        quantityVariance: 0,
        priceVariance: 0,
        amountVariance: 0,
        matchStatus: 'exact' as const,
      },
      {
        description: 'Shipping & Handling',
        poQuantity: 1,
        poUnitPrice: 3000,
        poAmount: 3000,
        receiptQuantity: 1,
        invoiceQuantity: 1,
        invoiceUnitPrice: 3000,
        invoiceAmount: 3000,
        quantityVariance: 0,
        priceVariance: 0,
        amountVariance: 0,
        matchStatus: 'exact' as const,
      },
    ];

    const poTotal = lineItems.reduce((sum, item) => sum + item.poAmount, 0);
    const receiptTotal = poTotal;
    const invoiceTotal = lineItems.reduce((sum, item) => sum + item.invoiceAmount, 0);
    const totalVariance = invoiceTotal - poTotal;
    const variancePercentage = (totalVariance / poTotal) * 100;

    return {
      poNumber: bill.poNumber,
      receiptNumber: bill.receiptNumber,
      invoiceNumber: bill.billNumber,
      vendor: bill.vendor,
      poTotal,
      receiptTotal,
      invoiceTotal,
      lineItems,
      overallStatus: Math.abs(variancePercentage) < 5 ? (hasVariance ? 'tolerance' : 'matched') : 'variance',
      totalVariance,
      variancePercentage: Math.abs(variancePercentage),
    };
  };

  // Handle approve
  const handleApprove = (billId: string) => {
    approveBill.mutate({
      billId,
      notes: approvalNotes || undefined,
      funeralHomeId: 'fh-001',
    });
  };

  // Handle reject
  const handleReject = (billId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      // TODO: Add rejectBill mutation
      alert(`Bill rejected: ${reason}`);
      setSelectedBillId(null);
    }
  };

  // Selected bill details
  const selectedBill = bills?.find(b => b.id === selectedBillId);
  const matchData = selectedBillId ? generateMatchData(selectedBillId) : null;

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare className="w-8 h-8 text-[--navy]" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-[--navy]">
                Bill Approvals
              </h1>
              <p className="text-gray-600 mt-1">
                Review and approve vendor bills pending payment
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <SplitScreenSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bills List */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search bills..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                  />
                </div>
              </div>

              {/* Bills */}
              <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
                {error ? (
                  <div className="p-8 text-center text-red-600">
                    Error loading bills
                  </div>
                ) : filteredBills.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No pending bills
                  </div>
                ) : (
                  filteredBills.map((bill) => (
                    <button
                      key={bill.id}
                      onClick={() => setSelectedBillId(bill.id)}
                      className={`
                        w-full p-4 text-left transition-colors
                        ${selectedBillId === bill.id ? 'bg-[--cream] border-l-4 border-[--navy]' : 'hover:bg-gray-50'}
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-mono text-sm text-[--navy] font-semibold">
                          {bill.billNumber}
                        </div>
                        {bill.hasVariance && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {bill.vendor}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        PO: {bill.poNumber} • Due: {formatDate(bill.dueDate)}
                      </div>
                      <div className="text-lg font-bold text-[--navy]">
                        {formatCurrency(bill.amount)}
                      </div>
                      {bill.hasVariance && bill.varianceAmount && (
                        <div className="text-xs text-orange-600 mt-1">
                          Variance: +{formatCurrency(bill.varianceAmount)}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 3-Way Match Details */}
          <div className="lg:col-span-2">
            {!selectedBill ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Select a bill to review
                </h3>
                <p className="text-gray-500">
                  Choose a bill from the list to view 3-way match verification
                </p>
              </div>
            ) : matchData ? (
              <div className="space-y-6">
                {/* 3-Way Match Component */}
                <ThreeWayMatchVerification
                  data={matchData}
                  onApprove={() => handleApprove(selectedBill.id)}
                  onReject={() => handleReject(selectedBill.id)}
                  showActions={false}
                />

                {/* Approval Notes */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes about this approval..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => handleReject(selectedBill.id)}
                    disabled={approveBill.isPending}
                    className="px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Reject Bill
                  </button>
                  <button
                    onClick={() => handleApprove(selectedBill.id)}
                    disabled={approveBill.isPending || matchData.overallStatus === 'rejected'}
                    className={`
                      px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors
                      ${
                        approveBill.isPending || matchData.overallStatus === 'rejected'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }
                    `}
                  >
                    {approveBill.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Approving...</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-5 h-5" />
                        <span>Approve for Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
