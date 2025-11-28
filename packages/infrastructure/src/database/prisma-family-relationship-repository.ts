import { Effect } from 'effect';
import {
  type FamilyRelationshipRepositoryService,
  PersistenceError,
} from '@dykstra/application';
import { FamilyRelationship } from '@dykstra/domain';
import { prisma } from './prisma-client';

/**
 * Map Prisma model to Domain entity
 */
function toDomain(data: any): FamilyRelationship {
  // FamilyRelationship.create returns Effect, but we need to return the entity directly
  // This is safe because we know the data is already validated from the database
  return new FamilyRelationship({
    id: data.id as any,
    businessKey: data.businessKey,
    version: data.version,
    validFrom: data.validFrom,
    validTo: data.validTo,
    funeralHomeId: data.funeralHomeId,
    sourceContactId: data.sourceContactId as any,
    targetContactId: data.targetContactId as any,
    relationshipType: data.relationshipType,
    isPrimaryContact: data.isPrimaryContact,
    decedentId: data.decedentId as any,
    notes: data.notes,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdBy: data.createdBy,
  });
}

/**
 * Map Domain entity to Prisma model
 */
function toPrisma(relationship: FamilyRelationship) {
  return {
    id: relationship.id,
    businessKey: relationship.businessKey,
    version: relationship.version,
    validFrom: relationship.validFrom,
    validTo: relationship.validTo,
    isCurrent: relationship.isCurrent,
    funeralHomeId: relationship.funeralHomeId,
    sourceContactId: relationship.sourceContactId,
    targetContactId: relationship.targetContactId,
    relationshipType: relationship.relationshipType as any,
    isPrimaryContact: relationship.isPrimaryContact,
    decedentId: relationship.decedentId,
    notes: relationship.notes,
    createdAt: relationship.createdAt,
    updatedAt: relationship.updatedAt,
    createdBy: relationship.createdBy,
  };
}

/**
 * Prisma implementation of FamilyRelationshipRepository
 * Object-based repository following Clean Architecture
 */
export const PrismaFamilyRelationshipRepository: FamilyRelationshipRepositoryService = {
  findById: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const data = await prisma.familyRelationship.findFirst({
          where: {
            id,
            isCurrent: true, // Current version only
          },
        });
        return data ? toDomain(data) : null;
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to find relationship: ${String(error)}`,
          error
        ),
    }),

  findByContactId: (contactId: string, includeHistorical = false) =>
    Effect.tryPromise({
      try: async () => {
        const data = await prisma.familyRelationship.findMany({
          where: {
            OR: [{ sourceContactId: contactId }, { targetContactId: contactId }],
            ...(includeHistorical ? {} : { isCurrent: true }),
          },
          orderBy: { validFrom: 'desc' },
        });
        return data.map(toDomain);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to find relationships by contact: ${String(error)}`,
          error
        ),
    }),

  findByDecedentId: (decedentId: string) =>
    Effect.tryPromise({
      try: async () => {
        const data = await prisma.familyRelationship.findMany({
          where: {
            decedentId,
            isCurrent: true, // Current versions only
          },
          orderBy: { createdAt: 'desc' },
        });
        return data.map(toDomain);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to find relationships by decedent: ${String(error)}`,
          error
        ),
    }),

  findPrimaryContactForDecedent: (decedentId: string) =>
    Effect.tryPromise({
      try: async () => {
        const data = await prisma.familyRelationship.findFirst({
          where: {
            decedentId,
            isPrimaryContact: true,
            isCurrent: true, // Current version only
          },
          orderBy: { createdAt: 'desc' },
        });
        return data ? toDomain(data) : null;
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to find primary contact: ${String(error)}`,
          error
        ),
    }),

  findHistory: (sourceContactId: string, targetContactId: string) =>
    Effect.tryPromise({
      try: async () => {
        const data = await prisma.familyRelationship.findMany({
          where: {
            OR: [
              { sourceContactId, targetContactId },
              { sourceContactId: targetContactId, targetContactId: sourceContactId },
            ],
          },
          orderBy: { validFrom: 'desc' },
        });
        return data.map(toDomain);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to find relationship history: ${String(error)}`,
          error
        ),
    }),

  save: (relationship: FamilyRelationship) =>
    Effect.tryPromise({
      try: async () => {
        const data = await prisma.familyRelationship.create({
          data: toPrisma(relationship),
        });
        return toDomain(data);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to save relationship: ${String(error)}`,
          error
        ),
    }),

  delete: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        // Soft delete by setting isCurrent to false and validTo to now
        await prisma.familyRelationship.update({
          where: { id },
          data: { 
            isCurrent: false,
            validTo: new Date(),
          },
        });
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to delete relationship: ${String(error)}`,
          error
        ),
    }),
};
