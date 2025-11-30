import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import superjson from 'superjson'
import type { ERPClient } from './clients/erp-client'
import type { CRMClient } from './clients/crm-client'

/**
 * Context for tRPC procedures
 * Contains authenticated user info and clients for both backends
 */
export interface Context {
  req: FastifyRequest
  res: FastifyReply
  user?: {
    id: string
    roles: string[]
    tenant?: string
    legalEntity?: string
  }
  erpClient: ERPClient
  crmClient: CRMClient
}

/**
 * Initialize tRPC with context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

/**
 * Create router and procedure builders
 */
export const router = t.router
export const publicProcedure = t.procedure

/**
 * Middleware: Require authentication
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('UNAUTHORIZED')
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  })
})

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(isAuthed)

/**
 * Middleware: Require staff role
 */
const isStaff = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('UNAUTHORIZED')
  }
  
  const staffRoles = ['funeral_director', 'accountant', 'payroll_admin', 'admin']
  const hasStaffRole = ctx.user.roles.some(role => staffRoles.includes(role))
  
  if (!hasStaffRole) {
    throw new Error('FORBIDDEN: Staff access required')
  }
  
  return next({ ctx })
})

/**
 * Staff procedure - requires staff role
 */
export const staffProcedure = protectedProcedure.use(isStaff)

/**
 * Middleware: Require admin role
 */
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('UNAUTHORIZED')
  }
  
  if (!ctx.user.roles.includes('admin')) {
    throw new Error('FORBIDDEN: Admin access required')
  }
  
  return next({ ctx })
})

/**
 * Admin procedure - requires admin role
 */
export const adminProcedure = protectedProcedure.use(isAdmin)
