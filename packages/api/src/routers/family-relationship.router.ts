import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { FamilyRelationshipRepository } from '@dykstra/application';
import { FamilyRelationship } from '@dykstra/domain';
import { runEffect } from '../utils/effect-runner';
import { Effect } from 'effect';

/**
 * Zod schema for FamilyRelationshipType enum
 */
const familyRelationshipTypeSchema = z.enum([
  'spouse',
  'child',
  'parent',
  'sibling',
  'grandchild',
  'grandparent',
  'niece_nephew',
  'aunt_uncle',
  'cousin',
  'in_law',
  'step_relation',
  'friend',
  'other',
]);

/**
 * Family relationship router with SCD2 temporal tracking
 * Thin layer that delegates to FamilyRelationshipRepository
 */
export const familyRelationshipRouter = router({
  /**
   * Create a new family relationship
   */
  create: staffProcedure
    .input(
      z.object({
        sourceContactId: z.string().uuid(),
        targetContactId: z.string().uuid(),
        relationshipType: familyRelationshipTypeSchema,
        isPrimaryContact: z.boolean().optional().default(false),
        decedentId: z.string().uuid().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const relationship = await runEffect(
        Effect.gen(function* () {
          const repo = yield* FamilyRelationshipRepository;
          
          const newRelationship = yield* FamilyRelationship.create({
            id: crypto.randomUUID(),
            businessKey: crypto.randomUUID(),
            funeralHomeId: ctx.user.funeralHomeId ?? 'default',
            sourceContactId: input.sourceContactId as any,
            targetContactId: input.targetContactId as any,
            relationshipType: input.relationshipType as any,
            isPrimaryContact: input.isPrimaryContact,
            decedentId: (input.decedentId || null) as any,
            createdBy: ctx.user.id,
          });

          return yield* repo.save(newRelationship);
        })
      );

      return {
        id: relationship.id,
        sourceContactId: relationship.sourceContactId,
        targetContactId: relationship.targetContactId,
        relationshipType: relationship.relationshipType,
        inverseRelationshipType: relationship.inverseRelationshipType,
        isPrimaryContact: relationship.isPrimaryContact,
        decedentId: relationship.decedentId,
        notes: relationship.notes,
        validFrom: relationship.validFrom,
        validTo: relationship.validTo,
        isCurrent: relationship.isCurrent,
        createdAt: relationship.createdAt,
        updatedAt: relationship.updatedAt,
      };
    }),

  /**
   * Update an existing relationship (creates new SCD2 version)
   */
  update: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        relationshipType: familyRelationshipTypeSchema.optional(),
        isPrimaryContact: z.boolean().optional(),
        decedentId: z.string().uuid().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const relationship = await runEffect(
        Effect.gen(function* () {
          const repo = yield* FamilyRelationshipRepository;
          
          // Get current version
          const current = yield* repo.findById(input.id);
          if (!current) {
            throw new Error('Relationship not found');
          }

          // Create new version with updated data (SCD2 pattern)
          const updated = current.createNewVersion({
            relationshipType: input.relationshipType,
            isPrimaryContact: input.isPrimaryContact,
            decedentId: input.decedentId as any,
            notes: input.notes ?? undefined,
          });

          // End current version and save new version (SCD2 pattern)
          const ended = current.endValidity();
          yield* repo.save(ended);
          return yield* repo.save(updated);
        })
      );

      return {
        id: relationship.id,
        sourceContactId: relationship.sourceContactId,
        targetContactId: relationship.targetContactId,
        relationshipType: relationship.relationshipType,
        inverseRelationshipType: relationship.inverseRelationshipType,
        isPrimaryContact: relationship.isPrimaryContact,
        decedentId: relationship.decedentId,
        notes: relationship.notes,
        validFrom: relationship.validFrom,
        validTo: relationship.validTo,
        isCurrent: relationship.isCurrent,
        createdAt: relationship.createdAt,
        updatedAt: relationship.updatedAt,
      };
    }),

  /**
   * End a relationship (soft delete via SCD2)
   */
  end: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      await runEffect(
        Effect.gen(function* () {
          const repo = yield* FamilyRelationshipRepository;
          
          const relationship = yield* repo.findById(input.id);
          if (!relationship) {
            throw new Error('Relationship not found');
          }

          const ended = relationship.endValidity();
          return yield* repo.save(ended);
        })
      );

      return { success: true };
    }),

  /**
   * Get relationship by ID (current version)
   */
  getById: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const relationship = await runEffect(
        Effect.gen(function* () {
          const repo = yield* FamilyRelationshipRepository;
          return yield* repo.findById(input.id);
        })
      );

      if (!relationship) {
        throw new Error('Relationship not found');
      }

      return {
        id: relationship.id,
        sourceContactId: relationship.sourceContactId,
        targetContactId: relationship.targetContactId,
        relationshipType: relationship.relationshipType,
        inverseRelationshipType: relationship.inverseRelationshipType,
        isPrimaryContact: relationship.isPrimaryContact,
        decedentId: relationship.decedentId,
        notes: relationship.notes,
        validFrom: relationship.validFrom,
        validTo: relationship.validTo,
        isCurrent: relationship.isCurrent,
        createdAt: relationship.createdAt,
        updatedAt: relationship.updatedAt,
      };
    }),

  /**
   * Get all relationships for a contact
   */
  getByContactId: staffProcedure
    .input(
      z.object({
        contactId: z.string().uuid(),
        includeHistorical: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      const relationships = await runEffect(
        Effect.gen(function* () {
          const repo = yield* FamilyRelationshipRepository;
          return yield* repo.findByContactId(input.contactId, input.includeHistorical);
        })
      );

      return relationships.map((rel) => ({
        id: rel.id,
        sourceContactId: rel.sourceContactId,
        targetContactId: rel.targetContactId,
        relationshipType: rel.relationshipType,
        inverseRelationshipType: rel.inverseRelationshipType,
        isPrimaryContact: rel.isPrimaryContact,
        decedentId: rel.decedentId,
        notes: rel.notes,
        validFrom: rel.validFrom,
        validTo: rel.validTo,
        isCurrent: rel.isCurrent,
        createdAt: rel.createdAt,
        updatedAt: rel.updatedAt,
      }));
    }),

  /**
   * Get all relationships for a decedent
   */
  getByDecedentId: staffProcedure
    .input(
      z.object({
        decedentId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const relationships = await runEffect(
        Effect.gen(function* () {
          const repo = yield* FamilyRelationshipRepository;
          return yield* repo.findByDecedentId(input.decedentId);
        })
      );

      return relationships.map((rel) => ({
        id: rel.id,
        sourceContactId: rel.sourceContactId,
        targetContactId: rel.targetContactId,
        relationshipType: rel.relationshipType,
        inverseRelationshipType: rel.inverseRelationshipType,
        isPrimaryContact: rel.isPrimaryContact,
        decedentId: rel.decedentId,
        notes: rel.notes,
        validFrom: rel.validFrom,
        validTo: rel.validTo,
        isCurrent: rel.isCurrent,
        createdAt: rel.createdAt,
        updatedAt: rel.updatedAt,
      }));
    }),

  /**
   * Get primary contact for a decedent
   */
  getPrimaryContact: staffProcedure
    .input(
      z.object({
        decedentId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const relationship = await runEffect(
        Effect.gen(function* () {
          const repo = yield* FamilyRelationshipRepository;
          return yield* repo.findPrimaryContactForDecedent(input.decedentId);
        })
      );

      if (!relationship) {
        return null;
      }

      return {
        id: relationship.id,
        sourceContactId: relationship.sourceContactId,
        targetContactId: relationship.targetContactId,
        relationshipType: relationship.relationshipType,
        inverseRelationshipType: relationship.inverseRelationshipType,
        isPrimaryContact: relationship.isPrimaryContact,
        decedentId: relationship.decedentId,
        notes: relationship.notes,
        validFrom: relationship.validFrom,
        validTo: relationship.validTo,
        isCurrent: relationship.isCurrent,
        createdAt: relationship.createdAt,
        updatedAt: relationship.updatedAt,
      };
    }),

  /**
   * Get relationship history for audit trail
   */
  getHistory: staffProcedure
    .input(
      z.object({
        sourceContactId: z.string().uuid(),
        targetContactId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const history = await runEffect(
        Effect.gen(function* () {
          const repo = yield* FamilyRelationshipRepository;
          return yield* repo.findHistory(input.sourceContactId, input.targetContactId);
        })
      );

      return history.map((rel) => ({
        id: rel.id,
        sourceContactId: rel.sourceContactId,
        targetContactId: rel.targetContactId,
        relationshipType: rel.relationshipType,
        inverseRelationshipType: rel.inverseRelationshipType,
        isPrimaryContact: rel.isPrimaryContact,
        decedentId: rel.decedentId,
        notes: rel.notes,
        validFrom: rel.validFrom,
        validTo: rel.validTo,
        isCurrent: rel.isCurrent,
        createdAt: rel.createdAt,
        updatedAt: rel.updatedAt,
      }));
    }),
});
