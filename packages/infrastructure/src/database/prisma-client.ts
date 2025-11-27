import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Prisma client singleton
 * Prevents multiple instances in development with hot reload
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Create connection pool (singleton)
const pool = globalForPrisma.pool ?? new Pool({ 
  connectionString: process.env['DATABASE_URL'],
});

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.pool = pool;
}

// Create adapter for Prisma 7
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
