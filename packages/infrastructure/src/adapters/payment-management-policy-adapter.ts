import { Effect } from 'effect';
import { type PaymentManagementPolicy, NotFoundError } from '@dykstra/domain';
import { type PaymentManagementPolicyRepositoryService, PersistenceError } from '@dykstra/application';

/**
 * Payment Management Policy Adapter
 *
 * Object-based adapter (NOT class-based) for payment policy persistence.
 * Implements SCD2 (Slowly Changing Dimension Type 2) temporal pattern.
 *
 * In production, this would query a database (Prisma PostgreSQL).
 * For now, uses in-memory storage for development/testing.
 */

// In-memory storage for development
let policyStore: Map<string, PaymentManagementPolicy[]> = new Map();

/**
 * Create Payment Management Policy Adapter
 *
 * Returns an object implementing PaymentManagementPolicyRepositoryService.
 * All methods follow Effect-TS error handling pattern.
 */
export const PaymentManagementPolicyAdapter = (): PaymentManagementPolicyRepositoryService => ({
  /**
   * Find current active policy for a funeral home
   * Returns the policy with isCurrent=true for the given funeralHomeId
   */
  findByFuneralHome: (funeralHomeId: string) =>
    Effect.try({
      try: () => {
        const policies = policyStore.get(funeralHomeId) ?? [];
        const current = policies.find((p) => p.isCurrent);

        if (!current) {
          throw new NotFoundError({
            message: `No active payment policy found for funeral home: ${funeralHomeId}`,
            entityType: 'PaymentManagementPolicy',
            entityId: funeralHomeId
          });
        }

        return current;
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to find payment policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }
    }),

  /**
   * Find specific policy version by business key
   * Returns the exact version (isCurrent or historical)
   */
  findByBusinessKey: (businessKey: string) =>
    Effect.try({
      try: () => {
        for (const policies of policyStore.values()) {
          const policy = policies.find((p) => p.businessKey === businessKey);
          if (policy) {
            return policy;
          }
        }

        throw new NotFoundError({
          message: `Policy not found with business key: ${businessKey}`,
          entityType: 'PaymentManagementPolicy',
          entityId: businessKey
        });
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to find policy by business key: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }
    }),

  /**
   * Find all versions of a policy (historical tracking)
   * Returns all versions (both current and closed) for a given business key
   */
  findAllVersions: (businessKey: string) =>
    Effect.try({
      try: () => {
        for (const policies of policyStore.values()) {
          const versions = policies.filter((p) => p.businessKey === businessKey);
          if (versions.length > 0) {
            return versions;
          }
        }

        return [];
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to find policy versions: ${error instanceof Error ? error.message : String(error)}`,
          error
        )
    }),

  /**
   * List all current active policies
   * Returns all policies with isCurrent=true across all funeral homes
   */
  findAll: () =>
    Effect.try({
      try: () => {
        const allPolicies: PaymentManagementPolicy[] = [];

        for (const policies of policyStore.values()) {
          const currentPolicies = policies.filter((p) => p.isCurrent);
          allPolicies.push(...currentPolicies);
        }

        return allPolicies;
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to list all policies: ${error instanceof Error ? error.message : String(error)}`,
          error
        )
    }),

  /**
   * Save new policy version (for updates, creates new version with SCD2)
   * Follows SCD2 pattern: close current version, create new version
   */
  save: (policy: PaymentManagementPolicy) =>
    Effect.try({
      try: () => {
        const funeralHomeId = policy.funeralHomeId;
        const policies = policyStore.get(funeralHomeId) ?? [];

        // If this is not version 1, close the previous version
        if (policy.version > 1) {
          const previousVersion = policies.find(
            (p) =>
              p.businessKey === policy.businessKey &&
              p.version === policy.version - 1 &&
              p.isCurrent
          );

          if (previousVersion) {
            // Mark previous version as closed
            const closedVersion: PaymentManagementPolicy = {
              ...previousVersion,
              isCurrent: false,
              validTo: new Date(),
            };

            const index = policies.findIndex(
              (p) => p.id === previousVersion.id
            );
            if (index >= 0) {
              policies[index] = closedVersion;
            }
          }
        }

        // Add new version
        policies.push(policy);
        policyStore.set(funeralHomeId, policies);
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to save policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        )
    }),

  /**
   * Update policy (closes current version, creates new version)
   * Same as save but returns the updated policy
   */
  update: (policy: PaymentManagementPolicy) =>
    Effect.try({
      try: () => {
        const funeralHomeId = policy.funeralHomeId;
        const policies = policyStore.get(funeralHomeId) ?? [];
        policies.push(policy);
        policyStore.set(funeralHomeId, policies);
        return policy;
      },
      catch: (error) =>
        new PersistenceError(
          `Failed to update policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        )
    }),

  /**
   * Delete policy (hard delete - rare operation)
   * Removes policy completely from storage
   */
  delete: (id: string) =>
    Effect.try({
      try: () => {
        for (const [funeralHomeId, policies] of policyStore.entries()) {
          const index = policies.findIndex((p) => p.id === id);
          if (index >= 0) {
            policies.splice(index, 1);
            if (policies.length === 0) {
              policyStore.delete(funeralHomeId);
            }
            return;
          }
        }

        throw new NotFoundError({
          message: `Policy not found with id: ${id}`,
          entityType: 'PaymentManagementPolicy',
          entityId: id
        });
      },
      catch: (error) => {
        if (error instanceof NotFoundError) return error;
        return new PersistenceError(
          `Failed to delete policy: ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }
    }),
});

/**
 * Reset in-memory store (for testing)
 */
export const resetPaymentPolicyStore = (): void => {
  policyStore = new Map();
};

/**
 * Get all stored policies (for testing/debugging)
 */
export const getAllStoredPaymentPolicies = (): PaymentManagementPolicy[] => {
  const all: PaymentManagementPolicy[] = [];
  for (const policies of policyStore.values()) {
    all.push(...policies);
  }
  return all;
};
