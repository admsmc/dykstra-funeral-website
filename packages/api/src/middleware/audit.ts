import { prisma } from '@dykstra/infrastructure';
import type { Context } from '../context/context';

/**
 * Audit logging middleware
 * Logs all staff mutations for compliance
 * 
 * Note: This is a middleware function, not wrapped with t.middleware.
 * It's meant to be used with .use() on procedures.
 */
export async function auditMiddleware({ ctx, next, path, type }: {
  ctx: Context;
  next: () => Promise<any>;
  path: string;
  type: 'query' | 'mutation' | 'subscription';
}) {
  // Only log mutations
  if (type !== 'mutation') {
    return next();
  }

  // Only log for authenticated users
  if (!ctx.user) {
    return next();
  }

  // Execute the mutation
  const result = await next();

  // Log to database (fire and forget - don't block response)
  // In production, consider using a queue for reliability
  logAudit({
    userId: ctx.user.id,
    action: path,
    entityType: extractEntityType(path),
    ipAddress: ctx.req.headers.get('x-forwarded-for') || ctx.req.headers.get('x-real-ip') || 'unknown',
    userAgent: ctx.req.headers.get('user-agent') || 'unknown',
    metadata: {
      // Include result if it contains an ID
      ...(typeof result === 'object' && result && 'id' in result 
        ? { resultId: result.id } 
        : {}),
    },
  }).catch((error) => {
    console.error('Failed to log audit entry:', error);
    // Don't fail the request if audit logging fails
  });

  return result;
}

/**
 * Extract entity type from tRPC path
 * e.g. "case.create" -> "Case"
 */
function extractEntityType(path: string): string | undefined {
  const parts = path.split('.');
  if (parts.length < 2) return undefined;
  
  const entity = parts[0];
  return entity ? entity.charAt(0).toUpperCase() + entity.slice(1) : undefined;
}

/**
 * Write audit log to database
 */
async function logAudit(data: {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}): Promise<void> {

  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entityType: data.entityType || 'Unknown',
      entityId: data.entityId,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
}
