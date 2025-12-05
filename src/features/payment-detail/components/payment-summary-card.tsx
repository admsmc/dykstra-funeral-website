import { DollarSign, CreditCard, Calendar } from 'lucide-react';
import type { PaymentViewModel } from '../view-models/payment-view-model';
import { PaymentStatusBadge } from './payment-status-badge';

interface PaymentSummaryCardProps {
  payment: PaymentViewModel;
}

export function PaymentSummaryCard({ payment }: PaymentSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amount */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Amount</p>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900">
              {payment.formattedAmount}
            </span>
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
          <PaymentStatusBadge status={payment.status} config={payment.statusConfig} />
        </div>

        {/* Payment Method */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Payment Method</p>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <span className="text-lg text-gray-900">{payment.formattedMethod}</span>
          </div>
        </div>

        {/* Payment Date */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Payment Date</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-lg text-gray-900">{payment.createdDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
