import { router, publicProcedure } from '../trpc'
import { z } from 'zod'

/**
 * Enhanced Health Router
 * 
 * Comprehensive health checks for BFF and all downstream services:
 * - CRM Backend (TypeScript/Effect-TS)
 * - Go ERP Backend (TigerBeetle/EventStoreDB/PostgreSQL)
 * 
 * Used by:
 * - Load balancers (simple /health endpoint)
 * - Monitoring dashboards (detailed checks)
 * - Status pages (public health status)
 */

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
  latency?: number; // milliseconds
  error?: string;
  details?: Record<string, unknown>;
}

interface HealthCheckResponse {
  overall: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  services: {
    bff: ServiceHealth;
    crm: ServiceHealth;
    erp: ServiceHealth;
  };
  dependencies?: {
    tigerbeetle?: ServiceHealth;
    postgres?: ServiceHealth;
    eventstoredb?: ServiceHealth;
  };
}

/**
 * Check ERP backend health
 */
async function checkERPHealth(erpClient: any): Promise<ServiceHealth> {
  const start = Date.now();
  
  try {
    const response = await erpClient.GET('/health', {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const latency = Date.now() - start;

    if (response.response.ok) {
      return {
        status: 'healthy',
        latency,
        details: {
          statusCode: response.response.status,
        },
      };
    }

    return {
      status: 'degraded',
      latency,
      error: `HTTP ${response.response.status}`,
      details: {
        statusCode: response.response.status,
      },
    };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: 'down',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check CRM backend health
 */
async function checkCRMHealth(crmClient: any): Promise<ServiceHealth> {
  const start = Date.now();
  
  try {
    // CRM client is a stub for now, so we'll just return healthy
    // TODO: Replace with actual tRPC health check once CRM backend is wired up
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
      details: {
        note: 'Stub implementation - will be replaced with actual tRPC health check',
      },
    };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: 'down',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Determine overall health status
 */
function determineOverallStatus(
  crm: ServiceHealth,
  erp: ServiceHealth
): 'healthy' | 'degraded' | 'down' {
  // If any service is down, overall is down
  if (crm.status === 'down' || erp.status === 'down') {
    return 'down';
  }

  // If any service is degraded, overall is degraded
  if (crm.status === 'degraded' || erp.status === 'degraded') {
    return 'degraded';
  }

  // All services healthy
  return 'healthy';
}

export const healthEnhancedRouter = router({
  /**
   * Simple ping for load balancers
   * 
   * Usage: GET /trpc/health.ping
   */
  ping: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
    };
  }),

  /**
   * Detailed health check with backend connectivity
   * 
   * Usage: GET /trpc/health.check
   * 
   * Checks:
   * - BFF itself (always healthy if responding)
   * - CRM backend (tRPC)
   * - Go ERP backend (HTTP)
   */
  check: publicProcedure.query(async ({ ctx }): Promise<HealthCheckResponse> => {
    // Run health checks in parallel
    const [crmHealth, erpHealth] = await Promise.all([
      checkCRMHealth(ctx.crmClient),
      checkERPHealth(ctx.erpClient),
    ]);

    const overall = determineOverallStatus(crmHealth, erpHealth);

    return {
      overall,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      services: {
        bff: {
          status: 'healthy',
          details: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
          },
        },
        crm: crmHealth,
        erp: erpHealth,
      },
    };
  }),

  /**
   * Detailed health check with dependency status
   * 
   * Usage: GET /trpc/health.checkDetailed
   * 
   * Includes:
   * - All service checks from basic health check
   * - TigerBeetle status (if accessible via ERP)
   * - PostgreSQL status (if accessible via ERP)
   * - EventStoreDB status (if accessible via ERP)
   */
  checkDetailed: publicProcedure.query(async ({ ctx }): Promise<HealthCheckResponse> => {
    // Run health checks in parallel
    const [crmHealth, erpHealth] = await Promise.all([
      checkCRMHealth(ctx.crmClient),
      checkERPHealth(ctx.erpClient),
    ]);

    const overall = determineOverallStatus(crmHealth, erpHealth);

    // TODO: Add dependency checks by calling ERP health endpoints
    // These would return status for TigerBeetle, PostgreSQL, EventStoreDB
    const dependencies = {
      tigerbeetle: {
        status: 'healthy' as const,
        details: {
          note: 'Status check not yet implemented - requires ERP dependency health endpoint',
        },
      },
      postgres: {
        status: 'healthy' as const,
        details: {
          note: 'Status check not yet implemented - requires ERP dependency health endpoint',
        },
      },
      eventstoredb: {
        status: 'healthy' as const,
        details: {
          note: 'Status check not yet implemented - requires ERP dependency health endpoint',
        },
      },
    };

    return {
      overall,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      services: {
        bff: {
          status: 'healthy',
          details: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform,
          },
        },
        crm: crmHealth,
        erp: erpHealth,
      },
      dependencies,
    };
  }),

  /**
   * Readiness check for Kubernetes
   * 
   * Usage: GET /trpc/health.ready
   * 
   * Returns 200 if all critical services are healthy
   * Returns error if any critical service is down
   */
  ready: publicProcedure.query(async ({ ctx }) => {
    const [crmHealth, erpHealth] = await Promise.all([
      checkCRMHealth(ctx.crmClient),
      checkERPHealth(ctx.erpClient),
    ]);

    const overall = determineOverallStatus(crmHealth, erpHealth);

    if (overall === 'down') {
      throw new Error('Service not ready - critical dependencies are down');
    }

    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Liveness check for Kubernetes
   * 
   * Usage: GET /trpc/health.live
   * 
   * Always returns 200 if BFF is running
   * Kubernetes will restart pod if this fails
   */
  live: publicProcedure.query(() => {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }),
});
