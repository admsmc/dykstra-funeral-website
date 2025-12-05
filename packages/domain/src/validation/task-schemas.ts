import { z } from 'zod';

/**
 * Task Schema
 * Used for creating follow-up tasks on cases
 */
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
});

export type TaskFormData = z.infer<typeof taskSchema>;

/**
 * Task Status Enum (for reference)
 */
export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];
