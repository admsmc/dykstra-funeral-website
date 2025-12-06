import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@dykstra/api';
import { auth } from '@clerk/nextjs/server';
import { initializeInfrastructure } from '@dykstra/infrastructure';

/**
 * tRPC API route handler
 * Handles all /api/trpc/* requests
 * 
 * Extracts Clerk authentication and passes to tRPC context.
 * This is necessary because Clerk's auth() requires Next.js request context,
 * which is not available in the tRPC fetch adapter's createContext.
 */

// Initialize infrastructure once on first API call
let infrastructureInitialized = false;

const handler = async (req: Request) => {
  // Seed default data on first API call
  if (!infrastructureInitialized) {
    await initializeInfrastructure();
    infrastructureInitialized = true;
  }
  // Extract Clerk userId in the Next.js route handler context
  const { userId } = await auth();
  
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: (opts) => createContext({ ...opts, userId }),
  });
};

export { handler as GET, handler as POST };
