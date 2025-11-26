import { Effect } from 'effect';
import { PrismaClient } from '@prisma/client';
import {
  AuditLogRepository,
  AuditLogEntry,
  AuditLogEntryWithUser,
} from '@dykstra/application/ports/audit-log-repository';

export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private prisma: PrismaClient) {}

  findByEntity(data: {
    entityId: string;
    entityType?: string;
    limit?: number;
  }): Effect.Effect<AuditLogEntryWithUser[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const logs = await this.prisma.auditLog.findMany({
          where: {
            entityId: data.entityId,
            ...(data.entityType ? { entityType: data.entityType } : {}),
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: data.limit || 50,
        });

        return logs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          metadata: log.metadata as Record<string, unknown> | null,
          userId: log.userId,
          ipAddress: log.ipAddress,
          timestamp: log.timestamp,
          user: {
            name: log.user.name,
            email: log.user.email,
          },
        }));
      },
      catch: (error) => new Error(`Failed to fetch audit logs: ${error}`),
    }).pipe(Effect.orDie);
  }

  findByUser(data: {
    userId: string;
    limit?: number;
  }): Effect.Effect<AuditLogEntryWithUser[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const logs = await this.prisma.auditLog.findMany({
          where: {
            userId: data.userId,
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: data.limit || 50,
        });

        return logs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          metadata: log.metadata as Record<string, unknown> | null,
          userId: log.userId,
          ipAddress: log.ipAddress,
          timestamp: log.timestamp,
          user: {
            name: log.user.name,
            email: log.user.email,
          },
        }));
      },
      catch: (error) => new Error(`Failed to fetch audit logs: ${error}`),
    }).pipe(Effect.orDie);
  }

  create(data: {
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    userId: string;
    ipAddress?: string;
  }): Effect.Effect<AuditLogEntry, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const log = await this.prisma.auditLog.create({
          data: {
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId,
            metadata: data.metadata || null,
            userId: data.userId,
            ipAddress: data.ipAddress || null,
          },
        });

        return {
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          metadata: log.metadata as Record<string, unknown> | null,
          userId: log.userId,
          ipAddress: log.ipAddress,
          timestamp: log.timestamp,
        };
      },
      catch: (error) => new Error(`Failed to create audit log: ${error}`),
    }).pipe(Effect.orDie);
  }
}
