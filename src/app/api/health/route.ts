import { Effect } from 'effect';
import { InfrastructureLayer } from '@dykstra/infrastructure';
import {
  CaseRepository,
  StoragePort,
  EmailPort,
  SignaturePort,
  PaymentPort,
} from '@dykstra/application';

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

  // Test 1: Dependency Injection Resolution
  try {
    const diCheckStart = Date.now();
    await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* (_) {
          // Test critical services can be resolved
          yield* _(CaseRepository);
          yield* _(StoragePort);
          yield* _(EmailPort);
          yield* _(SignaturePort);
          yield* _(PaymentPort);
        }),
        InfrastructureLayer
      )
    );
    checks.dependencyInjection = {
      status: 'ok',
      duration: Date.now() - diCheckStart,
    };
  } catch (error) {
    checks.dependencyInjection = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to resolve services',
    };
  }

  // Test 2: Database Connectivity
  try {
    const dbCheckStart = Date.now();
    const { prisma } = await import('@dykstra/infrastructure');
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

  // Test 3: CaseRepository Basic Query
  try {
    const repoCheckStart = Date.now();
    await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* (_) {
          const repo = yield* _(CaseRepository);
          // Just check that the repo has the expected interface
          // Don't actually query to avoid requiring test data
          if (!repo.findById || !repo.findByFuneralHome) {
            throw new Error('CaseRepository missing expected methods');
          }
        }),
        InfrastructureLayer
      )
    );
    checks.caseRepository = {
      status: 'ok',
      duration: Date.now() - repoCheckStart,
    };
  } catch (error) {
    checks.caseRepository = {
      status: 'error',
      message: error instanceof Error ? error.message : 'CaseRepository validation failed',
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
