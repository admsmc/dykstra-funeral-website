import { Effect } from 'effect';
import type { PaymentPlanPort, PaymentPlanResult, PaymentPlanError, PaymentFrequency, Installment } from '@dykstra/application';
import { prisma } from '../../database/prisma-client';
import { decimalToNumber } from '../../utils/type-converters';

/**
 * Calculate installment due dates based on frequency
 */
function calculateDueDates(startDate: Date, frequency: PaymentFrequency, count: number): Date[] {
  const dates: Date[] = [];
  
  for (let i = 0; i < count; i++) {
    const dueDate = new Date(startDate);
    
    switch (frequency) {
      case 'WEEKLY':
        dueDate.setDate(startDate.getDate() + (i * 7));
        break;
      case 'BI_WEEKLY':
        dueDate.setDate(startDate.getDate() + (i * 14));
        break;
      case 'MONTHLY':
        dueDate.setMonth(startDate.getMonth() + i);
        break;
      case 'QUARTERLY':
        dueDate.setMonth(startDate.getMonth() + (i * 3));
        break;
    }
    
    dates.push(dueDate);
  }
  
  return dates;
}

/**
 * Prisma implementation of PaymentPlanPort
 */
export class PrismaPaymentPlanAdapter implements PaymentPlanPort {
  /**
   * Create a payment plan
   */
  readonly createPlan = (params: {
    caseId: string;
    totalAmount: number;
    downPayment: number;
    numberOfInstallments: number;
    frequency: PaymentFrequency;
    startDate: Date;
    userId: string;
  }): Effect.Effect<PaymentPlanResult, PaymentPlanError> =>
    Effect.tryPromise({
      try: async () => {
        const remainingBalance = params.totalAmount - params.downPayment;
        const installmentAmount = remainingBalance / params.numberOfInstallments;
        const dueDates = calculateDueDates(params.startDate, params.frequency, params.numberOfInstallments);

        // Create payment plan with installments in a transaction
        const result = await prisma.$transaction(async (tx: any) => {
          const plan = await tx.paymentPlan.create({
            data: {
              caseId: params.caseId,
              totalAmount: params.totalAmount,
              downPayment: params.downPayment,
              remainingBalance,
              frequency: params.frequency,
              numberOfInstallments: params.numberOfInstallments,
              status: 'ACTIVE',
              createdById: params.userId,
            },
          });

          const installments = await Promise.all(
            dueDates.map((dueDate, index) =>
              tx.paymentPlanInstallment.create({
                data: {
                  paymentPlanId: plan.id,
                  installmentNumber: index + 1,
                  amount: installmentAmount,
                  dueDate,
                  status: 'PENDING',
                },
              })
            )
          );

          return { plan, installments };
        });

        return {
          paymentPlanId: result.plan.id,
          installments: result.installments.map((inst: any) => ({
            installmentNumber: inst.installmentNumber,
            amount: inst.amount,
            dueDate: inst.dueDate,
            status: inst.status,
          })),
        };
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to create payment plan';
        return new (class extends Error implements PaymentPlanError {
          readonly _tag = 'PaymentPlanError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });

  /**
   * Get payment plan details
   */
  readonly getPlan = (
    planId: string
  ): Effect.Effect<
    {
      id: string;
      caseId: string;
      totalAmount: number;
      remainingBalance: number;
      installments: Installment[];
      status: string;
    },
    PaymentPlanError
  > =>
    Effect.tryPromise({
      try: async () => {
        const plan = await prisma.paymentPlan.findUnique({
          where: { id: planId },
          include: {
            installments: {
              orderBy: { installmentNumber: 'asc' },
            },
          },
        });

        if (!plan) {
          throw new Error(`Payment plan ${planId} not found`);
        }

        return {
          id: plan.id,
          caseId: plan.caseId,
          totalAmount: decimalToNumber(plan.totalAmount),
          remainingBalance: decimalToNumber(plan.remainingBalance),
          status: plan.status,
          installments: plan.installments.map((inst: any) => ({
            installmentNumber: inst.installmentNumber,
            amount: decimalToNumber(inst.amount),
            dueDate: inst.dueDate,
            status: inst.status,
          })),
        };
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to get payment plan';
        return new (class extends Error implements PaymentPlanError {
          readonly _tag = 'PaymentPlanError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });

  /**
   * Process an installment payment
   */
  readonly processInstallment = (params: {
    planId: string;
    installmentNumber: number;
    amount: number;
    paymentMethod: string;
  }): Effect.Effect<void, PaymentPlanError> =>
    Effect.tryPromise({
      try: async () => {
        await prisma.$transaction(async (tx: any) => {
          // Find the installment
          const installment = await tx.paymentPlanInstallment.findFirst({
            where: {
              paymentPlanId: params.planId,
              installmentNumber: params.installmentNumber,
            },
          });

          if (!installment) {
            throw new Error(`Installment ${params.installmentNumber} not found for plan ${params.planId}`);
          }

          // Update installment status
          await tx.paymentPlanInstallment.update({
            where: { id: installment.id },
            data: {
              status: 'PAID',
              paidDate: new Date(),
              paidAmount: params.amount,
            },
          });

          // Update payment plan remaining balance
          const plan = await tx.paymentPlan.findUnique({
            where: { id: params.planId },
          });

          if (!plan) {
            throw new Error(`Payment plan ${params.planId} not found`);
          }

          const newRemainingBalance = Math.max(0, plan.remainingBalance - params.amount);

          await tx.paymentPlan.update({
            where: { id: params.planId },
            data: {
              remainingBalance: newRemainingBalance,
              status: newRemainingBalance === 0 ? 'COMPLETED' : plan.status,
            },
          });
        });
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to process installment payment';
        return new (class extends Error implements PaymentPlanError {
          readonly _tag = 'PaymentPlanError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });

  /**
   * Cancel a payment plan
   */
  readonly cancelPlan = (planId: string, _reason: string): Effect.Effect<void, PaymentPlanError> =>
    Effect.tryPromise({
      try: async () => {
        // Note: cancellationReason and cancelledAt fields don't exist in schema
        await prisma.paymentPlan.update({
          where: { id: planId },
          data: {
            status: 'CANCELLED',
          },
        });
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to cancel payment plan';
        return new (class extends Error implements PaymentPlanError {
          readonly _tag = 'PaymentPlanError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });
}

/**
 * Create Prisma Payment Plan Adapter instance
 */
export function createPrismaPaymentPlanAdapter(): PaymentPlanPort {
  return new PrismaPaymentPlanAdapter();
}
