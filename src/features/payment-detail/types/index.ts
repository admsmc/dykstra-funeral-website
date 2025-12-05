export type PaymentStatus = 
  | 'succeeded' 
  | 'pending' 
  | 'processing' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export type PaymentMethod = 
  | 'credit_card' 
  | 'debit_card' 
  | 'ach' 
  | 'check' 
  | 'cash' 
  | 'insurance_assignment' 
  | 'payment_plan';

export interface PaymentAmount {
  amount: number;
  currency?: string;
}

export interface Payment {
  id: string;
  businessKey: string;
  caseId: string;
  amount: PaymentAmount;
  status: PaymentStatus;
  method: PaymentMethod;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
  stripePaymentIntentId?: string | null;
  stripePaymentMethodId?: string | null;
  receiptUrl?: string | null;
  failureReason?: string | null;
  notes?: string | null;
}

export interface PaymentWithHistory {
  payment: Payment;
  history: Payment[];
}
