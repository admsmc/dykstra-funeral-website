import { z } from 'zod';
import { router, staffProcedure } from '../trpc';

/**
 * Refunds Router
 * Handles refund processing and tracking
 */
export const refundsRouter = router({
  /**
   * List refunds with filters
   */
  list: staffProcedure
    .input(
      z.object({
        status: z.enum(['all', 'pending', 'approved', 'rejected', 'processed']).default('all'),
        funeralHomeId: z.string(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock refunds data - will be replaced with real backend
      const allRefunds = [
        {
          id: 'ref-001',
          refundNumber: 'REF-2024-001',
          caseId: 'case-001',
          caseName: 'Smith Family',
          originalPaymentId: 'pay-001',
          amount: 500.00,
          reason: 'Overpayment',
          requestedBy: 'Sarah Johnson',
          requestedDate: '2024-11-15',
          status: 'pending' as const,
          method: 'original_payment_method' as const,
        },
        {
          id: 'ref-002',
          refundNumber: 'REF-2024-002',
          caseId: 'case-002',
          caseName: 'Johnson Estate',
          originalPaymentId: 'pay-045',
          amount: 1200.00,
          reason: 'Service cancellation',
          requestedBy: 'Michael Chen',
          requestedDate: '2024-11-10',
          processedDate: '2024-11-12',
          status: 'processed' as const,
          method: 'check' as const,
        },
        {
          id: 'ref-003',
          refundNumber: 'REF-2024-003',
          caseId: 'case-003',
          caseName: 'Williams Family',
          originalPaymentId: 'pay-078',
          amount: 350.00,
          reason: 'Duplicate payment',
          requestedBy: 'Sarah Johnson',
          requestedDate: '2024-11-20',
          status: 'approved' as const,
          method: 'ach' as const,
        },
      ];

      let filtered = allRefunds;

      if (input.status !== 'all') {
        filtered = filtered.filter(r => r.status === input.status);
      }

      if (input.dateFrom) {
        filtered = filtered.filter(r => new Date(r.requestedDate) >= input.dateFrom!);
      }

      if (input.dateTo) {
        filtered = filtered.filter(r => new Date(r.requestedDate) <= input.dateTo!);
      }

      return filtered;
    }),

  /**
   * Create refund request
   */
  create: staffProcedure
    .input(
      z.object({
        paymentId: z.string(),
        amount: z.number().positive(),
        reason: z.string().min(1),
        method: z.enum(['original_payment_method', 'check', 'ach']),
        funeralHomeId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation
      return {
        id: `ref-${Date.now()}`,
        refundNumber: `REF-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        ...input,
        status: 'pending' as const,
        requestedBy: ctx.user.name || 'Unknown',
        requestedDate: new Date(),
      };
    }),

  /**
   * Process refund (approve/reject)
   */
  process: staffProcedure
    .input(
      z.object({
        refundId: z.string(),
        action: z.enum(['approve', 'reject']),
        notes: z.string().optional(),
        funeralHomeId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation
      return {
        refundId: input.refundId,
        status: input.action === 'approve' ? 'approved' : 'rejected',
        processedBy: ctx.user.name || 'Unknown',
        processedDate: new Date(),
        notes: input.notes,
      };
    }),
});
