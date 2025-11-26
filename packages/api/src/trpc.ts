import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context/context';
import { auditMiddleware } from './middleware/audit';

/**
 * Initialize tRPC with context
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user is now non-null
    },
  });
});

/**
 * Family member procedure - requires family member or higher role
 */
export const familyProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const allowedRoles: typeof ctx.user.role[] = [
    'family_primary',
    'family_member',
    'funeral_director',
    'admin',
  ];

  if (!allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    });
  }

  return next({ ctx });
});

/**
 * Staff procedure - requires staff, director, or admin role
 * Includes audit logging for compliance
 */
export const staffProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    const allowedRoles: typeof ctx.user.role[] = [
      'staff',
      'director',
      'funeral_director', // Legacy
      'admin',
    ];

    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must be a staff member to access this resource',
      });
    }

    return next({ ctx });
  })
  .use(auditMiddleware);

/**
 * Admin procedure - requires admin role
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be an administrator to access this resource',
    });
  }

  return next({ ctx });
});
