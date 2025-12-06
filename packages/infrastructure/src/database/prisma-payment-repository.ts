import { Effect, Layer } from 'effect';
import { Payment, type PaymentId, type Money, NotFoundError } from '@dykstra/domain';
import { PaymentRepository } from '@dykstra/application';
import { PersistenceError } from '@dykstra/application';
import type { PaymentMethod, PaymentStatus } from '@dykstra/shared';
import { type PaymentMethod as PrismaPaymentMethod, type PaymentStatus as PrismaPaymentStatus } from '@prisma/client';
import { prisma } from './prisma-client';

/**
 * Map Prisma payment to domain Payment entity
 * SCD Type 2: Maps temporal fields to domain model
 */
const toDomain = (prismaPayment: any): Payment => {
  return new Payment({
    id: prismaPayment.id as PaymentId,
    businessKey: prismaPayment.businessKey,
    version: prismaPayment.version,
    caseId: prismaPayment.caseId,
    amount: {
      amount: parseFloat(prismaPayment.amount.toString()),
      currency: 'USD',
    } as Money,
    method: prismaPayment.method.toLowerCase() as PaymentMethod,
    status: prismaPayment.status.toLowerCase() as PaymentStatus,
    stripePaymentIntentId: prismaPayment.stripePaymentIntentId,
    stripePaymentMethodId: prismaPayment.stripePaymentMethodId,
    receiptUrl: prismaPayment.receiptUrl,
    failureReason: prismaPayment.failureReason,
    notes: prismaPayment.notes,
    createdAt: prismaPayment.createdAt,
    updatedAt: prismaPayment.updatedAt,
    createdBy: prismaPayment.createdBy,
  });
};

/**
 * Map domain Payment to Prisma format
 * SCD Type 2: Includes temporal fields for versioning
 */
const toPrisma = (payment: Payment, validFrom: Date = new Date()) => {
  return {
    id: payment.id,
    businessKey: payment.businessKey,
    version: payment.version,
    validFrom,
    validTo: null,                                  // New version is always current
    isCurrent: true,
    caseId: payment.caseId,
    amount: payment.amount.amount,
    method: payment.method.toUpperCase() as PrismaPaymentMethod,
    status: payment.status.toUpperCase() as PrismaPaymentStatus,
    stripePaymentIntentId: payment.stripePaymentIntentId,
    stripePaymentMethodId: payment.stripePaymentMethodId,
    receiptUrl: payment.receiptUrl,
    failureReason: payment.failureReason,
    notes: payment.notes,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    createdBy: payment.createdBy,
  };
};

/**
 * Prisma implementation of PaymentRepository with SCD Type 2 temporal support
 */
export const PrismaPaymentRepository: PaymentRepository = {
  /**
   * Find current version of payment by business key
   */
  findById: (id: PaymentId) =>
    Effect.tryPromise({
      try: async () => {
        // Try to find by technical ID first
        let prismaPayment = await prisma.payment.findUnique({
          where: { id },
        });
        
        // If not found, try business key with isCurrent=true
        if (!prismaPayment) {
          prismaPayment = await prisma.payment.findFirst({
            where: {
              businessKey: id,
              isCurrent: true,
            },
          });
        }

        if (!prismaPayment) {
          throw new NotFoundError({
            message: `Payment with ID ${id} not found`,
            entityType: 'Payment',
            entityId: id,
          });
        }

        return toDomain(prismaPayment);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find payment', error);
      },
    }),
  
  /**
   * Find payment as it existed at a specific point in time
   */
  findByIdAtTime: (businessKey: string, asOf: Date) =>
    Effect.tryPromise({
      try: async () => {
        const prismaPayment = await prisma.payment.findFirst({
          where: {
            businessKey,
            validFrom: { lte: asOf },
            OR: [
              { validTo: { gt: asOf } },
              { validTo: null },
            ],
          },
        });

        if (!prismaPayment) {
          throw new NotFoundError({
            message: `Payment ${businessKey} not found at ${asOf.toISOString()}`,
            entityType: 'Payment',
            entityId: businessKey,
          });
        }

        return toDomain(prismaPayment);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find payment at time', error);
      },
    }),
  
  /**
   * Find complete version history of a payment
   */
  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaPayments = await prisma.payment.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' },
        });

        if (prismaPayments.length === 0) {
          throw new NotFoundError({
            message: `Payment ${businessKey} not found`,
            entityType: 'Payment',
            entityId: businessKey,
          });
        }

        return prismaPayments.map(toDomain);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find payment history', error);
      },
    }),
  
  /**
   * Find current versions of payments by case
   */
  findByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaPayments = await prisma.payment.findMany({
          where: {
            caseId,
            isCurrent: true,                        // Only current versions
          },
          orderBy: { createdAt: 'desc' },
        });

        return prismaPayments.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find payments by case', error),
    }),
  
  /**
   * Save payment - SCD Type 2 implementation
   * Creates new version instead of updating existing
   */
  save: (payment: Payment) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        
        // Check if this is a new payment (version 1) or an update
        if (payment.version === 1) {
          // New payment - simple insert
          const data = toPrisma(payment, now);
          await prisma.payment.create({ data });
        } else {
          // Update - SCD Type 2 transaction
          await prisma.$transaction(async (tx: any) => {
            // Step 1: Close current version
            await tx.payment.updateMany({
              where: {
                businessKey: payment.businessKey,
                isCurrent: true,
              },
              data: {
                validTo: now,
                isCurrent: false,
              },
            });
            
            // Step 2: Insert new version
            const data = toPrisma(payment, now);
            await tx.payment.create({ data });
          });
        }
      },
      catch: (error) => new PersistenceError('Failed to save payment', error),
    }),
  
  /**
   * Delete payment - SCD Type 2 soft delete
   * Closes current version instead of physical deletion
   */
  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        
        // Close current version (soft delete)
        const result = await prisma.payment.updateMany({
          where: {
            businessKey,
            isCurrent: true,
          },
          data: {
            validTo: now,
            isCurrent: false,
          },
        });
        
        // Check if any record was updated
        if (result.count === 0) {
          throw new NotFoundError({
            message: `Payment ${businessKey} not found`,
            entityType: 'Payment',
            entityId: businessKey,
          });
        }
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to delete payment', error);
      },
    }),
};

/**
 * Effect Layer to provide PaymentRepository
 */
export const PrismaPaymentRepositoryLive = Layer.succeed(
  PaymentRepository,
  PrismaPaymentRepository
);
