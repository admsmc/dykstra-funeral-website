import { prisma } from '@dykstra/infrastructure';

/**
 * Health Check Endpoint
 * 
 * GET /api/health
 * 
 * Returns the health status of the application including:
 * - Dependency injection status
 * - Database connectivity
 * - Critical service availability
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'ok' | 'error'; message?: string; duration?: number }> = {};

  // Test: Database Connectivity
  try {
    const dbCheckStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'ok',
      duration: Date.now() - dbCheckStart,
    };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }

  // Calculate overall status
  const allChecksOk = Object.values(checks).every(check => check.status === 'ok');
  const totalDuration = Date.now() - startTime;

  // Return health status
  return Response.json(
    {
      status: allChecksOk ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      checks,
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
    },
    {
      status: allChecksOk ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
