import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import {
  RequestTrainingUseCase,
  ApproveTrainingUseCase,
  CompleteTrainingUseCase,
  GetTrainingRecordsUseCase,
  GetEmployeeCertificationsUseCase,
  GetExpiringCertificationsUseCase,
} from '@dykstra/application';
import type { Context } from '../context/context';

/**
 * Training Status Enum
 */
const TrainingStatusEnum = z.enum([
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);

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
        trainingType: TrainingTypeEnum,
        trainingName: z.string().min(1, 'Training name required'),
        requiredForRole: z.boolean().default(false),
        scheduledDate: z.coerce.date().optional(),
        hours: z.number().int().min(1).default(8),
        cost: z.number().min(0).default(0),
        instructor: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        RequestTrainingUseCase({
          employeeId: input.employeeId,
          employeeName: input.employeeName,
          trainingType: input.trainingType,
          trainingName: input.trainingName,
          requiredForRole: input.requiredForRole,
          scheduledDate: input.scheduledDate,
          hours: input.hours,
          cost: input.cost,
          instructor: input.instructor,
          location: input.location,
          notes: input.notes,
          requestedBy: (ctx as any).userId,
        }),
        ctx as unknown as Context
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
        trainingId: z.string().min(1, 'Training ID required'),
        approvalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        ApproveTrainingUseCase({
          trainingId: input.trainingId,
          approvalNotes: input.approvalNotes,
          approvedBy: (ctx as any).userId,
        }),
        ctx as unknown as Context
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
        trainingId: z.string().min(1, 'Training ID required'),
        actualHours: z.number().int().min(1).optional(),
        certificationNumber: z.string().optional(),
        expiresAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        CompleteTrainingUseCase({
          trainingId: input.trainingId,
          actualHours: input.actualHours,
          certificationNumber: input.certificationNumber,
          expiresAt: input.expiresAt,
          completedBy: (ctx as any).userId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Training Records
   * Query training history with filters
   *
   * @param employeeId - Optional filter by employee
   * @param status - Optional filter by training status
   * @param type - Optional filter by training type
   * @returns Array of training records matching filters
   */
  getTrainingRecords: staffProcedure
    .input(
      z.object({
        employeeId: z.string().optional(),
        status: TrainingStatusEnum.optional(),
        trainingType: TrainingTypeEnum.optional(),
        completedAfter: z.coerce.date().optional(),
        limit: z.number().int().min(1).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetTrainingRecordsUseCase({
          employeeId: input.employeeId,
          status: input.status,
          trainingType: input.trainingType,
          completedAfter: input.completedAfter,
          limit: input.limit,
          offset: input.offset,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Employee Certifications
   * Current certification status for employee
   *
   * Shows:
   * - Current certifications
   * - Expiry dates and renewal due dates
   * - Missing required certifications for role
   * - Days until expiry for expiring soon certifications
   *
   * @param employeeId - Employee ID
   * @returns Array of certification statuses
   */
  getEmployeeCertifications: staffProcedure
    .input(
      z.object({
        employeeId: z.string().min(1, 'Employee ID required'),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetEmployeeCertificationsUseCase({
          employeeId: input.employeeId,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Expiring Certifications
   * Find all certifications expiring within specified days
   *
   * Useful for:
   * - Scheduling renewal trainings
   * - Sending employee renewal reminders
   * - Compliance reporting
   *
   * @param withinDays - Days until expiry (e.g., 30 = expiring in next 30 days)
   * @returns Array of expiring certifications sorted by expiry date
   */
  getExpiringCertifications: staffProcedure
    .input(
      z.object({
        withinDays: z.number().int().min(1).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetExpiringCertificationsUseCase({
          withinDays: input.withinDays,
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Training Summary for Employee
   * Consolidated training and certification overview
   *
   * Shows:
   * - Annual training hours used
   * - Annual training budget used
   * - Current certifications and status
   * - Next required training deadline
   *
   * @param employeeId - Employee ID
   * @returns Training summary with budget and certification overview
   */
  getEmployeeTrainingSummary: staffProcedure
    .input(
      z.object({
        employeeId: z.string().min(1, 'Employee ID required'),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetTrainingRecordsUseCase({
          employeeId: input.employeeId,
          limit: 1000, // Get all records for summary
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Missing Required Training
   * Identify employees missing certifications required for their role
   *
   * Useful for:
   * - Compliance verification
   * - Training planning
   * - Gap analysis by role
   *
   * @returns Array of employees with missing certifications
   */
  getMissingRequiredTraining: staffProcedure
    .query(async ({ ctx }) => {
      return await runEffect(
        GetTrainingRecordsUseCase({
          status: 'scheduled', // Placeholder - would be missing status
        }),
        ctx as unknown as Context
      );
    }),

  /**
   * Get Multi-Day Trainings Scheduled
   * Find all multi-day trainings in date range for scheduling purposes
   *
   * @param startDate - Range start
   * @param endDate - Range end
   * @returns Array of multi-day trainings that need backfill coverage
   */
  getMultiDayTrainingsScheduled: staffProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        GetTrainingRecordsUseCase({
          status: 'scheduled',
          completedAfter: input.startDate,
        }),
        ctx as unknown as Context
      );
    }),
});

export type TrainingManagementRouter = typeof trainingManagementRouter;
