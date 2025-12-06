'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@dykstra/ui/components/dialog';
import { PlayCircle, CheckCircle2, TrendingDown, AlertCircle, CreditCard, Building2, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';

/**
 * Payment Run Execution Modal
 * 
 * Confirms and executes batch AP payments with:
 * - Payment method selection (ACH, Check, Wire Transfer)
 * - Final confirmation of amounts and discounts
 * - Success/error handling with celebratory UI
 * - Integration with tRPC mutation
 */

interface BillPayment {
  billId: string;
  vendor: string;
  billNumber: string;
  amount: number;
  discountAmount?: number;
  netAmount: number;
}

interface PaymentRunExecutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bills: BillPayment[];
  paymentDate: string;
  totalAmount: number;
  totalDiscounts: number;
  netPaymentAmount: number;
  onSuccess?: (runId: string) => void;
}

type PaymentMethod = 'ach' | 'check' | 'wire';

export function PaymentRunExecutionModal({
  open,
  onOpenChange,
  bills,
  paymentDate,
  totalAmount,
  totalDiscounts,
  netPaymentAmount,
  onSuccess,
}: PaymentRunExecutionModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ach');
  const [showSuccess, setShowSuccess] = useState(false);
  const [runId, setRunId] = useState<string>('');

  const executePaymentRun = api.financial.ap.executePaymentRun.useMutation({
    onSuccess: (data) => {
      // executeAPPaymentRun returns ExecuteAPPaymentRunResult with paymentRunId
      setRunId(data.paymentRunId);
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.(data.paymentRunId);
        onOpenChange(false);
        setShowSuccess(false);
      }, 2000);
    },
  });

  const handleExecute = () => {
    // Generate a temporary payment run ID
    const paymentRunId = `pr-${Date.now()}`;
    
    executePaymentRun.mutate({
      paymentRunId,
      funeralHomeId: 'fh-001', // TODO: Get from auth context
      paymentMethod,
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Success celebration screen
  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="md" className="text-center">
          <div className="py-8">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[--navy] mb-2">
              Payment Run Created!
            </h3>
            <p className="text-gray-600 mb-4">
              {bills.length} bills scheduled for payment
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-gray-600">Run ID:</span>
              <span className="text-sm font-mono font-semibold text-[--navy]">{runId}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-[--navy] flex items-center gap-2">
            <PlayCircle className="w-6 h-6" />
            Execute Payment Run
          </DialogTitle>
          <DialogDescription>
            Review and confirm batch payment execution for {bills.length} vendors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Date:</span>
              <span className="font-semibold text-gray-900">{formatDate(paymentDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Number of Bills:</span>
              <span className="font-semibold text-gray-900">{bills.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
            </div>
            {totalDiscounts > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Early Payment Discounts:
                </span>
                <span className="font-semibold text-green-600">-{formatCurrency(totalDiscounts)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
              <span className="text-[--navy]">Net Payment:</span>
              <span className="text-[--navy]">{formatCurrency(netPaymentAmount)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('ach')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'ach'
                    ? 'border-[--navy] bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Building2 className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'ach' ? 'text-[--navy]' : 'text-gray-500'}`} />
                <div className="text-sm font-semibold text-gray-900">ACH</div>
                <div className="text-xs text-gray-500 mt-1">1-2 days</div>
              </button>

              <button
                onClick={() => setPaymentMethod('check')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'check'
                    ? 'border-[--navy] bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <CreditCard className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'check' ? 'text-[--navy]' : 'text-gray-500'}`} />
                <div className="text-sm font-semibold text-gray-900">Check</div>
                <div className="text-xs text-gray-500 mt-1">Print now</div>
              </button>

              <button
                onClick={() => setPaymentMethod('wire')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'wire'
                    ? 'border-[--navy] bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Building2 className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'wire' ? 'text-[--navy]' : 'text-gray-500'}`} />
                <div className="text-sm font-semibold text-gray-900">Wire</div>
                <div className="text-xs text-gray-500 mt-1">Same day</div>
              </button>
            </div>
          </div>

          {/* Bills Preview (scrollable list) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bills to be Paid
            </label>
            <div className="border border-gray-200 rounded-lg max-h-[200px] overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {bills.map((bill) => (
                  <div key={bill.billId} className="p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{bill.vendor}</p>
                        <p className="text-xs text-gray-500">{bill.billNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">{formatCurrency(bill.netAmount)}</p>
                        {bill.discountAmount && bill.discountAmount > 0 && (
                          <p className="text-xs text-green-600">
                            -{formatCurrency(bill.discountAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {bills.length > 20 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Large payment run detected. Ensure sufficient bank balance before proceeding.
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {executePaymentRun.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  {executePaymentRun.error?.message || 'Failed to execute payment run. Please try again.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={executePaymentRun.isPending}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={executePaymentRun.isPending}
            className="px-6 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition-all disabled:bg-gray-400 flex items-center gap-2 font-medium"
          >
            {executePaymentRun.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Execute Payment Run
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
