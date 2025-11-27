/**
 * Prisma Bridge Types
 * 
 * This module provides a single source of truth for types that must match
 * between Prisma schema and application code. By importing Prisma-generated
 * types and re-exporting them, we ensure compile-time type safety.
 * 
 * Benefits:
 * - TypeScript compiler enforces type compatibility
 * - No runtime type mismatches possible
 * - IDE autocomplete works correctly
 * - Refactoring is safe (compiler catches all issues)
 */

import type { UserRole as PrismaUserRole } from '@prisma/client';

/**
 * User Role - directly uses Prisma-generated enum
 * 
 * This ensures that the role type in our application code ALWAYS matches
 * the Prisma schema. If Prisma schema changes, TypeScript will immediately
 * flag all incompatible code.
 */
export type UserRole = PrismaUserRole;

/**
 * Type guard for UserRole
 */
export const isUserRole = (value: string): value is UserRole => {
  return [
    'FAMILY_PRIMARY',
    'FAMILY_MEMBER',
    'STAFF',
    'DIRECTOR',
    'FUNERAL_DIRECTOR',
    'ADMIN',
  ].includes(value);
};

/**
 * Staff roles subset
 */
export const STAFF_ROLES: readonly UserRole[] = [
  'STAFF',
  'DIRECTOR',
  'FUNERAL_DIRECTOR',
  'ADMIN',
] as const;

/**
 * Family roles subset
 */
export const FAMILY_ROLES: readonly UserRole[] = [
  'FAMILY_PRIMARY',
  'FAMILY_MEMBER',
] as const;

/**
 * Check if role is a staff role
 */
export const isStaffRole = (role: UserRole): boolean => {
  return STAFF_ROLES.includes(role);
};

/**
 * Check if role is a family role
 */
export const isFamilyRole = (role: UserRole): boolean => {
  return FAMILY_ROLES.includes(role);
};
