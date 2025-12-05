import { Effect } from 'effect';
import type { UserPortService, UserProfile, UserPreferences, UserError } from '@dykstra/application';
import { prisma } from '../../database/prisma-client';

/**
 * Prisma implementation of UserPort
 * Object-based adapter (NOT class-based)
 */
export const PrismaUserAdapter: UserPortService = {
  /**
   * Get user profile by ID
   */
  getProfile: (userId: string) =>
    Effect.tryPromise({
      try: async () => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            caseMemberships: {
              include: {
                case: {
                  select: {
                    id: true,
                    decedentName: true,
                    businessKey: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        // Parse preferences with defaults
        const prefs = user.preferences as any;
        const preferences: UserPreferences = {
          emailNotifications: {
            caseUpdates: prefs?.emailNotifications?.caseUpdates ?? true,
            paymentReminders: prefs?.emailNotifications?.paymentReminders ?? true,
            documentUploads: prefs?.emailNotifications?.documentUploads ?? true,
            taskAssignments: prefs?.emailNotifications?.taskAssignments ?? true,
          },
          smsNotifications: {
            urgentUpdates: prefs?.smsNotifications?.urgentUpdates ?? false,
            appointmentReminders: prefs?.smsNotifications?.appointmentReminders ?? false,
          },
        };

        const profile: UserProfile = {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          preferences,
          caseMemberships: user.caseMemberships.map((membership: any) => ({
            caseId: membership.caseId,
            role: membership.role,
            decedentName: membership.case.decedentName,
          })),
        };

        return profile;
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to get user profile';
        return new (class extends Error implements UserError {
          readonly _tag = 'UserError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    }),

  /**
   * Update user profile
   */
  updateProfile: (params: {
    userId: string;
    name?: string;
    phone?: string;
    preferences?: UserPreferences;
  }): Effect.Effect<void, UserError> =>
    Effect.tryPromise({
      try: async () => {
        const updateData: any = {};

        if (params.name !== undefined) {
          updateData.name = params.name;
        }

        if (params.phone !== undefined) {
          updateData.phone = params.phone;
        }

        if (params.preferences !== undefined) {
          // Get existing preferences
          const existingUser = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { preferences: true },
          });

          const currentPrefs = (existingUser?.preferences as any) || {};

          updateData.preferences = {
            emailNotifications: {
              ...(currentPrefs.emailNotifications || {}),
              ...(params.preferences.emailNotifications || {}),
            },
            smsNotifications: {
              ...(currentPrefs.smsNotifications || {}),
              ...(params.preferences.smsNotifications || {}),
            },
          };
        }

        await prisma.user.update({
          where: { id: params.userId },
          data: updateData,
        });
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to update user profile';
        return new (class extends Error implements UserError {
          readonly _tag = 'UserError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    }),

  /**
   * Find user by email
   */
  findByEmail: (email: string) =>
    Effect.tryPromise({
      try: async () => {
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            caseMemberships: {
              include: {
                case: {
                  select: {
                    id: true,
                    decedentName: true,
                    businessKey: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        // Parse preferences
        const prefs = user.preferences as any;
        const preferences: UserPreferences = {
          emailNotifications: {
            caseUpdates: prefs?.emailNotifications?.caseUpdates ?? true,
            paymentReminders: prefs?.emailNotifications?.paymentReminders ?? true,
            documentUploads: prefs?.emailNotifications?.documentUploads ?? true,
            taskAssignments: prefs?.emailNotifications?.taskAssignments ?? true,
          },
          smsNotifications: {
            urgentUpdates: prefs?.smsNotifications?.urgentUpdates ?? false,
            appointmentReminders: prefs?.smsNotifications?.appointmentReminders ?? false,
          },
        };

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          preferences,
          caseMemberships: user.caseMemberships.map((membership: any) => ({
            caseId: membership.caseId,
            role: membership.role,
            decedentName: membership.case.decedentName,
          })),
        };
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to find user by email';
        return new (class extends Error implements UserError {
          readonly _tag = 'UserError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    }),

  /**
   * Check if user has access to case
   */
  hasAccessToCase: (userId: string, caseId: string) =>
    Effect.tryPromise({
      try: async () => {
        const membership = await prisma.caseMember.findFirst({
          where: {
            userId,
            caseId,
          },
        });

        return membership !== null;
      },
      catch: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to check case access';
        return new (class extends Error implements UserError {
          readonly _tag = 'UserError' as const;
          constructor(override readonly message: string, override readonly cause?: unknown) {
            super(message, { cause });
          }
        })(message, error);
      },
    }),
};

/**
 * Create Prisma User Adapter instance
 */
export function createPrismaUserAdapter(): UserPortService {
  return PrismaUserAdapter;
}
