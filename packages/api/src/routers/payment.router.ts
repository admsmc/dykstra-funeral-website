import { z } from "zod";
import { router, familyProcedure, staffProcedure } from "../trpc";
import {
  processACHPayment,
  createPaymentPlan,
  assignInsurance,
  getPaymentHistory,
  getPaymentReceipt,
  listPayments,
  getPaymentById,
  recordManualPayment,
  processRefund,
  getPaymentStats,
  getArAgingReport,
} from "@dykstra/application";
import { runEffect } from "../utils/effect-runner";
import { PaymentMethodSchema, PaymentStatusSchema } from '@dykstra/shared';

/**
 * Payment router
 */
export const paymentRouter = router({
  /**
   * Process ACH payment
   */
  processACH: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
        amount: z.number().positive(),
        accountNumber: z.string(),
        routingNumber: z.string(),
        accountHolderName: z.string(),
        accountType: z.enum(["checking", "savings"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await runEffect(
        processACHPayment({
          caseId: input.caseId,
          amount: input.amount,
          accountNumber: input.accountNumber,
          routingNumber: input.routingNumber,
          accountHolderName: input.accountHolderName,
          accountType: input.accountType,
          userId: ctx.user.id,
        })
      );

      return {
        success: result.success,
        paymentId: result.paymentId,
        status: result.status,
      };
    }),

  /**
   * Create payment plan
   */
  createPlan: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
        totalAmount: z.number().positive(),
        downPayment: z.number().nonnegative(),
        numberOfInstallments: z.number().int().min(1).max(60),
        frequency: z.enum(["WEEKLY", "BI_WEEKLY", "MONTHLY", "QUARTERLY"]),
        startDate: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await runEffect(
        createPaymentPlan({
          caseId: input.caseId,
          totalAmount: input.totalAmount,
          downPayment: input.downPayment,
          numberOfInstallments: input.numberOfInstallments,
          frequency: input.frequency,
          startDate: input.startDate,
          userId: ctx.user.id,
        })
      );

      return {
        success: result.success,
        paymentPlanId: result.paymentPlanId,
        installments: result.installments,
      };
    }),

  /**
   * Assign insurance
   */
  assignInsurance: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
        insuranceCompany: z.string(),
        policyNumber: z.string(),
        policyHolderName: z.string(),
        assignedAmount: z.number().positive(),
        claimNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await runEffect(
        assignInsurance({
          caseId: input.caseId,
          insuranceCompany: input.insuranceCompany,
          policyNumber: input.policyNumber,
          policyHolderName: input.policyHolderName,
          assignedAmount: input.assignedAmount,
          claimNumber: input.claimNumber,
          notes: input.notes,
          userId: ctx.user.id,
        })
      );

      return {
        success: result.success,
        insuranceAssignmentId: result.insuranceAssignmentId,
        status: result.status,
      };
    }),

  /**
   * Get payment history for a case
   */
  getHistory: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        getPaymentHistory({
          caseId: input.caseId,
        })
      );

      return {
        payments: result.payments,
        totalPaid: result.totalPaid,
        pendingAmount: result.pendingAmount,
      };
    }),

  /**
   * Get payment receipt
   */
  getReceipt: familyProcedure
    .input(
      z.object({
        paymentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const receipt = await runEffect(
        getPaymentReceipt({
          paymentId: input.paymentId,
        })
      );

      return {
        receiptNumber: receipt.receiptNumber,
        paymentId: receipt.paymentId,
        amount: receipt.amount,
        method: receipt.method,
        status: receipt.status,
        paidDate: receipt.paidDate,
        caseInfo: receipt.caseInfo,
        payer: receipt.payer,
        funeralHome: receipt.funeralHome,
      };
    }),

  // --- Staff-only procedures ---

  /**
   * List payments with filters and pagination (staff only)
   */
  list: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string().optional(),
        status: PaymentStatusSchema.optional(),
        method: PaymentMethodSchema.optional(),
        caseId: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      return await runEffect(
        listPayments({
          funeralHomeId,
          status: input.status,
          method: input.method,
          caseId: input.caseId,
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
          limit: input.limit,
          offset: input.offset,
        })
      );
    }),

  /**
   * Get payment by ID with version history (staff only)
   */
  getById: staffProcedure
    .input(
      z.object({
        paymentId: z.string(),
        includeHistory: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      return await runEffect(
        getPaymentById({
          paymentId: input.paymentId,
          includeHistory: input.includeHistory,
        })
      );
    }),

  /**
   * Record manual payment (staff only)
   * For cash, check, or ACH payments recorded offline
   */
  recordManual: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        amount: z.number().positive(),
        method: z.enum(['cash', 'check', 'ach']),
        checkNumber: z.string().optional(),
        paymentDate: z.date().optional(),
        notes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        recordManualPayment({
          caseId: input.caseId,
          amount: input.amount,
          method: input.method,
          checkNumber: input.checkNumber,
          paymentDate: input.paymentDate,
          notes: input.notes,
          recordedBy: ctx.user.id,
        })
      );
    }),

  /**
   * Process refund (staff only)
   */
  processRefund: staffProcedure
    .input(
      z.object({
        paymentBusinessKey: z.string(),
        refundAmount: z.number().positive().optional(),
        reason: z.string().min(1),
        notes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        processRefund({
          paymentBusinessKey: input.paymentBusinessKey,
          refundAmount: input.refundAmount,
          reason: input.reason,
          notes: input.notes,
          processedBy: ctx.user.id,
        })
      );
    }),

  /**
   * Get payment statistics (staff only)
   */
  getStats: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      return await runEffect(
        getPaymentStats({
          funeralHomeId,
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
        })
      );
    }),

  /**
   * Get AR aging report (staff only)
   */
  getArAgingReport: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string().optional(),
        asOfDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      return await runEffect(
        getArAgingReport({
          funeralHomeId,
          asOfDate: input.asOfDate,
        })
      );
    }),
});
