import { Effect, Layer } from 'effect';
import { Contract, type ContractId, type Money, NotFoundError } from '@dykstra/domain';
import { ContractRepository } from '@dykstra/application';
import { PersistenceError } from '@dykstra/application';
import type { ContractStatus } from '@dykstra/shared';
import { type ContractStatus as PrismaContractStatus } from '@prisma/client';
import { prisma } from './prisma-client';

/**
 * Map Prisma contract to domain Contract entity
 * SCD Type 2: Maps temporal fields to domain model
 */
const toDomain = (prismaContract: any): Contract => {
  return new Contract({
    id: prismaContract.id as ContractId,
    businessKey: prismaContract.businessKey,
    version: prismaContract.temporalVersion,
    caseId: prismaContract.caseId,
    contractVersion: prismaContract.contractVersion,
    status: prismaContract.status.toLowerCase() as ContractStatus,
    services: Array.isArray(prismaContract.services) ? prismaContract.services : [],
    products: Array.isArray(prismaContract.products) ? prismaContract.products : [],
    subtotal: {
      amount: parseFloat(prismaContract.subtotal.toString()),
      currency: 'USD',
    } as Money,
    tax: {
      amount: parseFloat(prismaContract.tax.toString()),
      currency: 'USD',
    } as Money,
    totalAmount: {
      amount: parseFloat(prismaContract.totalAmount.toString()),
      currency: 'USD',
    } as Money,
    termsAndConditions: prismaContract.termsAndConditions,
    createdAt: prismaContract.createdAt,
    updatedAt: prismaContract.updatedAt,
    createdBy: prismaContract.createdBy,
  });
};

/**
 * Map domain Contract to Prisma format
 * SCD Type 2: Includes temporal fields for versioning
 */
const toPrisma = (contract: Contract, validFrom: Date = new Date()) => {
  return {
    id: contract.id,
    businessKey: contract.businessKey,
    temporalVersion: contract.version,
    validFrom,
    validTo: null,                                  // New version is always current
    isCurrent: true,
    caseId: contract.caseId,
    contractVersion: contract.contractVersion,
    status: contract.status.toUpperCase() as PrismaContractStatus,
    services: contract.services as any,
    products: contract.products as any,
    subtotal: contract.subtotal.amount,
    tax: contract.tax.amount,
    totalAmount: contract.totalAmount.amount,
    termsAndConditions: contract.termsAndConditions,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    createdBy: contract.createdBy,
  };
};

/**
 * Prisma implementation of ContractRepository with SCD Type 2 temporal support
 */
