import { Effect } from 'effect';
import { ContactManagementPolicy, NotFoundError } from '@dykstra/domain';
import { ContactManagementPolicyRepositoryService, PersistenceError } from '@dykstra/application';
import { randomUUID } from 'crypto';

/**
 * Contact Management Policy Adapter
 *
 * Object-based adapter (NOT class-based) for contact policy persistence.
 * Implements SCD2 (Slowly Changing Dimension Type 2) temporal pattern.
 *
 * In production, this would query a database (Prisma PostgreSQL).
 * For now, uses in-memory storage for development/testing.
 */

// In-memory storage for development
let policyStore: Map<string, ContactManagementPolicy[]> = new Map();

/**
 * Create Contact Management Policy Adapter
 *
 * Returns an object implementing ContactManagementPolicyRepositoryService.
 * All methods follow Effect-TS error handling pattern.
 */
export const ContactManagementPolicyAdapter = (): ContactManagementPolicyRepositoryService => ({
  /**
   * Find current active policy for a funeral home
   * Returns the policy with isCurrent=true for the given funeralHomeId
   */
  findCurrentByFuneralHomeId: (funeralHomeId: string) =>
    Effect.try({
      try: () => {
        const policies = policyStore.get(funeralHomeId) ?? [];
        const current = policies.find((p) => p.isCurrent);

        if (!current) {
          throw new NotFoundError({
            message: `No active contact management policy found for funeral home: ${funeralHomeId}`,
            entityType: 'ContactManagementPolicy',
            entityId: funeralHomeId
          });
        }

        return current;
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(`Failed to find contact policy: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Find all versions of a policy (historical tracking)
   * Returns all versions (both current and closed) for a given funeral home
   */
  findAllVersionsByFuneralHomeId: (funeralHomeId: string) =>
    Effect.try({
      try: () => {
        const policies = policyStore.get(funeralHomeId) ?? [];
        if (policies.length === 0) {
          throw new NotFoundError({
            message: `No policies found for funeral home: ${funeralHomeId}`,
            entityType: 'ContactManagementPolicy',
            entityId: funeralHomeId
          });
        }
        return policies;
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(`Failed to find policy versions: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Find a specific policy version by ID
   */
  findById: (id: string) =>
    Effect.try({
      try: () => {
        for (const policies of policyStore.values()) {
          const policy = policies.find((p) => p.id === id);
          if (policy) {
            return policy;
          }
        }

        throw new NotFoundError({
          message: `Policy not found with id: ${id}`,
          entityType: 'ContactManagementPolicy',
          entityId: id
        });
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(`Failed to find policy by id: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Create a new policy (version 1)
   */
  create: (policy) =>
    Effect.try({
      try: () => {
        const newPolicy: ContactManagementPolicy = new ContactManagementPolicy({
          ...policy,
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const funeralHomeId = newPolicy.funeralHomeId;
        const policies = policyStore.get(funeralHomeId) ?? [];
        policies.push(newPolicy);
        policyStore.set(funeralHomeId, policies);

        return newPolicy;
      },
      catch: (error) =>
        new PersistenceError(`Failed to create policy: ${error instanceof Error ? error.message : String(error)}`)
    }),

  /**
   * Update policy (closes current version, creates new version - SCD2 pattern)
   */
  update: (funeralHomeId: string, updates) =>
    Effect.try({
      try: () => {
        // Find current version
        const policies = policyStore.get(funeralHomeId) ?? [];
        const current = policies.find((p) => p.isCurrent);

        if (!current) {
          throw new NotFoundError({
            message: `No active policy found for funeral home: ${funeralHomeId}`,
            entityType: 'ContactManagementPolicy',
            entityId: funeralHomeId
          });
        }

        // Close current version
        const index = policies.findIndex((p) => p.id === current.id);
        if (index >= 0) {
          const closedVersion: ContactManagementPolicy = new ContactManagementPolicy({
            ...current,
            isCurrent: false,
            validTo: new Date(),
          });
          policies[index] = closedVersion;
        }

        // Create new version
        const newPolicy: ContactManagementPolicy = new ContactManagementPolicy({
          ...current,
          ...updates,
          id: randomUUID(),
          version: current.version + 1,
          validFrom: new Date(),
          validTo: null,
          isCurrent: true,
          funeralHomeId,
          updatedAt: new Date(),
        });

        policies.push(newPolicy);
        return newPolicy;
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(`Failed to update policy: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * List all funeral homes with their current policies
   */
  listCurrentPolicies: () =>
    Effect.try({
      try: () => {
        const allPolicies: ContactManagementPolicy[] = [];

        for (const policies of policyStore.values()) {
          const currentPolicies = policies.filter((p) => p.isCurrent);
          allPolicies.push(...currentPolicies);
        }

        return allPolicies;
      },
      catch: (error) =>
        new PersistenceError(`Failed to list all policies: ${error instanceof Error ? error.message : String(error)}`)
    }),
});

/**
 * Reset in-memory store (for testing)
 */
export const resetContactPolicyStore = (): void => {
  policyStore = new Map();
};

/**
 * Get all stored policies (for testing/debugging)
 */
export const getAllStoredContactPolicies = (): ContactManagementPolicy[] => {
  const all: ContactManagementPolicy[] = [];
  for (const policies of policyStore.values()) {
    all.push(...policies);
  }
  return all;
};
