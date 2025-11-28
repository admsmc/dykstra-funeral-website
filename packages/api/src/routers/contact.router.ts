import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { 
  ContactRepository,
  mergeContacts 
} from '@dykstra/application';
import { Contact } from '@dykstra/domain';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';

/**
 * Contact type enum for validation
 */
const ContactTypeSchema = z.enum(['primary', 'secondary', 'professional', 'referral']);

/**
 * Relationship type enum for validation
 */
const RelationshipTypeSchema = z.enum(['spouse', 'child', 'parent', 'sibling', 'friend', 'clergy', 'attorney', 'other']);

/**
 * Grief stage enum for validation
 */
const GriefStageSchema = z.enum(['shock', 'denial', 'anger', 'bargaining', 'depression', 'acceptance']);

/**
 * Military branch enum for validation
 */
const MilitaryBranchSchema = z.enum(['army', 'navy', 'air_force', 'marines', 'coast_guard', 'space_force']);

/**
 * Language preference enum for validation
 */
const LanguagePreferenceSchema = z.enum(['en', 'es', 'fr', 'de', 'pl', 'it', 'zh', 'other']);

/**
 * Contact router
 * Handles CRM contact management operations
 */
export const contactRouter = router({
  /**
   * Create a new contact
   */
  create: staffProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        type: ContactTypeSchema,
        funeralHomeId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';
      
      const contact = await runEffect(
        Effect.gen(function* () {
          const newContact = yield* Contact.create({
            id: crypto.randomUUID(),
            businessKey: crypto.randomUUID(),
            funeralHomeId,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email ?? null,
            phone: input.phone ?? null,
            type: input.type,
            createdBy: ctx.user.id,
          });

          const repo = yield* ContactRepository;
          yield* repo.save(newContact);
          return newContact;
        })
      );

      return {
        id: contact.id,
        businessKey: contact.businessKey,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        type: contact.type,
        createdAt: contact.createdAt,
      };
    }),

  /**
   * Get contact by ID
   */
  getById: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          return yield* repo.findById(input.contactId as any);
        })
      );

      return {
        id: contact.id,
        businessKey: contact.businessKey,
        version: contact.version,
        funeralHomeId: contact.funeralHomeId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        alternatePhone: contact.alternatePhone,
        address: contact.address,
        city: contact.city,
        state: contact.state,
        zipCode: contact.zipCode,
        type: contact.type,
        relationshipType: contact.relationshipType,
        birthDate: contact.birthDate,
        notes: contact.notes,
        doNotContact: contact.doNotContact,
        emailOptIn: contact.emailOptIn,
        smsOptIn: contact.smsOptIn,
        tags: contact.tags,
        mergedIntoContactId: contact.mergedIntoContactId,
        // New grief journey fields
        isVeteran: contact.isVeteran,
        militaryBranch: contact.militaryBranch,
        religiousAffiliation: contact.religiousAffiliation,
        culturalPreferences: contact.culturalPreferences,
        dietaryRestrictions: contact.dietaryRestrictions,
        languagePreference: contact.languagePreference,
        griefStage: contact.griefStage,
        griefJourneyStartedAt: contact.griefJourneyStartedAt,
        decedentRelationshipId: contact.decedentRelationshipId,
        serviceAnniversaryDate: contact.serviceAnniversaryDate,
        lastGriefCheckIn: contact.lastGriefCheckIn,
        // Computed properties
        isInGriefJourney: contact.isInGriefJourney,
        needsGriefCheckIn: contact.needsGriefCheckIn,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        createdBy: contact.createdBy,
      };
    }),

  /**
   * List contacts by funeral home with filters
   */
  list: staffProcedure
    .input(
      z
        .object({
          funeralHomeId: z.string().optional(),
          tags: z.array(z.string()).optional(),
          canEmail: z.boolean().optional(),
          canSMS: z.boolean().optional(),
          type: ContactTypeSchema.optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input?.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const allContacts = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          return yield* repo.findByFuneralHome(funeralHomeId, {
            tags: input?.tags,
            canEmail: input?.canEmail,
            canSMS: input?.canSMS,
            type: input?.type,
          });
        })
      );

      // Apply cursor pagination
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;
      const cursorIndex = cursor ? allContacts.findIndex(c => c.id === cursor) : -1;
      const startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
      const paginatedContacts = allContacts.slice(startIndex, startIndex + limit);

      const lastContact = paginatedContacts[paginatedContacts.length - 1];
      const nextCursor = paginatedContacts.length === limit && lastContact ? lastContact.id : undefined;

      return {
        items: paginatedContacts.map((contact) => ({
          id: contact.id,
          businessKey: contact.businessKey,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          type: contact.type,
          tags: contact.tags,
          emailOptIn: contact.emailOptIn,
          smsOptIn: contact.smsOptIn,
          doNotContact: contact.doNotContact,
          createdAt: contact.createdAt,
        })),
        nextCursor,
        hasMore: !!nextCursor,
        total: allContacts.length,
      };
    }),

  /**
   * Find contacts by email
   */
  findByEmail: staffProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ input }) => {
      const contacts = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          return yield* repo.findByEmail(input.email);
        })
      );

      return contacts.map((contact) => ({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        type: contact.type,
        funeralHomeId: contact.funeralHomeId,
      }));
    }),

  /**
   * Find contacts by phone
   */
  findByPhone: staffProcedure
    .input(
      z.object({
        phone: z.string(),
      })
    )
    .query(async ({ input }) => {
      const contacts = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          return yield* repo.findByPhone(input.phone);
        })
      );

      return contacts.map((contact) => ({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        type: contact.type,
        funeralHomeId: contact.funeralHomeId,
      }));
    }),

  /**
   * Update contact information
   */
  updateInfo: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        alternatePhone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        zipCode: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const updatedContact = currentContact.updateContactInfo({
            email: input.email,
            phone: input.phone,
            alternatePhone: input.alternatePhone,
            address: input.address,
            city: input.city,
            state: input.state,
            zipCode: input.zipCode,
          });
          return yield* repo.update(updatedContact);
        })
      );

      return {
        id: contact.id,
        email: contact.email,
        phone: contact.phone,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Update relationship type
   */
  updateRelationship: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
        relationshipType: RelationshipTypeSchema,
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const updatedContact = currentContact.updateRelationship(input.relationshipType);
          return yield* repo.update(updatedContact);
        })
      );

      return {
        id: contact.id,
        relationshipType: contact.relationshipType,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Add tag to contact
   */
  addTag: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
        tag: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const taggedContact = currentContact.addTag(input.tag);
          return yield* repo.update(taggedContact);
        })
      );

      return {
        id: contact.id,
        tags: contact.tags,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Remove tag from contact
   */
  removeTag: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
        tag: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const untaggedContact = currentContact.removeTag(input.tag);
          return yield* repo.update(untaggedContact);
        })
      );

      return {
        id: contact.id,
        tags: contact.tags,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Update opt-in preferences
   */
  updateOptIns: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
        emailOptIn: z.boolean().optional(),
        smsOptIn: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          let currentContact = yield* repo.findById(input.contactId as any);
          
          if (input.emailOptIn !== undefined) {
            currentContact = input.emailOptIn ? currentContact.optInEmail() : currentContact.optOutEmail();
          }
          if (input.smsOptIn !== undefined) {
            currentContact = input.smsOptIn ? currentContact.optInSMS() : currentContact.optOutSMS();
          }
          
          return yield* repo.update(currentContact);
        })
      );

      return {
        id: contact.id,
        emailOptIn: contact.emailOptIn,
        smsOptIn: contact.smsOptIn,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Mark as do not contact
   */
  markDoNotContact: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const markedContact = currentContact.markDoNotContact();
          return yield* repo.update(markedContact);
        })
      );

      return {
        id: contact.id,
        doNotContact: contact.doNotContact,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Merge two contacts
   */
  merge: staffProcedure
    .input(
      z.object({
        sourceContactId: z.string(),
        targetContactId: z.string(),
        mergedBy: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const targetContact = await runEffect(
        mergeContacts({
          sourceContactBusinessKey: input.sourceContactId,
          targetContactBusinessKey: input.targetContactId,
        })
      );

      return {
        targetContact: {
          id: targetContact.id,
          firstName: targetContact.firstName,
          lastName: targetContact.lastName,
          email: targetContact.email,
          phone: targetContact.phone,
        },
      };
    }),

  /**
   * Get contact history (SCD Type 2)
   */
  getHistory: staffProcedure
    .input(
      z.object({
        businessKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      const history = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          return yield* repo.findHistory(input.businessKey);
        })
      );

      return history.map((contact) => ({
        id: contact.id,
        businessKey: contact.businessKey,
        version: contact.version,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        type: contact.type,
        tags: contact.tags,
        emailOptIn: contact.emailOptIn,
        smsOptIn: contact.smsOptIn,
        doNotContact: contact.doNotContact,
        mergedIntoContactId: contact.mergedIntoContactId,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        createdBy: contact.createdBy,
      }));
    }),

  /**
   * Start grief journey for a contact
   */
  startGriefJourney: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
        decedentRelationshipId: z.string().uuid(),
        serviceAnniversaryDate: z.string().datetime(),
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const updated = yield* currentContact.startGriefJourney({
            decedentRelationshipId: input.decedentRelationshipId,
            serviceAnniversaryDate: new Date(input.serviceAnniversaryDate),
          });
          return yield* repo.update(updated);
        })
      );

      return {
        id: contact.id,
        griefStage: contact.griefStage,
        griefJourneyStartedAt: contact.griefJourneyStartedAt,
        decedentRelationshipId: contact.decedentRelationshipId,
        serviceAnniversaryDate: contact.serviceAnniversaryDate,
        isInGriefJourney: contact.isInGriefJourney,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Update grief stage
   */
  updateGriefStage: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
        griefStage: GriefStageSchema,
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const updated = currentContact.updateGriefStage(input.griefStage);
          return yield* repo.update(updated);
        })
      );

      return {
        id: contact.id,
        griefStage: contact.griefStage,
        lastGriefCheckIn: contact.lastGriefCheckIn,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Record grief check-in
   */
  recordGriefCheckIn: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const updated = currentContact.recordGriefCheckIn();
          return yield* repo.update(updated);
        })
      );

      return {
        id: contact.id,
        lastGriefCheckIn: contact.lastGriefCheckIn,
        needsGriefCheckIn: contact.needsGriefCheckIn,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Update veteran information
   */
  updateVeteranInfo: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
        isVeteran: z.boolean(),
        militaryBranch: MilitaryBranchSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const updated = currentContact.updateVeteranInfo({
            isVeteran: input.isVeteran,
            militaryBranch: input.militaryBranch || null,
          });
          return yield* repo.update(updated);
        })
      );

      return {
        id: contact.id,
        isVeteran: contact.isVeteran,
        militaryBranch: contact.militaryBranch,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Update cultural preferences
   */
  updateCulturalPreferences: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
        religiousAffiliation: z.string().optional(),
        culturalPreferences: z.array(z.string()).optional(),
        dietaryRestrictions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const updated = currentContact.updateCulturalPreferences({
            religiousAffiliation: input.religiousAffiliation || null,
            culturalPreferences: input.culturalPreferences,
            dietaryRestrictions: input.dietaryRestrictions,
          });
          return yield* repo.update(updated);
        })
      );

      return {
        id: contact.id,
        religiousAffiliation: contact.religiousAffiliation,
        culturalPreferences: contact.culturalPreferences,
        dietaryRestrictions: contact.dietaryRestrictions,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Update language preference
   */
  updateLanguagePreference: staffProcedure
    .input(
      z.object({
        contactId: z.string(),
        languagePreference: LanguagePreferenceSchema,
      })
    )
    .mutation(async ({ input }) => {
      const contact = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const currentContact = yield* repo.findById(input.contactId as any);
          const updated = currentContact.updateLanguagePreference(input.languagePreference);
          return yield* repo.update(updated);
        })
      );

      return {
        id: contact.id,
        languagePreference: contact.languagePreference,
        updatedAt: contact.updatedAt,
      };
    }),

  /**
   * Get contacts needing grief check-in
   */
  getContactsNeedingGriefCheckIn: staffProcedure
    .input(
      z.object({
        funeralHomeId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const funeralHomeId = input.funeralHomeId ?? ctx.user.funeralHomeId ?? 'default';

      const contacts = await runEffect(
        Effect.gen(function* () {
          const repo = yield* ContactRepository;
          const allContacts = yield* repo.findByFuneralHome(funeralHomeId, {});
          // Filter contacts in grief journey that need check-in
          return allContacts.filter((c) => c.isInGriefJourney && c.needsGriefCheckIn);
        })
      );

      return contacts.map((contact) => ({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        griefStage: contact.griefStage,
        griefJourneyStartedAt: contact.griefJourneyStartedAt,
        lastGriefCheckIn: contact.lastGriefCheckIn,
        serviceAnniversaryDate: contact.serviceAnniversaryDate,
      }));
    }),
});
