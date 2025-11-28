import { Effect, Layer } from 'effect';
import { 
  Contact, 
  type ContactId, 
  type ContactType, 
  type RelationshipType, 
  type GriefStage,
  type MilitaryBranch,
  type LanguagePreference,
  NotFoundError 
} from '@dykstra/domain';
import { ContactRepository, type ContactRepositoryService, PersistenceError } from '@dykstra/application';
import { ContactType as PrismaContactType, RelationshipType as PrismaRelationshipType } from '@prisma/client';
import { prisma } from './prisma-client';

/**
 * Map Prisma contact to domain Contact entity
 */
const toDomain = (prismaContact: any): Contact => {
  return new Contact({
    id: prismaContact.id as ContactId,
    businessKey: prismaContact.businessKey,
    version: prismaContact.version,
    funeralHomeId: prismaContact.funeralHomeId,
    firstName: prismaContact.firstName,
    lastName: prismaContact.lastName,
    email: prismaContact.email,
    phone: prismaContact.phone,
    alternatePhone: prismaContact.alternatePhone,
    address: prismaContact.address,
    city: prismaContact.city,
    state: prismaContact.state,
    zipCode: prismaContact.zipCode,
    type: prismaContact.type.toLowerCase() as ContactType,
    relationshipType: prismaContact.relationshipType?.toLowerCase() as RelationshipType | null,
    birthDate: prismaContact.birthDate,
    notes: prismaContact.notes,
    doNotContact: prismaContact.doNotContact,
    emailOptIn: prismaContact.emailOptIn,
    smsOptIn: prismaContact.smsOptIn,
    tags: prismaContact.tags,
    mergedIntoContactId: prismaContact.mergedIntoContactId,
    // Funeral-specific fields
    isVeteran: prismaContact.isVeteran ?? false,
    militaryBranch: prismaContact.militaryBranch?.toLowerCase() as MilitaryBranch | null,
    religiousAffiliation: prismaContact.religiousAffiliation,
    culturalPreferences: prismaContact.culturalPreferences ?? [],
    dietaryRestrictions: prismaContact.dietaryRestrictions ?? [],
    languagePreference: (prismaContact.languagePreference?.toLowerCase() ?? 'en') as LanguagePreference,
    // Grief journey fields
    griefStage: prismaContact.griefStage?.toLowerCase() as GriefStage | null,
    griefJourneyStartedAt: prismaContact.griefJourneyStartedAt,
    decedentRelationshipId: prismaContact.decedentRelationshipId,
    serviceAnniversaryDate: prismaContact.serviceAnniversaryDate,
    lastGriefCheckIn: prismaContact.lastGriefCheckIn,
    createdAt: prismaContact.createdAt,
    updatedAt: prismaContact.updatedAt,
    createdBy: prismaContact.createdBy,
  });
};

/**
 * Map domain Contact to Prisma format
 */
const toPrisma = (contact: Contact, validFrom: Date = new Date()) => {
  return {
    id: contact.id,
    businessKey: contact.businessKey,
    version: contact.version,
    validFrom,
    validTo: null,
    isCurrent: true,
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
    type: contact.type.toUpperCase() as PrismaContactType,
    relationshipType: contact.relationshipType?.toUpperCase() as PrismaRelationshipType | null,
    birthDate: contact.birthDate,
    notes: contact.notes,
    doNotContact: contact.doNotContact,
    emailOptIn: contact.emailOptIn,
    smsOptIn: contact.smsOptIn,
    tags: [...contact.tags],
    mergedIntoContactId: contact.mergedIntoContactId,
    // Funeral-specific fields
    isVeteran: contact.isVeteran,
    militaryBranch: contact.militaryBranch ? (contact.militaryBranch.toUpperCase() as any) : null,
    religiousAffiliation: contact.religiousAffiliation,
    culturalPreferences: [...contact.culturalPreferences],
    dietaryRestrictions: [...contact.dietaryRestrictions],
    languagePreference: contact.languagePreference.toUpperCase() as any,
    // Grief journey fields
    griefStage: contact.griefStage ? (contact.griefStage.toUpperCase() as any) : null,
    griefJourneyStartedAt: contact.griefJourneyStartedAt,
    decedentRelationshipId: contact.decedentRelationshipId,
    serviceAnniversaryDate: contact.serviceAnniversaryDate,
    lastGriefCheckIn: contact.lastGriefCheckIn,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
    createdBy: contact.createdBy,
  };
};

/**
 * Prisma implementation of ContactRepository with SCD Type 2 temporal support
 */
