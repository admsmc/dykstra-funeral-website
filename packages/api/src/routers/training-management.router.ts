import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';
import {
  requestTraining,
  approveTraining,
  completeTraining,
} from '@dykstra/application';

// Training Status Enum (unused - keeping for future reference)
// const TrainingStatusEnum = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']);

/**
 * Training Type Enum
 */
const TrainingTypeEnum = z.enum([
  'embalming',
  'funeral_directing',
  'restorative_art',
  'crematory_operation',
  'grief_counseling',
  'family_service',
  'regulatory_compliance',
  'safety_training',
  'professional_development',
  'mandatory_training',
  'certification_renewal',
  'other',
]);

/**
 * Training Management Router
 * Handles employee training scheduling, certification tracking, and compliance management
 *
 * @example
 * // Request training
 * const training = await trpc.trainingManagement.requestTraining.mutate({
 *   employeeId: 'emp-001',
 *   trainingType: 'certification_renewal',
 *   trainingName: 'Embalming License Renewal',
 *   requiredForRole: true,
 *   scheduledDate: new Date('2025-12-15'),
 *   cost: 500,
 * });
 *
 * // Get certifications
 * const certs = await trpc.trainingManagement.getEmployeeCertifications.query({
 *   employeeId: 'emp-001',
 * });
 */
export const trainingManagementRouter = router({
  /**
   * Request Training
   * Schedule training for an employee with required role certification or development
   *
   * Business Rules:
   * - Certifications require manager approval if cost exceeds threshold ($1000)
   * - Training budget tracked per employee annually
   * - Multi-day trainings require shift coverage verification
   * - Expiry dates automatically calculated based on training type
   *
   * @returns Created training record with ID and status
   */
  requestTraining: staffProcedure
    .input(
      z.object({
        employeeId: z.string().min(1, 'Employee ID required'),
        employeeName: z.string().min(1, 'Employee name required'),
        employeeRole: z.string().min(1, 'Employee role required'),
        trainingType: TrainingTypeEnum,
        trainingName: z.string().min(1, 'Training name required'),
        requiredForRole: z.boolean().default(false),
        scheduledDate: z.coerce.date().optional(),
        hours: z.number().int().min(1).default(8),
        cost: z.number().min(0).default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        requestTraining({
          funeralHomeId: ctx.user.funeralHomeId!,
          employeeId: input.employeeId,
          employeeName: input.employeeName,
          employeeRole: input.employeeRole,
          trainingType: input.trainingType as any, // Cast to domain TrainingType
          trainingName: input.trainingName,
          requiredForRole: input.requiredForRole,
          scheduledDate: input.scheduledDate,
          hours: input.hours,
          cost: input.cost,
          requestedBy: (ctx as any).userId,
        }).pipe(
          Effect.catchAll((error) =>
            Effect.fail({ _tag: 'TrainingError', message: error instanceof Error ? error.message : String(error) })
          )
        )
      );
    }),

  /**
   * Approve Training Request
   * Manager approval for training that requires budget or certification approval
   *
   * @param trainingId - Training record ID
   * @returns Updated training record with approved status
   */
  approveTraining: staffProcedure
    .input(
      z.object({
        trainingRecordId: z.string().min(1, 'Training record ID required'),
        scheduleTraining: z.boolean().default(false),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        assignBackfillIfMultiDay: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        approveTraining({
          trainingRecordId: input.trainingRecordId as any, // Cast to TrainingRecordId branded type
          approvedBy: (ctx as any).userId,
          scheduleTraining: input.scheduleTraining,
          startDate: input.startDate,
          endDate: input.endDate,
          assignBackfillIfMultiDay: input.assignBackfillIfMultiDay,
        }).pipe(
          Effect.catchAll((error) =>
            Effect.fail({ _tag: 'TrainingError', message: error instanceof Error ? error.message : String(error) })
          )
        )
      );
    }),

  /**
   * Mark Training Complete
   * Record completion of training and update certification status
   *
   * Automatically:
   * - Updates training record status to 'completed'
   * - Records completion timestamp and hours
   * - Updates certification status if applicable
   * - Sets renewal due date based on certification type
   * - Sends renewal reminders as expiry approaches
   *
   * @param trainingId - Training record ID
   * @returns Updated training record with completion info
   */
  completeTraining: staffProcedure
    .input(
      z.object({
        trainingRecordId: z.string().min(1, 'Training record ID required'),
        hours: z.number().int().min(1),
        certificationNumber: z.string().optional(),
        expiresAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        completeTraining({
          trainingRecordId: input.trainingRecordId as any, // Cast to TrainingRecordId branded type
          hours: input.hours,
          certificationNumber: input.certificationNumber,
          expiresAt: input.expiresAt,
          completedBy: (ctx as any).userId,
        }).pipe(
          Effect.catchAll((error) =>
            Effect.fail({ _tag: 'TrainingError', message: error instanceof Error ? error.message : String(error) })
          )
        )
      );
    }),

  // TODO: Implement query use cases (GetTrainingRecordsUseCase, GetEmployeeCertificationsUseCase, GetExpiringCertificationsUseCase)
  // Queries for training records, certifications, and expiring certs are disabled until use cases are implemented
});

export type TrainingManagementRouter = typeof trainingManagementRouter;
