import { Effect } from 'effect';
import type { InsurancePort, InsuranceAssignmentResult, InsuranceError } from '@dykstra/application';
import { prisma } from '../../database/prisma-client';

/**
 * Prisma implementation of InsurancePort
 */
export class PrismaInsuranceAdapter implements InsurancePort {
  /**
   * Create an insurance assignment
   */
  readonly createAssignment = (params: {
    caseId: string;
    insuranceCompany: string;
    policyNumber: string;
    policyHolderName: string;
    assignedAmount: number;
    claimNumber?: string;
    notes?: string;
    userId: string;
  }): Effect.Effect<InsuranceAssignmentResult, InsuranceError> =>
    Effect.tryPromise({
      try: async () => {
        const assignment = await prisma.insuranceAssignment.create({
          data: {
            caseId: params.caseId,
            insuranceCompany: params.insuranceCompany,
            policyNumber: params.policyNumber,
            policyHolderName: params.policyHolderName,
            assignedAmount: params.assignedAmount,
            claimNumber: params.claimNumber,
            notes: params.notes,
            status: 'PENDING',
            createdById: params.userId,
          },
        });

        return {
          insuranceAssignmentId: assignment.id,
          status: assignment.status,
        };
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to create insurance assignment';
        return new (class extends Error implements InsuranceError {
          readonly _tag = 'InsuranceError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });

  /**
   * Update insurance assignment status
   */
  readonly updateStatus = (params: {
    assignmentId: string;
    status: string;
    notes?: string;
  }): Effect.Effect<void, InsuranceError> =>
    Effect.tryPromise({
      try: async () => {
        const updateData: any = {
          status: params.status,
        };

        if (params.notes !== undefined) {
          updateData.notes = params.notes;
        }

        await prisma.insuranceAssignment.update({
          where: { id: params.assignmentId },
          data: updateData,
        });
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to update insurance assignment status';
        return new (class extends Error implements InsuranceError {
          readonly _tag = 'InsuranceError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });

  /**
   * Get insurance assignment details
   */
  readonly getAssignment = (
    assignmentId: string
  ): Effect.Effect<
    {
      id: string;
      caseId: string;
      insuranceCompany: string;
      policyNumber: string;
      assignedAmount: number;
      status: string;
    },
    InsuranceError
  > =>
    Effect.tryPromise({
      try: async () => {
        const assignment = await prisma.insuranceAssignment.findUnique({
          where: { id: assignmentId },
          select: {
            id: true,
            caseId: true,
            insuranceCompany: true,
            policyNumber: true,
            assignedAmount: true,
            status: true,
          },
        });

        if (!assignment) {
          throw new Error(`Insurance assignment ${assignmentId} not found`);
        }

        return assignment;
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to get insurance assignment';
        return new (class extends Error implements InsuranceError {
          readonly _tag = 'InsuranceError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    });
}

/**
 * Create Prisma Insurance Adapter instance
 */
export function createPrismaInsuranceAdapter(): InsurancePort {
  return new PrismaInsuranceAdapter();
}
