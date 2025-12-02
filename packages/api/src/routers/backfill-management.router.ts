import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';
import {
  assignPtoBackfill,
} from '@dykstra/application';

// Backfill Status Enum (unused - keeping for future reference)
// const BackfillStatusEnum = z.enum(['suggested', 'pending_confirmation', 'confirmed', 'rejected', 'cancelled', 'completed']);

/**
 * Premium Type Enum
 */
const PremiumTypeEnum = z.enum([
  'none',
  'overtime',
  'holiday',
  'training_coverage',
  'emergency',
]);

/**
 * Absence Type Enum
 */
const AbsenceTypeEnum = z.enum([
  'pto',
  'training',
  'other',
]);

/**
 * Backfill Management Router
 * Handles staff coverage assignments for PTO and training absences
 *
 * @example
 * // Get backfill candidates
 * const candidates = await trpc.backfillManagement.getBackfillCandidates.query({
 *   absenceEmployeeRole: 'director',
 *   startDate: new Date('2025-12-15'),
 *   endDate: new Date('2025-12-20'),
 * });
 *
 * // Assign backfill
 * const assignment = await trpc.backfillManagement.assignBackfill.mutate({
 *   absenceId: 'abs-001',
 *   backfillEmployeeId: 'emp-002',
 *   estimatedHours: 40,
 * });
 */
export const backfillManagementRouter = router({
  // TODO: Implement GetBackfillCandidatesUseCase, ConfirmBackfillAssignmentUseCase, RejectBackfillAssignmentUseCase
  // TODO: Implement GetBackfillCoverageUseCase, GetBackfillWorkloadUseCase

  /**
   * Assign Backfill
   * Suggest a backfill employee for an absence
   *
   * Creates assignment with status 'pending_confirmation'.
   * Employee receives notification to accept/reject.
   *
   * Business Rules:
   * - Cannot assign employee with conflicting assignments
   * - Cannot exceed employee's maximum monthly backfill hours
   * - Premium type automatically determined based on absence type and date
   *
   * @returns Created backfill assignment
   */
  assignBackfill: staffProcedure
    .input(
      z.object({
        absenceId: z.string().min(1, 'Absence ID required'),
        absenceType: AbsenceTypeEnum,
        absenceEmployeeId: z.string().min(1, 'Absent employee ID required'),
        absenceEmployeeName: z.string().min(1, 'Absent employee name required'),
        absenceEmployeeRole: z.string().min(1, 'Absent employee role required'),
        absenceStartDate: z.coerce.date(),
        absenceEndDate: z.coerce.date(),
        backfillEmployeeId: z.string().min(1, 'Backfill employee ID required'),
        backfillEmployeeName: z.string().min(1, 'Backfill employee name required'),
        backfillEmployeeRole: z.string().min(1, 'Backfill employee role required'),
        premiumType: PremiumTypeEnum.default('none').optional(),
        sendForConfirmation: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        assignPtoBackfill({
          funeralHomeId: ctx.user.funeralHomeId!,
          absenceId: input.absenceId,
          absenceType: input.absenceType as any, // Cast to domain BackfillReason type
          absenceStartDate: input.absenceStartDate,
          absenceEndDate: input.absenceEndDate,
          absenceEmployeeId: input.absenceEmployeeId,
          absenceEmployeeName: input.absenceEmployeeName,
          absenceEmployeeRole: input.absenceEmployeeRole,
          backfillEmployeeId: input.backfillEmployeeId,
          backfillEmployeeName: input.backfillEmployeeName,
          backfillEmployeeRole: input.backfillEmployeeRole,
          premiumType: input.premiumType as any, // Cast to domain PremiumType
          sendForConfirmation: input.sendForConfirmation,
          assignedBy: (ctx as any).userId,
        }).pipe(
          Effect.catchAll((error) =>
            Effect.fail({ _tag: 'BackfillError', message: error instanceof Error ? error.message : String(error) })
          )
        )
      );
    }),
});

export type BackfillManagementRouter = typeof backfillManagementRouter;
