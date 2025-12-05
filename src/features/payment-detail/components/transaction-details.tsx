import { FileText } from 'lucide-react';
import type { PaymentViewModel } from '../view-models/payment-view-model';

interface TransactionDetailsProps {
  payment: PaymentViewModel;
}

export function TransactionDetails({ payment }: TransactionDetailsProps) {
  if (!payment.hasTransactionDetails) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h2>
      <div className="space-y-3">
        {payment.stripePaymentIntentId && (
          <div>
            <p className="text-sm font-medium text-gray-600">Stripe Payment Intent ID</p>
            <p className="text-sm text-gray-900 font-mono">{payment.stripePaymentIntentId}</p>
          </div>
        )}
        {payment.stripePaymentMethodId && (
          <div>
            <p className="text-sm font-medium text-gray-600">Stripe Payment Method ID</p>
            <p className="text-sm text-gray-900 font-mono">{payment.stripePaymentMethodId}</p>
          </div>
        )}
        {payment.receiptUrl && (
          <div>
            <p className="text-sm font-medium text-gray-600">Receipt URL</p>
            <a
              href={payment.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[--navy] hover:underline"
            >
              {payment.receiptUrl}
            </a>
          </div>
        )}
        {payment.failureReason && (
          <div>
            <p className="text-sm font-medium text-gray-600">Failure Reason</p>
            <p className="text-sm text-red-600">{payment.failureReason}</p>
          </div>
        )}
        {payment.notes && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-900">{payment.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
