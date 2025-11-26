import { z } from 'zod';

/**
 * Case types
 */
export const CaseTypeSchema = z.enum([
  'at_need',    // Immediate need (death has occurred)
  'pre_need',   // Pre-planning/pre-arrangement
  'inquiry',    // Initial inquiry
]);

export type CaseType = z.infer<typeof CaseTypeSchema>;

/**
 * Case status
 */
export const CaseStatusSchema = z.enum([
  'inquiry',      // Initial inquiry
  'active',       // Active case
  'completed',    // Service completed
  'archived',     // Archived
]);

export type CaseStatus = z.infer<typeof CaseStatusSchema>;

/**
 * Service type
 */
export const ServiceTypeSchema = z.enum([
  'traditional_burial',
  'traditional_cremation',
  'memorial_service',
  'direct_burial',
  'direct_cremation',
  'celebration_of_life',
]);

export type ServiceType = z.infer<typeof ServiceTypeSchema>;

/**
 * Main Case schema
 */
export const CaseSchema = z.object({
  id: z.string().cuid(),
  funeralHomeId: z.string().cuid(),
  decedentName: z.string().min(1).max(255),
  decedentDateOfBirth: z.date().nullable(),
  decedentDateOfDeath: z.date().nullable(),
  type: CaseTypeSchema,
  status: CaseStatusSchema,
  serviceType: ServiceTypeSchema.nullable(),
  serviceDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().cuid(),
});

export type Case = z.infer<typeof CaseSchema>;

/**
 * Arrangements/preferences
 */
export const ArrangementsSchema = z.object({
  serviceType: ServiceTypeSchema,
  serviceDate: z.date().nullable(),
  serviceLocation: z.string().max(500).nullable(),
  cemetery: z.string().max(255).nullable(),
  obituaryText: z.string().max(5000).nullable(),
  musicSelections: z.array(z.string().max(255)).default([]),
  readings: z.array(z.string().max(500)).default([]),
  specialRequests: z.string().max(2000).nullable(),
  casketOrUrnSelection: z.string().max(255).nullable(),
  flowers: z.string().max(500).nullable(),
  notes: z.string().max(5000).nullable(),
});

export type Arrangements = z.infer<typeof ArrangementsSchema>;

/**
 * Task status
 */
export const TaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/**
 * Task schema
 */
export const TaskSchema = z.object({
  id: z.string().cuid(),
  caseId: z.string().cuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).nullable(),
  status: TaskStatusSchema,
  assignedTo: z.string().cuid().nullable(),
  dueDate: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Task = z.infer<typeof TaskSchema>;
