import { z } from "zod";
import { router, familyProcedure } from "../trpc";
import {
  processACHPayment,
  createPaymentPlan,
  assignInsurance,
  getPaymentHistory,
  getPaymentReceipt,
} from "@dykstra/application";
import { runEffect } from "../utils/effect-runner";

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
});
