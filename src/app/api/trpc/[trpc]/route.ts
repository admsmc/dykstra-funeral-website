import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@dykstra/api';
import { auth } from '@clerk/nextjs/server';

/**
 * tRPC API route handler
 * Handles all /api/trpc/* requests
 * 
 * Extracts Clerk authentication and passes to tRPC context.
 * This is necessary because Clerk's auth() requires Next.js request context,
 * which is not available in the tRPC fetch adapter's createContext.
 */
const handler = async (req: Request) => {
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
