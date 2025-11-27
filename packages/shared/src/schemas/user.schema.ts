import { z } from 'zod';

/**
 * User roles in the system
 * Must match Prisma UserRole enum
 */
export const UserRoleSchema = z.enum([
  'FAMILY_PRIMARY',   // Primary contact for a case
  'FAMILY_MEMBER',    // Additional family member
  'STAFF',            // Staff member (read-only)
  'DIRECTOR',         // Funeral director (full case management)
  'FUNERAL_DIRECTOR', // Deprecated: use DIRECTOR
  'ADMIN',            // System administrator
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Base user schema
 */
export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: UserRoleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Family member permissions
 */
export const FamilyMemberPermissionsSchema = z.object({
  canViewContract: z.boolean().default(true),
  canSignContract: z.boolean().default(false),
  canMakePayments: z.boolean().default(false),
  canUploadPhotos: z.boolean().default(true),
  canEditArrangements: z.boolean().default(false),
});

export type FamilyMemberPermissions = z.infer<typeof FamilyMemberPermissionsSchema>;

/**
 * Family member invitation
 */
export const FamilyMemberInvitationSchema = z.object({
  id: z.string().cuid(),
  caseId: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.enum(['FAMILY_PRIMARY', 'FAMILY_MEMBER']),
  permissions: FamilyMemberPermissionsSchema,
  invitedAt: z.date(),
  acceptedAt: z.date().nullable(),
  invitedBy: z.string().cuid(),
  token: z.string().uuid(),
  expiresAt: z.date(),
});

export type FamilyMemberInvitation = z.infer<typeof FamilyMemberInvitationSchema>;