export const PrismaContractRepository: ContractRepository = {
  /**
   * Find current version of contract by business key
   */
  findById: (id: ContractId) =>
    Effect.tryPromise({
      try: async () => {
        // Try to find by technical ID first (for backward compatibility)
        let prismaContract = await prisma.contract.findUnique({
          where: { id },
        });
        
        // If not found by technical ID, try business key with isCurrent=true
        if (!prismaContract) {
          prismaContract = await prisma.contract.findFirst({
            where: {
              businessKey: id,
              isCurrent: true,
            },
          });
        }

        if (!prismaContract) {
          throw new NotFoundError({
            message: `Contract with ID ${id} not found`,
            entityType: 'Contract',
            entityId: id,
          });
        }

        return toDomain(prismaContract);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find contract', error);
      },
    }),
  
  /**
   * Find contract as it existed at a specific point in time
   */
  findByIdAtTime: (businessKey: string, asOf: Date) =>
    Effect.tryPromise({
      try: async () => {
        const prismaContract = await prisma.contract.findFirst({
          where: {
            businessKey,
            validFrom: { lte: asOf },
            OR: [
              { validTo: { gt: asOf } },
              { validTo: null },
            ],
          },
        });

        if (!prismaContract) {
          throw new NotFoundError({
            message: `Contract ${businessKey} not found at ${asOf.toISOString()}`,
            entityType: 'Contract',
            entityId: businessKey,
          });
        }

        return toDomain(prismaContract);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find contract at time', error);
      },
    }),
  
  /**
   * Find complete version history of a contract
   */
  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaContracts = await prisma.contract.findMany({
          where: { businessKey },
          orderBy: { temporalVersion: 'asc' },
        });

        if (prismaContracts.length === 0) {
          throw new NotFoundError({
            message: `Contract ${businessKey} not found`,
            entityType: 'Contract',
            entityId: businessKey,
          });
        }

        return prismaContracts.map(toDomain);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to find contract history', error);
      },
    }),
  
  /**
   * Find current versions of contracts by case
   */
  findByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaContracts = await prisma.contract.findMany({
          where: {
            caseId,
            isCurrent: true,                        // Only current versions
          },
          orderBy: { createdAt: 'desc' },
        });

        return prismaContracts.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find contracts by case', error),
    }),
  
  /**
   * Find current version of contract by business key (string identifier)
   * Convenience method for when you only have the business key string
   */
  findByBusinessKey: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaContract = await prisma.contract.findFirst({
          where: {
            businessKey,
            isCurrent: true,                        // Only current version
          },
        });

        if (!prismaContract) {
          return null;
        }

        return toDomain(prismaContract);
      },
      catch: (error) => new PersistenceError('Failed to find contract by business key', error),
    }),
  
  /**
   * Find current version of contract by case
   * Returns only one contract per case (the current/active one)
   */
  findCurrentByCase: (caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const prismaContract = await prisma.contract.findFirst({
          where: {
            caseId,
            isCurrent: true,                        // Only current version
          },
          orderBy: { createdAt: 'desc' },            // Get most recent if multiple
        });

        if (!prismaContract) {
          return null;
        }

        return toDomain(prismaContract);
      },
      catch: (error) => new PersistenceError('Failed to find current contract by case', error),
    }),
  
  /**
   * Save contract - SCD Type 2 implementation
   * Creates new version instead of updating existing
   */
  save: (contract: Contract) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        
        // Check if this is a new contract (version 1) or an update
        if (contract.version === 1) {
          // New contract - simple insert
          const data = toPrisma(contract, now);
          await prisma.contract.create({ data });
        } else {
          // Update - SCD Type 2 transaction
          await prisma.$transaction(async (tx: any) => {
            // Step 1: Close current version
            await tx.contract.updateMany({
              where: {
                businessKey: contract.businessKey,
                isCurrent: true,
              },
              data: {
                validTo: now,
                isCurrent: false,
              },
            });
            
            // Step 2: Insert new version
            const data = toPrisma(contract, now);
            await tx.contract.create({ data });
          });
        }
      },
      catch: (error) => new PersistenceError('Failed to save contract', error),
    }),
  
  /**
   * Create new contract - convenience method
   */
  create: (contract: Contract) =>
    Effect.gen(function* () {
      // Use save for creation (version 1)
      yield* PrismaContractRepository.save(contract);
      // Return the created contract
      return contract;
    }),
  
  /**
   * Update contract - convenience method that wraps save for SCD2 updates
   * Creates new version of existing contract
   */
  update: (contract: Contract) =>
    Effect.gen(function* () {
      // Save creates a new version (SCD2 pattern)
      yield* PrismaContractRepository.save(contract);
      // Return the updated contract
      return contract;
    }),
  
  /**
   * Delete contract - SCD Type 2 soft delete
   * Closes current version instead of physical deletion
   */
  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        
        // Close current version (soft delete)
        const result = await prisma.contract.updateMany({
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
            message: `Contract ${businessKey} not found`,
            entityType: 'Contract',
            entityId: businessKey,
          });
        }
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new PersistenceError('Failed to delete contract', error);
      },
    }),
};

/**
 * Effect Layer to provide ContractRepository
 */
export const PrismaContractRepositoryLive = Layer.succeed(
  ContractRepository,
  PrismaContractRepository
);
