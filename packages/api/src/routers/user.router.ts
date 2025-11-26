import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getUserProfile, updateUserProfile } from "@dykstra/application";
import { runEffect } from "../utils/effect-runner";

/**
 * User router
 */
export const userRouter = router({
  /**
   * Get current user's profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await runEffect(
      getUserProfile({
        userId: ctx.user.id,
      })
    );

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      role: profile.role,
      emailVerified: profile.emailVerified,
      preferences: profile.preferences,
      caseMemberships: profile.caseMemberships,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }),

  /**
   * Update current user's profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        phone: z.string().max(20).optional().nullable(),
        preferences: z
          .object({
            emailNotifications: z
              .object({
                caseUpdates: z.boolean().optional(),
                paymentReminders: z.boolean().optional(),
                documentUploads: z.boolean().optional(),
                taskAssignments: z.boolean().optional(),
              })
              .optional(),
            smsNotifications: z
              .object({
                urgentUpdates: z.boolean().optional(),
                appointmentReminders: z.boolean().optional(),
              })
              .optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await runEffect(
        updateUserProfile({
          userId: ctx.user.id,
          name: input.name,
          phone: input.phone ?? undefined,
          preferences: input.preferences,
        })
      );

      return {
        success: result.success,
        userId: result.userId,
      };
    }),
});
