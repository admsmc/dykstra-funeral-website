import { router } from '../trpc'
import { healthRouter } from './health.router'

/**
 * Main application router
 * 
 * Combines all sub-routers into a single tRPC router.
 */
export const appRouter = router({
  health: healthRouter,
  // Future routers will be added here:
  // cases: casesRouter,
  // contracts: contractsRouter,
  // finops: finopsRouter,
  // payroll: payrollRouter,
  // procurement: procurementRouter,
  // dashboard: dashboardRouter,
})

export type AppRouter = typeof appRouter
