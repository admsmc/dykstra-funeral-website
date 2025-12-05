import { createStore } from '@/lib/store';

/**
 * Financial Transaction Store (Optimistic Updates Only)
 * 
 * Manages ONLY temporary optimistic state during payment/refund processing.
 * This store does NOT store permanent transaction data.
 * 
 * **IMPORTANT**: Real transaction data comes from tRPC queries.
 * This store only tracks optimistic transactions while API calls are in flight.
 * 
 * @example
 * ```typescript
 * // Get real transactions from tRPC
 * const { data: transactions } = trpc.payment.list.useQuery({ caseId });
 * 
 * // Use store for optimistic updates only
 * const { addOptimisticPayment, confirmPayment, rollbackPayment } = 
 *   useFinancialTransactionStore();
 * 
 * async function handlePayment(payment: Payment) {
 *   // 1. Add optimistic transaction (instant UI update)
 *   const tempId = addOptimisticPayment(payment);
 *   
 *   try {
 *     // 2. Send to backend via tRPC
 *     const result = await processPaymentMutation.mutateAsync(payment);
 *     
 *     // 3. Confirm optimistic (tRPC will auto-refetch real data)
 *     confirmPayment(tempId, result.id);
 *   } catch (error) {
 *     // 4. Rollback on error
 *     rollbackPayment(tempId);
 *   }
 * }
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Payment method types
 */
export type PaymentMethod =
  | 'cash'
  | 'check'
  | 'credit-card'
  | 'ach'
  | 'insurance'
  | 'financing';

/**
 * Transaction status
 */
export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

/**
 * Transaction type
 */
export type TransactionType = 'payment' | 'refund' | 'adjustment';

/**
 * Optimistic transaction (temporary, during API call)
 */
export interface OptimisticTransaction {
  tempId: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  caseId: string;
  timestamp: Date;
  note?: string;
}

/**
 * Refund request
 */
export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
  method: PaymentMethod;
}

/**
 * Financial transaction state (optimistic-only)
 */
interface FinancialTransactionState {
  // ONLY optimistic transactions (temporary, during API calls)
  optimisticTransactions: Map<string, OptimisticTransaction>;

  // Actions - Optimistic payments
  addOptimisticPayment: (payment: {
    amount: number;
    method: PaymentMethod;
    caseId: string;
    note?: string;
  }) => string; // Returns temporary ID

  confirmPayment: (tempId: string) => void;
  rollbackPayment: (tempId: string) => void;

  // Actions - Optimistic refunds
  addOptimisticRefund: (refund: {
    amount: number;
    method: PaymentMethod;
    caseId: string;
    note?: string;
  }) => string; // Returns temporary ID

  confirmRefund: (tempId: string) => void;
  rollbackRefund: (tempId: string) => void;

  // Queries
  getOptimisticTransactions: (caseId?: string) => OptimisticTransaction[];
  hasOptimisticTransactions: () => boolean;

  // Cleanup
  clearAll: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate temporary transaction ID for optimistic updates
 */
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create optimistic transaction
 */
function createOptimisticTransaction(
  type: TransactionType,
  amount: number,
  method: PaymentMethod,
  caseId: string,
  note?: string
): OptimisticTransaction {
  return {
    tempId: generateTempId(),
    type,
    amount,
    method,
    caseId,
    timestamp: new Date(),
    note,
  };
}

// ============================================================================
// Store
// ============================================================================

/**
 * Financial transaction store (optimistic-only)
 * 
 * Not persisted. Optimistic state is temporary and cleared on page refresh.
 * Real transaction data comes from tRPC queries.
 */
export const useFinancialTransactionStore = createStore<FinancialTransactionState>(
  'financial-transactions',
  (set, get) => ({
    // Initial state - only optimistic transactions
    optimisticTransactions: new Map(),

    // Optimistic payment
    addOptimisticPayment: (payment) => {
      const transaction = createOptimisticTransaction(
        'payment',
        payment.amount,
        payment.method,
        payment.caseId,
        payment.note
      );

      set((state) => {
        const newTransactions = new Map(state.optimisticTransactions);
        newTransactions.set(transaction.tempId, transaction);
        return { optimisticTransactions: newTransactions };
      });

      return transaction.tempId;
    },

    confirmPayment: (tempId) => {
      set((state) => {
        const newTransactions = new Map(state.optimisticTransactions);
        newTransactions.delete(tempId);
        return { optimisticTransactions: newTransactions };
      });
    },

    rollbackPayment: (tempId) => {
      set((state) => {
        const newTransactions = new Map(state.optimisticTransactions);
        newTransactions.delete(tempId);
        return { optimisticTransactions: newTransactions };
      });
    },

    // Optimistic refund
    addOptimisticRefund: (refund) => {
      const transaction = createOptimisticTransaction(
        'refund',
        refund.amount,
        refund.method,
        refund.caseId,
        refund.note
      );

      set((state) => {
        const newTransactions = new Map(state.optimisticTransactions);
        newTransactions.set(transaction.tempId, transaction);
        return { optimisticTransactions: newTransactions };
      });

      return transaction.tempId;
    },

    confirmRefund: (tempId) => {
      set((state) => {
        const newTransactions = new Map(state.optimisticTransactions);
        newTransactions.delete(tempId);
        return { optimisticTransactions: newTransactions };
      });
    },

    rollbackRefund: (tempId) => {
      set((state) => {
        const newTransactions = new Map(state.optimisticTransactions);
        newTransactions.delete(tempId);
        return { optimisticTransactions: newTransactions };
      });
    },

    // Queries
    getOptimisticTransactions: (caseId) => {
      const transactions = Array.from(get().optimisticTransactions.values());
      if (caseId) {
        return transactions.filter((t) => t.caseId === caseId);
      }
      return transactions;
    },

    hasOptimisticTransactions: () => {
      return get().optimisticTransactions.size > 0;
    },

    // Cleanup
    clearAll: () => {
      set({ optimisticTransactions: new Map() });
    },
  })
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Derived state selectors for optimal performance
 */
export const useFinancialTransactionSelectors = () => {
  const optimisticTransactions = useFinancialTransactionStore(
    (state) => state.optimisticTransactions
  );

  const transactions = Array.from(optimisticTransactions.values());

  return {
    /** All optimistic transactions as array */
    optimisticTransactions: transactions,

    /** Number of optimistic transactions */
    optimisticCount: transactions.length,

    /** Whether any optimistic transactions exist */
    hasOptimisticTransactions: transactions.length > 0,

    /** Total optimistic amount */
    optimisticTotal: transactions.reduce(
      (sum, t) => sum + (t.type === 'refund' ? -t.amount : t.amount),
      0
    ),
  };
};
