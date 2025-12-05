import { BaseViewModel } from '@/lib/view-models/base-view-model';
import type { Payment, PaymentStatus, PaymentMethod } from '../types';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

export class PaymentViewModel extends BaseViewModel {
  constructor(private payment: Payment) {
    super();
  }

  get id(): string {
    return this.payment.id;
  }

  get businessKey(): string {
    return this.payment.businessKey;
  }

  get caseId(): string {
    return this.payment.caseId;
  }

  get amount(): number {
    return this.payment.amount.amount;
  }

  get formattedAmount(): string {
    return this.formatCurrency(this.payment.amount.amount);
  }

  get status(): PaymentStatus {
    return this.payment.status;
  }

  get formattedStatus(): string {
    return this.payment.status.toUpperCase();
  }

  get method(): PaymentMethod {
    return this.payment.method;
  }

  get formattedMethod(): string {
    const methodLabels: Record<PaymentMethod, string> = {
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      ach: 'ACH',
      check: 'Check',
      cash: 'Cash',
      insurance_assignment: 'Insurance',
      payment_plan: 'Payment Plan',
    };
    return methodLabels[this.payment.method] || this.payment.method;
  }

  get createdDate(): string {
    return this.formatDateTime(this.payment.createdAt);
  }

  get updatedDate(): string {
    return this.formatDateTime(this.payment.updatedAt);
  }

  get version(): number {
    return this.payment.version;
  }

  get statusConfig() {
    const configs: Record<
      PaymentStatus,
      { bg: string; text: string; icon: LucideIcon }
    > = {
      succeeded: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle },
      refunded: { bg: 'bg-purple-100', text: 'text-purple-800', icon: RefreshCw },
    };
    return configs[this.payment.status] || configs.pending;
  }

  get canRefund(): boolean {
    return this.payment.status === 'succeeded';
  }

  get stripePaymentIntentId(): string | null {
    return this.payment.stripePaymentIntentId || null;
  }

  get stripePaymentMethodId(): string | null {
    return this.payment.stripePaymentMethodId || null;
  }

  get receiptUrl(): string | null {
    return this.payment.receiptUrl || null;
  }

  get failureReason(): string | null {
    return this.payment.failureReason || null;
  }

  get notes(): string | null {
    return this.payment.notes || null;
  }

  get hasTransactionDetails(): boolean {
    return !!(
      this.stripePaymentIntentId ||
      this.stripePaymentMethodId ||
      this.receiptUrl ||
      this.failureReason ||
      this.notes
    );
  }

  get hasFailure(): boolean {
    return !!this.failureReason;
  }

  get hasNotes(): boolean {
    return !!this.notes;
  }
}

export class PaymentHistoryViewModel extends BaseViewModel {
  constructor(
    private history: Payment[],
    private currentPayment: Payment
  ) {
    super();
  }

  get versions(): PaymentViewModel[] {
    return this.history
      .sort((a, b) => b.version - a.version)
      .map((p) => new PaymentViewModel(p));
  }

  get totalVersions(): number {
    return this.history.length;
  }

  get hasMultipleVersions(): boolean {
    return this.history.length > 1;
  }

  isCurrentVersion(version: number): boolean {
    return version === this.currentPayment.version;
  }
}
