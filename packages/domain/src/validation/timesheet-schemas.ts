import { z } from 'zod';

/**
 * Validation schemas for timesheet operations
 */

export const approveTimesheetSchema = z.object({
  timesheetId: z.string().min(1, "Timesheet ID is required"),
  approverId: z.string().min(1, "Approver ID is required"),
  comments: z.string().optional(),
  adjustments: z.array(z.object({
    entryId: z.string(),
    originalHours: z.number().positive(),
    adjustedHours: z.number().positive(),
    reason: z.string().min(1, "Adjustment reason required"),
  })).optional(),
});

export type ApproveTimesheetInput = z.infer<typeof approveTimesheetSchema>;
