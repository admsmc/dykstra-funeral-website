import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { findDuplicates, findDuplicateClusters } from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';

/**
 * Duplicate detection router for finding similar contacts
 * Thin layer that delegates to duplicate detection use cases
 */
export const duplicateRouter = router({
  /**
   * Find duplicate contacts for a given contact
   * Uses fuzzy matching on name, email, and phone
   */
  findDuplicatesForContact: staffProcedure
    .input(
      z.object({
        contactId: z.string().uuid(),
        threshold: z.number().min(0).max(100).optional().default(75),
      })
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = ctx.user.funeralHomeId ?? 'default';
      
      const duplicates = await runEffect(
        findDuplicates({
          funeralHomeId,
          targetContactId: input.contactId as any,
          minSimilarityScore: input.threshold,
        })
      );

      return duplicates.map((match) => ({
        contact: {
          id: match.contact.id,
          firstName: match.contact.firstName,
          lastName: match.contact.lastName,
          email: match.contact.email,
          phone: match.contact.phone,
          createdAt: match.contact.createdAt,
        },
        similarityScore: match.similarityScore,
        matchReasons: match.matchReasons,
      }));
    }),

  /**
   * Find all duplicate clusters in the database
   * Groups similar contacts together
   */
  findDuplicateClusters: staffProcedure
    .input(
      z.object({
        threshold: z.number().min(0).max(100).optional().default(75),
      })
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = ctx.user.funeralHomeId ?? 'default';
      
      const clusters = await runEffect(
        findDuplicateClusters(funeralHomeId, input.threshold)
      );

      return clusters.map((cluster) => ({
        contacts: cluster.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          createdAt: c.createdAt,
        })),
      }));
    }),

  /**
   * Check if a contact is a potential duplicate before creation
   * Used for inline duplicate detection in forms
   */
  checkPotentialDuplicate: staffProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        threshold: z.number().min(0).max(100).optional().default(75),
      })
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = ctx.user.funeralHomeId ?? 'default';
      
      // For potential duplicate check, we use findDuplicates without targetContactId
      // which will return all duplicates for the funeral home
      const duplicates = await runEffect(
        findDuplicates({
          funeralHomeId,
          minSimilarityScore: input.threshold,
        })
      );

      // Filter matches based on user input criteria
      const filteredMatches = duplicates.filter((match) => {
        if (!input.firstName && !input.lastName && !input.email && !input.phone) {
          return false;
        }
        
        let score = 0;
        if (input.firstName && match.contact.firstName?.toLowerCase().includes(input.firstName.toLowerCase())) score += 25;
        if (input.lastName && match.contact.lastName?.toLowerCase().includes(input.lastName.toLowerCase())) score += 25;
        if (input.email && match.contact.email?.toLowerCase() === input.email.toLowerCase()) score += 50;
        if (input.phone && match.contact.phone === input.phone) score += 50;
        
        return score >= 50;
      });

      return {
        hasDuplicates: filteredMatches.length > 0,
        duplicateCount: filteredMatches.length,
        topMatches: filteredMatches.slice(0, 3).map((match) => ({
          contact: {
            id: match.contact.id,
            firstName: match.contact.firstName,
            lastName: match.contact.lastName,
            email: match.contact.email,
            phone: match.contact.phone,
          },
          similarityScore: match.similarityScore,
          matchReasons: match.matchReasons,
        })),
      };
    }),
});
