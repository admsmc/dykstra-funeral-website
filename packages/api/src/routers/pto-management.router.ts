import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import {
  RequestPtoUseCase,
  ApprovePtoRequestUseCase,
  RejectPtoRequestUseCase,
  GetPtoRequestUseCase,
  GetPtoBalanceUseCase,
  GetPtoSummaryUseCase,
} from '@dykstra/application';
import type { Context } from '../context/context';

/**
 * PTO Request Status Enum
 */
const PtoStatusEnum = z.enum([
  'draft',
  'pending',
  'approved',
  'rejected',
  'taken',
  'cancelled',
]);

/**
 * PTO Type Enum
 */
const PtoTypeEnum = z.enum([
  'vacation',
  'sick_leave',
  'bereavement',
  'unpaid',
  'personal',
]);

/**
 * PTO Management Router
 * Handles PTO request management, approvals, and balance tracking
 *
 * @example
 * // Request PTO
 * const request = await trpc.ptoManagement.requestPto.mutate({
 *   employeeId: 'emp-001',
 *   ptoType: 'vacation',
 *   startDate: new Date('2025-12-15'),
 *   endDate: new Date('2025-12-20'),
 *   requestedDays: 5,
 *   reason: 'Family vacation',
 * });
 *
 * // Get balance
 * const balance = await trpc.ptoManagement.getEmployeeBalance.query({
 *   employeeId: 'emp-001',
 * });
 */
export const ptoManagementRouter = router({
  /**
   * Request PTO
   * Creates a new PTO request that requires manager approval
   *
   * Business Rules:
   * - Minimum 14 days advance notice for regular PTO
   * - Minimum 30 days advance notice for holidays
   * - Max 10 consecutive days
   * - Max 2 concurrent employees on PTO
   * - Policy-driven by funeral home configuration
   *
   * @returns Created PTO request with ID, status, and timestamps
   */
  requestPto: staffProcedure
    .input(
      z.object({
        employeeId: z.string().min(1, 'Employee ID required'),
        employeeName: z.string().min(1, 'Employee name required'),
        ptoType: PtoTypeEnum,
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        requestedDays: z.number().int().min(1, 'At least 1 day required'),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        RequestPtoUseCase({
          employeeId: input.employeeId,
          employeeName: input.employeeName,
          ptoType: input.ptoType,
          startDate: input.startDate,
          endDate: input.endDate,
          requestedDays: input.requestedDays,
          reason: input.reason,
          requestedBy: (ctx as any).userId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Approve PTO Request
   * Manager approval of pending PTO request
   *
   * @param id - PTO request ID to approve
   * @returns Updated PTO request with approved status
   */
  approvePtoRequest: staffProcedure
    .input(
      z.object({
        ptoRequestId: z.string().min(1, 'PTO request ID required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        ApprovePtoRequestUseCase({
          ptoRequestId: input.ptoRequestId,
          approvedBy: (ctx as any).userId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Reject PTO Request
   * Manager rejection of pending PTO request
   *
   * @param id - PTO request ID to reject
   * @param reason - Reason for rejection
   * @returns Updated PTO request with rejected status
   */
  rejectPtoRequest: staffProcedure
    .input(
      z.object({
        ptoRequestId: z.string().min(1, 'PTO request ID required'),
        rejectionReason: z.string().min(1, 'Rejection reason required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        RejectPtoRequestUseCase({
          ptoRequestId: input.ptoRequestId,
          rejectionReason: input.rejectionReason,
          rejectedBy: (ctx as any).userId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get PTO Request Details
   * Retrieve a specific PTO request with full details
   *
   * @param id - PTO request ID
   * @returns PTO request details including status, dates, and approvals
   */
  getPtoRequest: staffProcedure
    .input(
      z.object({
        ptoRequestId: z.string().min(1, 'PTO request ID required'),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetPtoRequestUseCase({
          ptoRequestId: input.ptoRequestId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Employee PTO Balance
   * Current PTO balance for an employee
   *
   * Returns:
   * - Annual allowance (configurable per funeral home)
   * - Days used this year
   * - Days remaining
   * - Pending approval count
   * - Current on-PTO status
   *
   * @param employeeId - Employee ID
   * @returns Balance information with usage breakdown
   */
  getEmployeeBalance: staffProcedure
    .input(
      z.object({
        employeeId: z.string().min(1, 'Employee ID required'),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetPtoBalanceUseCase({
          employeeId: input.employeeId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Funeral Home PTO Summary
   * High-level overview of PTO coverage for funeral home
   *
   * Returns:
   * - Current employees on PTO
   * - Pending approvals
   * - Approval deadlines
   * - Coverage adequacy status
   *
   * @returns Summary of PTO status across all staff
   */
  getFuneralHomeSummary: staffProcedure
    .query(async ({ ctx }) => {
      return await runEffect(
        GetPtoSummaryUseCase({}),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Pending PTO Approvals
   * List of all pending PTO requests awaiting manager approval
   *
   * @returns Array of pending PTO requests ordered by request date
   */
  getPendingApprovals: staffProcedure
    .query(async ({ ctx }) => {
      return await runEffect(
        GetPtoRequestUseCase({
          ptoRequestId: 'pending',
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Concurrent PTO Requests
   * Find all PTO requests overlapping a date range
   *
   * Useful for:
   * - Scheduling backfill coverage
   * - Checking availability for specific roles
   * - Ensuring coverage requirements are met
   *
   * @param startDate - Range start
   * @param endDate - Range end
   * @param role - Optional role filter
   * @returns Array of overlapping PTO requests
   */
  getConcurrentRequests: staffProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        role: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetPtoRequestUseCase({
          ptoRequestId: 'concurrent',
          startDate: input.startDate,
          endDate: input.endDate,
          role: input.role,
        }),
        ctx as unknown as Context
      );
    }),
});

export type PtoManagementRouter = typeof ptoManagementRouter;
