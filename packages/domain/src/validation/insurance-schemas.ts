import { z } from 'zod';

/**
 * Insurance Validation Schemas
 * 
 * Schemas for insurance assignment and claim processing.
 */

// Common insurance companies (can be extended)
export const INSURANCE_COMPANIES = [
  'MetLife',
  'Prudential',
  'State Farm',
  'Northwestern Mutual',
  'New York Life',
  'MassMutual',
  'Guardian Life',
  'Nationwide',
  'Other',
] as const;

/**
 * Schema for assigning insurance to a case
 */
export const assignInsuranceSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  insuranceCompany: z.string().min(1, 'Insurance company is required'),
  policyNumber: z.string().min(1, 'Policy number is required').max(50, 'Policy number must be less than 50 characters'),
  policyHolderName: z.string().min(1, 'Policy holder name is required').max(255, 'Name must be less than 255 characters'),
  assignedAmount: z.number({
    required_error: 'Assigned amount is required',
    invalid_type_error: 'Amount must be a number',
  }).positive('Amount must be greater than zero').max(999999.99, 'Amount cannot exceed $999,999.99'),
  claimNumber: z.string().max(50, 'Claim number must be less than 50 characters').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type AssignInsuranceInput = z.infer<typeof assignInsuranceSchema>;

/**
 * Schema for updating insurance assignment status
 */
export const updateInsuranceStatusSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  status: z.enum(['pending', 'approved', 'denied', 'paid'], {
    required_error: 'Status is required',
  }),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type UpdateInsuranceStatusInput = z.infer<typeof updateInsuranceStatusSchema>;
