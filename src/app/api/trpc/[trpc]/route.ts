import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@dykstra/api';

/**
 * tRPC API route handler
 * Handles all /api/trpc/* requests
 * 
 * Automatically provides:
 * - Request/response handling
 * - Error formatting
 * - Context creation (user session, etc.)
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
