import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

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
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      // Get latest contract total (if exists)
      const contract = await prisma.contract.findFirst({
        where: {
          caseId: input.caseId,
          isCurrent: true,
        },
        select: {
          totalAmount: true,
          subtotal: true,
          tax: true,
        },
      });

      // Get sum of successful payments
      const payments = await prisma.payment.aggregate({
        where: {
          caseId: input.caseId,
          isCurrent: true,
          status: 'SUCCEEDED',
        },
        _sum: {
          amount: true,
        },
      });

      const contractTotal = contract?.totalAmount || 0;
      const paidToDate = payments._sum.amount || 0;
      const outstanding = Number(contractTotal) - Number(paidToDate);

      return {
        contractTotal: contractTotal.toString(),
        paidToDate: paidToDate.toString(),
        outstanding: outstanding.toString(),
        hasContract: !!contract,
      };
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
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      return await prisma.$transaction(async (tx: typeof prisma) => {
        // Find current version
        const currentCase = await tx.case.findFirst({
          where: {
            businessKey: input.businessKey,
            isCurrent: true,
          },
        });

        if (!currentCase) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Case not found',
          });
        }

        // Validate status transition
        const validTransitions: Record<string, string[]> = {
          INQUIRY: ['ACTIVE', 'ARCHIVED'],
          ACTIVE: ['COMPLETED', 'ARCHIVED'],
          COMPLETED: ['ARCHIVED'],
          ARCHIVED: [], // Cannot transition from archived
        };

        const allowedNextStatuses = validTransitions[currentCase.status] || [];
        if (!allowedNextStatuses.includes(input.newStatus)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot transition from ${currentCase.status} to ${input.newStatus}`,
          });
        }

        // SCD2: Close current version
        const now = new Date();
        await tx.case.update({
          where: { id: currentCase.id },
          data: {
            isCurrent: false,
            validTo: now,
          },
        });

        // SCD2: Create new version with updated status
        const newCase = await tx.case.create({
          data: {
            businessKey: input.businessKey,
            version: currentCase.version + 1,
            funeralHomeId: currentCase.funeralHomeId,
            decedentName: currentCase.decedentName,
            decedentDateOfBirth: currentCase.decedentDateOfBirth,
            decedentDateOfDeath: currentCase.decedentDateOfDeath,
            type: currentCase.type,
            status: input.newStatus, // Updated status
            serviceType: currentCase.serviceType,
            serviceDate: currentCase.serviceDate,
            arrangements: currentCase.arrangements,
            createdAt: currentCase.createdAt, // Preserve original creation
            createdBy: currentCase.createdBy,
            isCurrent: true,
            validFrom: now,
          },
        });

        return {
          id: newCase.id,
          businessKey: newCase.businessKey,
          version: newCase.version,
          status: newCase.status,
        };
      });
    }),

  /**
   * Get staff members for assignment dropdown
   */
  getStaffMembers: staffProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ['STAFF', 'DIRECTOR', 'FUNERAL_DIRECTOR', 'ADMIN'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return staff;
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
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const logs: any[] = await prisma.auditLog.findMany({
        where: {
          entityId: input.entityId,
          ...(input.entityType ? { entityType: input.entityType } : {}),
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: input.limit,
      });

      return logs.map((log: any) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
        user: {
          name: log.user.name,
          email: log.user.email,
        },
        ipAddress: log.ipAddress,
        timestamp: log.timestamp,
      }));
    }),

  /**
   * Get tasks for a case
   */
  getTasks: staffProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const tasks: any[] = await prisma.task.findMany({
        where: {
          caseId: input.caseId,
        },
        include: {
          creator: {
            select: {
              name: true,
            },
          },
          assignee: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      });

      return tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        createdBy: task.creator.name,
        assignedTo: task.assignee?.name,
        createdAt: task.createdAt,
      }));
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
      const { prisma } = ctx;

      const task = await prisma.task.create({
        data: {
          caseId: input.caseId,
          title: input.title,
          description: input.description,
          assignedTo: input.assignedTo,
          dueDate: input.dueDate,
          createdBy: ctx.user.id,
          status: 'PENDING',
        },
        include: {
          assignee: {
            select: {
              name: true,
            },
          },
        },
      });

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        assignedTo: task.assignee?.name,
      };
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
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const task = await prisma.task.update({
        where: { id: input.taskId },
        data: {
          status: input.status,
          completedAt: input.status === 'COMPLETED' ? new Date() : null,
        },
      });

      return { id: task.id, status: task.status };
    }),
});
