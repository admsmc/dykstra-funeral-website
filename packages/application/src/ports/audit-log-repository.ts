import { Effect } from 'effect';

/**
 * Audit Log Entry - Domain Model
 */
export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  userId: string;
  ipAddress: string | null;
  timestamp: Date;
}

/**
 * Audit Log Entry with user details
 */
export interface AuditLogEntryWithUser extends AuditLogEntry {
  user: {
    name: string;
    email: string;
  };
}

/**
 * Audit Log Repository Port
 * Defines operations for querying audit logs
 */
export interface AuditLogRepository {
  /**
   * Find audit logs by entity
   */
  findByEntity(data: {
    entityId: string;
    entityType?: string;
    limit?: number;
  }): Effect.Effect<AuditLogEntryWithUser[], never, never>;

  /**
   * Find audit logs by user
   */
  findByUser(data: {
    userId: string;
    limit?: number;
  }): Effect.Effect<AuditLogEntryWithUser[], never, never>;

  /**
   * Create an audit log entry
   */
  create(data: {
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    userId: string;
    ipAddress?: string;
  }): Effect.Effect<AuditLogEntry, never, never>;
}

export const AuditLogRepository = Effect.Tag<AuditLogRepository>('AuditLogRepository');
