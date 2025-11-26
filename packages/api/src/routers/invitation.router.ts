import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import {
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
  getInvitationHistory,
  CaseMemberRole,
} from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';

/**
 * Family Invitation Router
 * 
 * Handles family member invitations with magic links
 * All mutations follow SCD2 pattern for audit trail
 */

const CaseMemberRoleEnum = z.enum(['PRIMARY_CONTACT', 'FAMILY_MEMBER']) as z.ZodType<CaseMemberRole>;

export const invitationRouter = router({
  /**
   * Create invitation and send magic link
   * Generates secure 64-character token valid for 7 days
   */
  create: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        email: z.string().email(),
        name: z.string().min(1),
        phone: z.string().optional(),
        relationship: z.string().optional(),
        role: CaseMemberRoleEnum.default('FAMILY_MEMBER'),
        permissions: z.record(z.boolean()).default({}),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const baseUrl = process.env['NEXT_PUBLIC_URL'] || 'http://localhost:3000';

      return await runEffect(
        createInvitation({
          caseId: input.caseId,
          email: input.email,
          name: input.name,
          phone: input.phone,
          relationship: input.relationship,
          role: input.role,
          permissions: input.permissions,
          sentBy: ctx.user.id,
          baseUrl,
        })
      );
    }),

  /**
   * Get all invitations for a case
   * Returns only current versions
   */
  list: staffProcedure
    .input(
      z.object({
        caseId: z.string(),
        status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']).optional(),
      })
    )
    .query(async ({ input }) => {
      return await runEffect(
        listInvitations({
          caseId: input.caseId,
          status: input.status,
        })
      );
    }),

  /**
   * Resend invitation with new token and extended expiration
   * Uses SCD2: creates new version with new token
   */
  resend: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const baseUrl = process.env['NEXT_PUBLIC_URL'] || 'http://localhost:3000';

      return await runEffect(
        resendInvitation({
          businessKey: input.businessKey,
          sentBy: ctx.user.id,
          baseUrl,
        })
      );
    }),

  /**
   * Revoke invitation
   * Uses SCD2: creates new version with REVOKED status
   */
  revoke: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await runEffect(
        revokeInvitation({
          businessKey: input.businessKey,
        })
      );
    }),

  /**
   * Get invitation history (all versions)
   * Staff-only for audit purposes
   */
  history: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await runEffect(
        getInvitationHistory({
          businessKey: input.businessKey,
        })
      );
    }),
});
