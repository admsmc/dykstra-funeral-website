import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { 
  AddressValidation,
  PhoneValidation,
  ContactEnrichment,
} from '@dykstra/application';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';

/**
 * Validation router for address, phone, and email validation
 * Thin layer that delegates to validation services
 */
export const validationRouter = router({
  /**
   * Get address suggestions from partial input
   */
  addressAutocomplete: staffProcedure
    .input(
      z.object({
        input: z.string().min(1).max(200),
      })
    )
    .query(async ({ input }) => {
      const suggestions = await runEffect(
        Effect.gen(function* () {
          const service = yield* AddressValidation;
          return yield* service.autocomplete(input.input);
        })
      );

      return suggestions.map((s) => ({
        placeId: s.placeId,
        description: s.description,
        mainText: s.mainText,
        secondaryText: s.secondaryText,
      }));
    }),

  /**
   * Validate and structure a full address
   */
  validateAddress: staffProcedure
    .input(
      z.object({
        address: z.string().min(1).max(500),
      })
    )
    .query(async ({ input }) => {
      const validated = await runEffect(
        Effect.gen(function* () {
          const service = yield* AddressValidation;
          return yield* service.validate(input.address);
        })
      );

      return {
        streetNumber: validated.streetNumber,
        streetName: validated.streetName,
        fullStreetAddress: validated.fullStreetAddress,
        city: validated.city,
        state: validated.state,
        zipCode: validated.zipCode,
        country: validated.country,
        coordinates: {
          latitude: validated.coordinates.latitude,
          longitude: validated.coordinates.longitude,
        },
        isDeliverable: validated.isDeliverable,
        formattedAddress: validated.formattedAddress,
      };
    }),

  /**
   * Get coordinates for an address
   */
  geocodeAddress: staffProcedure
    .input(
      z.object({
        address: z.string().min(1).max(500),
      })
    )
    .query(async ({ input }) => {
      const coordinates = await runEffect(
        Effect.gen(function* () {
          const service = yield* AddressValidation;
          return yield* service.geocode(input.address);
        })
      );

      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
    }),

  /**
   * Get full address details from Google Place ID
   */
  getPlaceDetails: staffProcedure
    .input(
      z.object({
        placeId: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const validated = await runEffect(
        Effect.gen(function* () {
          const service = yield* AddressValidation;
          return yield* service.getPlaceDetails(input.placeId);
        })
      );

      return {
        streetNumber: validated.streetNumber,
        streetName: validated.streetName,
        fullStreetAddress: validated.fullStreetAddress,
        city: validated.city,
        state: validated.state,
        zipCode: validated.zipCode,
        country: validated.country,
        coordinates: {
          latitude: validated.coordinates.latitude,
          longitude: validated.coordinates.longitude,
        },
        isDeliverable: validated.isDeliverable,
        formattedAddress: validated.formattedAddress,
      };
    }),

  /**
   * Validate and format a phone number
   */
  validatePhone: staffProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(1),
        countryCode: z.string().length(2).optional(),
      })
    )
    .query(async ({ input }) => {
      const validated = await runEffect(
        Effect.gen(function* () {
          const service = yield* PhoneValidation;
          return yield* service.validate(input.phoneNumber, input.countryCode);
        })
      );

      return {
        phoneNumber: validated.phoneNumber,
        nationalFormat: validated.nationalFormat,
        internationalFormat: validated.internationalFormat,
        countryCode: validated.countryCode,
        isValid: validated.isValid,
        isPossible: validated.isPossible,
        carrier: validated.carrier,
        canReceiveSMS: validated.canReceiveSMS,
      };
    }),

  /**
   * Format phone number to E.164 standard
   */
  formatPhoneE164: staffProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(1),
        countryCode: z.string().length(2).optional(),
      })
    )
    .query(async ({ input }) => {
      const formatted = await runEffect(
        Effect.gen(function* () {
          const service = yield* PhoneValidation;
          return yield* service.formatE164(input.phoneNumber, input.countryCode);
        })
      );

      return { formatted };
    }),

  /**
   * Format phone number to national format
   */
  formatPhoneNational: staffProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(1),
        countryCode: z.string().length(2).optional(),
      })
    )
    .query(async ({ input }) => {
      const formatted = await runEffect(
        Effect.gen(function* () {
          const service = yield* PhoneValidation;
          return yield* service.formatNational(input.phoneNumber, input.countryCode);
        })
      );

      return { formatted };
    }),

  /**
   * Check if phone number can receive SMS
   */
  canReceiveSMS: staffProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const canReceiveSMS = await runEffect(
        Effect.gen(function* () {
          const service = yield* PhoneValidation;
          return yield* service.canReceiveSMS(input.phoneNumber);
        })
      );

      return { canReceiveSMS };
    }),

  /**
   * Verify email address deliverability
   */
  verifyEmail: staffProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ input }) => {
      const verification = await runEffect(
        Effect.gen(function* () {
          const service = yield* ContactEnrichment;
          return yield* service.verifyEmail(input.email);
        })
      );

      return {
        email: verification.email,
        isValid: verification.isValid,
        isDeliverable: verification.isDeliverable,
        isDisposable: verification.isDisposable,
        isCatchAll: verification.isCatchAll,
        didYouMean: verification.didYouMean,
        score: verification.score,
      };
    }),

  /**
   * Suggest email correction for typos
   */
  suggestEmailCorrection: staffProcedure
    .input(
      z.object({
        email: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const suggestion = await runEffect(
        Effect.gen(function* () {
          const service = yield* ContactEnrichment;
          return yield* service.suggestEmailCorrection(input.email);
        })
      );

      return { suggestion };
    }),

  /**
   * Check if email is from disposable provider
   */
  isDisposableEmail: staffProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ input }) => {
      const isDisposable = await runEffect(
        Effect.gen(function* () {
          const service = yield* ContactEnrichment;
          return yield* service.isDisposableEmail(input.email);
        })
      );

      return { isDisposable };
    }),
});