export const PrismaContactRepository: ContactRepositoryService = {
  findById: (id: ContactId) =>
    Effect.tryPromise({
      try: async () => {
        const contact = await prisma.contact.findFirst({
          where: {
            OR: [
              { id },
              { businessKey: id, isCurrent: true },
            ],
          },
        });

        if (!contact) {
          throw new NotFoundError({
            message: `Contact with ID ${id} not found`,
            entityType: 'Contact',
            entityId: id,
          });
        }

        return toDomain(contact);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find contact', error);
      },
    }),

  findByBusinessKey: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const contact = await prisma.contact.findFirst({
          where: { businessKey, isCurrent: true },
        });
        return contact ? toDomain(contact) : null;
      },
      catch: (error) => new PersistenceError('Failed to find contact by business key', error),
    }),

  findHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const contacts = await prisma.contact.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' },
        });

        if (contacts.length === 0) {
          throw new NotFoundError({
            message: `Contact ${businessKey} not found`,
            entityType: 'Contact',
            entityId: businessKey,
          });
        }

        return contacts.map(toDomain);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to find contact history', error);
      },
    }),

  findByFuneralHome: (funeralHomeId: string, filters = {}) =>
    Effect.tryPromise({
      try: async () => {
        const contacts = await prisma.contact.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            mergedIntoContactId: null, // Exclude merged contacts
            ...(filters.tags && filters.tags.length > 0 && {
              tags: { hasSome: filters.tags as string[] }
            }),
            ...(filters.canEmail !== undefined && { 
              emailOptIn: filters.canEmail,
              doNotContact: false,
            }),
            ...(filters.canSMS !== undefined && { 
              smsOptIn: filters.canSMS,
              doNotContact: false,
            }),
            ...(filters.type && { type: filters.type.toUpperCase() as PrismaContactType }),
          },
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' },
          ],
        });

        return contacts.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find contacts by funeral home', error),
    }),

  findByTag: (funeralHomeId: string, tag: string) =>
    Effect.tryPromise({
      try: async () => {
        const normalizedTag = tag.toLowerCase();
        const contacts = await prisma.contact.findMany({
          where: {
            funeralHomeId,
            isCurrent: true,
            mergedIntoContactId: null,
            tags: { has: normalizedTag },
          },
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' },
          ],
        });

        return contacts.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find contacts by tag', error),
    }),

  findByEmail: (email: string) =>
    Effect.tryPromise({
      try: async () => {
        const contacts = await prisma.contact.findMany({
          where: {
            email: { equals: email, mode: 'insensitive' },
            isCurrent: true,
            mergedIntoContactId: null,
          },
          orderBy: { createdAt: 'desc' },
        });

        return contacts.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find contacts by email', error),
    }),

  findByPhone: (phone: string) =>
    Effect.tryPromise({
      try: async () => {
        // Normalize phone for search (remove non-digits)
        const normalizedPhone = phone.replace(/\D/g, '');
        
        const contacts = await prisma.contact.findMany({
          where: {
            isCurrent: true,
            mergedIntoContactId: null,
            OR: [
              { phone: { contains: normalizedPhone } },
              { alternatePhone: { contains: normalizedPhone } },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        return contacts.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find contacts by phone', error),
    }),

  findMergedContacts: (targetContactId: ContactId) =>
    Effect.tryPromise({
      try: async () => {
        const contacts = await prisma.contact.findMany({
          where: {
            mergedIntoContactId: targetContactId,
            isCurrent: true,
          },
          orderBy: { updatedAt: 'desc' },
        });

        return contacts.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find merged contacts', error),
    }),

  save: (contact: Contact) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();

        if (contact.version === 1) {
          // Initial save
          await prisma.contact.create({
            data: toPrisma(contact, now),
          });
        } else {
          // SCD2 update
          await prisma.$transaction(async (tx) => {
            // Close current version
            await tx.contact.updateMany({
              where: { businessKey: contact.businessKey, isCurrent: true },
              data: { validTo: now, isCurrent: false },
            });

            // Insert new version
            await tx.contact.create({
              data: {
                ...toPrisma(contact, now),
                createdAt: contact.createdAt, // Preserve original
              },
            });
          });
        }
      },
      catch: (error) => new PersistenceError('Failed to save contact', error),
    }),

  update: (contact: Contact) =>
    Effect.gen(function* () {
      yield* PrismaContactRepository.save(contact);
      return contact;
    }),

  delete: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const result = await prisma.contact.updateMany({
          where: { businessKey, isCurrent: true },
          data: { validTo: now, isCurrent: false },
        });

        if (result.count === 0) {
          throw new NotFoundError({
            message: `Contact ${businessKey} not found`,
            entityType: 'Contact',
            entityId: businessKey,
          });
        }
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError('Failed to delete contact', error);
      },
    }),
};

/**
 * Layer for dependency injection
 */
export const PrismaContactRepositoryLive = Layer.succeed(
  ContactRepository,
  PrismaContactRepository
);
