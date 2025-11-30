import { router, publicProcedure } from '../trpc'
import { z } from 'zod'

/**
 * Health router
 * 
 * Provides health check endpoints for monitoring both the BFF
 * and downstream services (CRM + ERP).
 */
export const healthRouter = router({
  /**
   * Basic health check
   */
  ping: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }),

  /**
   * Check connectivity to both backends
   */
  check: publicProcedure.query(async ({ ctx }) => {
    const results = {
      bff: 'ok' as const,
      crm: 'unknown' as 'ok' | 'error' | 'unknown',
      erp: 'unknown' as 'ok' | 'error' | 'unknown',
    }

    // Check ERP health
    try {
      const erpHealth = await ctx.erpClient.GET('/health')
      if (erpHealth.response.ok) {
        results.erp = 'ok'
      } else {
        results.erp = 'error'
      }
    } catch (error) {
      results.erp = 'error'
    }

    // CRM health check would go here (stub returns ok for now)
    results.crm = 'ok'

    return {
      status: results.erp === 'ok' && results.crm === 'ok' ? 'healthy' : 'degraded',
      services: results,
      timestamp: new Date().toISOString(),
    }
  }),
})
