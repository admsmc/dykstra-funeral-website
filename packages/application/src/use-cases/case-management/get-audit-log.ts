import { Effect } from 'effect';
import { AuditLogRepository } from '../../ports/audit-log-repository';

/**
 * Get Audit Log
 *
 * Policy Type: N/A
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A
 * Persisted In: N/A
 * Go Backend: NO
 * Per-Funeral-Home: YES
 * Test Coverage: 0 tests
 * Last Updated: N/A
 */

export interface GetAuditLogQuery {
  entityId: string;
  entityType?: string;
  limit?: number;
}

export interface GetAuditLogResult {
  logs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown> | null;
    user: {
      name: string;
      email: string;
    };
    ipAddress: string | null;
    timestamp: Date;
  }>;
}

/**
 * Get audit log entries for an entity
 * Ordered by timestamp descending (most recent first)
 */
export const getAuditLog = (query: GetAuditLogQuery): Effect.Effect<
  GetAuditLogResult,
  never,
  AuditLogRepository
> =>
  Effect.gen(function* () {
    const auditLogRepo = yield* AuditLogRepository;

    const logs = yield* auditLogRepo.findByEntity({
      entityId: query.entityId,
      entityType: query.entityType,
      limit: query.limit || 50,
    });

    return {
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
        user: {
          name: log.user.name,
          email: log.user.email,
        },
        ipAddress: log.ipAddress,
        timestamp: log.timestamp,
      })),
    };
  });
