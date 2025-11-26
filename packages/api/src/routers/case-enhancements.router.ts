import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { runEffect } from '../utils/effect-runner';
import {
  getFinancialSummary,
  updateCaseStatus,
  getAuditLog,
  listTasks,
  createTask,
  updateTaskStatus,
  listStaffMembers,
} from '@dykstra/application';

/**
 * Case Enhancements Router
 * Additional staff features: financial summary, status transitions, assignments
 */

export const caseEnhancementsRouter = router({
  /**
   * Get financial summary for a case
   */
  getFinancialSummary: staffProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ input }) => {
      return await runEffect(
        getFinancialSummary({ caseId: input.caseId })
      );
    }),

  /**
   * Update case status with validation
   * Valid transitions: INQUIRY → ACTIVE → COMPLETED → ARCHIVED
   */
  updateStatus: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
        newStatus: z.enum(['INQUIRY', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
      })
    )
    .mutation(async ({ input }) => {
      return await runEffect(
        updateCaseStatus({
          businessKey: input.businessKey,
          newStatus: input.newStatus,
        })
      );
    }),

  /**
   * Get staff members for assignment dropdown
   */
  getStaffMembers: staffProcedure.query(async () => {
    const result = await runEffect(listStaffMembers());
    return result.staff;
  }),

  /**
   * Get audit log for a case
   */
  getAuditLog: staffProcedure
    .input(
      z.object({
        entityId: z.string(),
        entityType: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        getAuditLog({
          entityId: input.entityId,
          entityType: input.entityType,
          limit: input.limit,
        })
      );
      return result.logs;
    }),

  /**
   * Get tasks for a case
   */
  getTasks: staffProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ input }) => {
      const result = await runEffect(
        listTasks({ caseId: input.caseId })
      );
      return result.tasks;
    }),

  /**
   * Create a task
   */
  createTask: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        assignedTo: z.string().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        createTask({
          caseId: input.caseId,
          title: input.title,
          description: input.description,
          assignedTo: input.assignedTo,
          dueDate: input.dueDate,
          createdBy: ctx.user.id,
        })
      );
    }),

  /**
   * Update task status
   */
  updateTaskStatus: staffProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
      })
    )
    .mutation(async ({ input }) => {
      return await runEffect(
        updateTaskStatus({
          taskId: input.taskId,
          status: input.status,
        })
      );
    }),
});
