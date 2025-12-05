import { z } from 'zod';
import { router, staffProcedure } from '../trpc';

/**
 * Task router
 * Task assignment and tracking across cases
 */
export const taskRouter = router({
  /**
   * List all tasks with optional filters
   */
  list: staffProcedure
    .input(
      z.object({
        status: z.enum(['all', 'todo', 'in-progress', 'completed']).default('all'),
        priority: z.enum(['all', 'low', 'medium', 'high']).default('all'),
        assigneeId: z.string().optional(),
        caseId: z.string().optional(),
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock task data - will be replaced with Go backend integration
      const allTasks = [
        {
          id: '1',
          title: 'Complete death certificate',
          description: 'Submit to county clerk',
          status: 'todo' as const,
          priority: 'high' as const,
          assignee: 'Sarah M.',
          assigneeId: 'emp-001',
          dueDate: '2024-12-06',
          caseId: 'C-2024-123',
        },
        {
          id: '2',
          title: 'Prepare obituary',
          description: 'Draft and send for family approval',
          status: 'in-progress' as const,
          priority: 'high' as const,
          assignee: 'John D.',
          assigneeId: 'emp-002',
          dueDate: '2024-12-05',
          caseId: 'C-2024-123',
        },
        {
          id: '3',
          title: 'Order casket',
          description: 'Bronze model per family request',
          status: 'completed' as const,
          priority: 'medium' as const,
          assignee: 'Sarah M.',
          assigneeId: 'emp-001',
          dueDate: '2024-12-04',
          caseId: 'C-2024-122',
        },
        {
          id: '4',
          title: 'Schedule embalming',
          description: 'Coordinate with prep room',
          status: 'todo' as const,
          priority: 'high' as const,
          assignee: 'Michael R.',
          assigneeId: 'emp-003',
          dueDate: '2024-12-05',
          caseId: 'C-2024-124',
        },
        {
          id: '5',
          title: 'Confirm flower delivery',
          description: 'Call florist for 10 AM delivery',
          status: 'in-progress' as const,
          priority: 'medium' as const,
          assignee: 'Sarah M.',
          assigneeId: 'emp-001',
          dueDate: '2024-12-06',
          caseId: 'C-2024-123',
        },
        {
          id: '6',
          title: 'Setup visitation room',
          description: 'Chapel A - 2 PM service',
          status: 'todo' as const,
          priority: 'medium' as const,
          assignee: 'John D.',
          assigneeId: 'emp-002',
          dueDate: '2024-12-07',
          caseId: 'C-2024-125',
        },
        {
          id: '7',
          title: 'File insurance claim',
          description: 'Submit to MetLife',
          status: 'in-progress' as const,
          priority: 'low' as const,
          assignee: 'Michael R.',
          assigneeId: 'emp-003',
          dueDate: '2024-12-10',
          caseId: 'C-2024-122',
        },
      ];

      let filtered = allTasks;

      // Filter by status
      if (input.status !== 'all') {
        filtered = filtered.filter((t) => t.status === input.status);
      }

      // Filter by priority
      if (input.priority !== 'all') {
        filtered = filtered.filter((t) => t.priority === input.priority);
      }

      // Filter by assignee
      if (input.assigneeId) {
        filtered = filtered.filter((t) => t.assigneeId === input.assigneeId);
      }

      // Filter by case
      if (input.caseId) {
        filtered = filtered.filter((t) => t.caseId === input.caseId);
      }

      return filtered;
    }),

  /**
   * Create a new task
   */
  create: staffProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']),
        assigneeId: z.string(),
        dueDate: z.string(),
        caseId: z.string().optional(),
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        id: `task-${Date.now()}`,
        ...input,
        status: 'todo' as const,
        assignee: 'Staff Member',
        createdAt: new Date(),
      };
    }),

  /**
   * Update task status
   */
  updateStatus: staffProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum(['todo', 'in-progress', 'completed']),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        taskId: input.taskId,
        status: input.status,
        updatedAt: new Date(),
      };
    }),

  /**
   * Reassign task to different employee
   */
  assign: staffProcedure
    .input(
      z.object({
        taskId: z.string(),
        assigneeId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock implementation - will be replaced with Go backend integration
      return {
        taskId: input.taskId,
        assigneeId: input.assigneeId,
        updatedAt: new Date(),
      };
    }),

  /**
   * Get task by ID
   */
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Mock implementation
      return {
        id: input.id,
        title: 'Sample Task',
        description: 'Task description',
        status: 'todo' as const,
        priority: 'medium' as const,
        assignee: 'Staff Member',
        assigneeId: 'emp-001',
        dueDate: '2024-12-10',
        caseId: 'C-2024-123',
        createdAt: new Date(),
      };
    }),
});
