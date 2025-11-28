import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { ContactEnrichment, type EnrichedProfile } from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';

/**
 * Enrichment router for contact data enrichment from email
 * Thin layer that delegates to ContactEnrichment service
 */
export const enrichmentRouter = router({
  /**
   * Enrich contact data from email address
   * Returns profile information, employment, social profiles
   */
  enrichFromEmail: staffProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ input }) => {
      const profile = await runEffect(
        Effect.gen(function* () {
          const service = yield* ContactEnrichment;
          return yield* service.enrichFromEmail(input.email);
        })
      );

      return {
        email: profile.email,
        fullName: profile.fullName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        photoUrl: profile.photoUrl,
        location: profile.location,
        employment: profile.employment
          ? {
              company: profile.employment.company,
              title: profile.employment.title,
              domain: profile.employment.domain,
            }
          : null,
        socialProfiles: profile.socialProfiles.map((sp) => ({
          platform: sp.platform,
          url: sp.url,
          username: sp.username,
        })),
        bio: profile.bio,
        confidence: profile.confidence,
      };
    }),

  /**
   * Batch enrich multiple email addresses
   * Limited to 50 emails per request
   */
  batchEnrich: staffProcedure
    .input(
      z.object({
        emails: z.array(z.string().email()).min(1).max(50),
      })
    )
    .mutation(async ({ input }) => {
      const profiles = await runEffect(
        Effect.gen(function* () {
          const service = yield* ContactEnrichment;
          return yield* service.batchEnrich(input.emails);
        })
      );

      return profiles
        .filter((profile): profile is EnrichedProfile => profile !== null)
        .map((profile) => ({
          email: profile.email,
          fullName: profile.fullName,
          firstName: profile.firstName,
          lastName: profile.lastName,
          photoUrl: profile.photoUrl,
          location: profile.location,
          employment: profile.employment
            ? {
                company: profile.employment.company,
                title: profile.employment.title,
                domain: profile.employment.domain,
              }
            : null,
          socialProfiles: profile.socialProfiles.map((sp) => ({
            platform: sp.platform,
            url: sp.url,
            username: sp.username,
          })),
          bio: profile.bio,
          confidence: profile.confidence,
        }));
    }),
});
