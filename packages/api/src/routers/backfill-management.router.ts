import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import {
  AssignPtoBackfillUseCase,
  ConfirmBackfillAssignmentUseCase,
  RejectBackfillAssignmentUseCase,
  GetBackfillCandidatesUseCase,
  GetBackfillCoverageUseCase,
  GetBackfillWorkloadUseCase,
} from '@dykstra/application';
import type { Context } from '../context/context';

/**
 * Backfill Status Enum
 */
const BackfillStatusEnum = z.enum([
  'suggested',
  'pending_confirmation',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
]);

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
  /**
   * Get Backfill Candidates
   * Find available employees to cover an absence
   *
   * Ranking Factors:
   * - Role match (priority 1)
   * - Availability (no conflicting assignments)
   * - Workload balance (fewer recent backfills ranked higher)
   * - Skill level match
   *
   * @param absenceEmployeeRole - Role of absent employee
   * @param startDate - Absence start date
   * @param endDate - Absence end date
   * @returns Array of candidates ranked by suitability
   */
  getBackfillCandidates: staffProcedure
    .input(
      z.object({
        absenceEmployeeRole: z.string().min(1, 'Role required'),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetBackfillCandidatesUseCase({
          absenceEmployeeRole: input.absenceEmployeeRole,
          startDate: input.startDate,
          endDate: input.endDate,
        }),
        ctx as unknown as Context
      );
    }),

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
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        backfillEmployeeId: z.string().min(1, 'Backfill employee ID required'),
        backfillEmployeeName: z.string().min(1, 'Backfill employee name required'),
        backfillEmployeeRole: z.string().min(1, 'Backfill employee role required'),
        estimatedHours: z.number().int().min(1),
        premiumType: PremiumTypeEnum.default('none'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        AssignPtoBackfillUseCase({
          absenceId: input.absenceId,
          absenceType: input.absenceType,
          absenceEmployeeId: input.absenceEmployeeId,
          absenceEmployeeName: input.absenceEmployeeName,
          absenceEmployeeRole: input.absenceEmployeeRole,
          startDate: input.startDate,
          endDate: input.endDate,
          backfillEmployeeId: input.backfillEmployeeId,
          backfillEmployeeName: input.backfillEmployeeName,
          backfillEmployeeRole: input.backfillEmployeeRole,
          estimatedHours: input.estimatedHours,
          premiumType: input.premiumType,
          assignedBy: (ctx as any).userId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Confirm Backfill Assignment
   * Employee confirms acceptance of backfill assignment
   *
   * Transitions assignment from 'pending_confirmation' to 'confirmed'
   * Updates employee workload and coverage summary
   *
   * @param assignmentId - Backfill assignment ID
   * @returns Updated assignment with confirmed status
   */
  confirmBackfillAssignment: staffProcedure
    .input(
      z.object({
        assignmentId: z.string().min(1, 'Assignment ID required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        ConfirmBackfillAssignmentUseCase({
          assignmentId: input.assignmentId,
          confirmedBy: (ctx as any).userId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Reject Backfill Assignment
   * Employee rejects backfill assignment offer
   *
   * Assignment transitions to 'rejected' status.
   * System suggests alternative candidates.
   *
   * @param assignmentId - Assignment ID to reject
   * @param reason - Reason for rejection
   * @returns Updated assignment with rejected status
   */
  rejectBackfillAssignment: staffProcedure
    .input(
      z.object({
        assignmentId: z.string().min(1, 'Assignment ID required'),
        rejectionReason: z.string().min(1, 'Reason required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        RejectBackfillAssignmentUseCase({
          assignmentId: input.assignmentId,
          rejectionReason: input.rejectionReason,
          rejectedBy: (ctx as any).userId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Backfill Coverage Summary
   * Consolidated view of backfill coverage for an absence
   *
   * Shows:
   * - Confirmed backfills
   * - Pending confirmations
   * - Rejected assignments
   * - Coverage complete status
   * - Estimated and actual costs
   *
   * @param absenceId - PTO request or training record ID
   * @returns Coverage summary with confirmation status
   */
  getBackfillCoverageSummary: staffProcedure
    .input(
      z.object({
        absenceId: z.string().min(1, 'Absence ID required'),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetBackfillCoverageUseCase({
          absenceId: input.absenceId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Employee Backfill Workload
   * Current and projected backfill assignments for an employee
   *
   * Shows:
   * - Confirmed backfills
   * - Pending confirmations
   * - Estimated monthly hours
   * - Estimated monthly cost
   * - Capacity status (normal / approaching limit / at limit)
   * - Available date windows
   *
   * @param employeeId - Employee ID
   * @returns Workload summary with capacity information
   */
  getEmployeeBackfillWorkload: staffProcedure
    .input(
      z.object({
        employeeId: z.string().min(1, 'Employee ID required'),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetBackfillWorkloadUseCase({
          employeeId: input.employeeId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Check Backfill Conflicts
   * Verify if employee has conflicting assignments
   *
   * Returns true if employee already has confirmed or pending
   * backfill assignments overlapping the specified date range.
   *
   * @param employeeId - Employee ID
   * @param startDate - Range start
   * @param endDate - Range end
   * @returns Boolean indicating conflict status
   */
  checkBackfillConflicts: staffProcedure
    .input(
      z.object({
        employeeId: z.string().min(1, 'Employee ID required'),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetBackfillCoverageUseCase({
          absenceId: input.employeeId,
          startDate: input.startDate,
          endDate: input.endDate,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Pending Confirmations
   * All backfill assignments awaiting employee confirmation
   *
   * Used by employees to view their pending backfill requests.
   *
   * @returns Array of pending assignments ordered by suggestion date
   */
  getPendingConfirmations: staffProcedure
    .query(async ({ ctx }) => {
      return await runEffect(
        GetBackfillWorkloadUseCase({
          employeeId: (ctx as any).userId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Backfill Premium Pay Summary
   * Calculate premium pay for backfill assignments
   *
   * Supports HR payroll processing:
   * - Premium pay type (overtime, holiday, training coverage, emergency)
   * - Premium multiplier application
   * - Per-assignment and employee totals
   *
   * @param startDate - Date range start
   * @param endDate - Date range end
   * @returns Array of employees with premium pay calculations
   */
  getBackfillPremiumPaySummary: staffProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetBackfillWorkloadUseCase({
          employeeId: 'all',
          startDate: input.startDate,
          endDate: input.endDate,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get All Employee Workloads
   * Workload summary for all or filtered employees
   *
   * Useful for:
   * - Capacity planning
   * - Load balancing
   * - HR analytics
   *
   * @param employeeIds - Optional filter by employee IDs
   * @returns Array of employee workload summaries
   */
  getEmployeeWorkloads: staffProcedure
    .input(
      z.object({
        employeeIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetBackfillWorkloadUseCase({
          employeeId: 'all',
          employeeIds: input.employeeIds,
        }),
        ctx as unknown as Context
      );
    }),
});

export type BackfillManagementRouter = typeof backfillManagementRouter;
