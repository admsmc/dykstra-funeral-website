import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { InfrastructureLayer, prisma } from '@dykstra/infrastructure';

/**
 * User session from authentication
 */
export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'family_primary' | 'family_member' | 'staff' | 'director' | 'funeral_director' | 'admin';
  funeralHomeId?: string;
}

/**
 * Create tRPC context
 * This runs on every request
 */
export const createContext = async (opts: CreateNextContextOptions) => {
  // TODO: Get user session from authentication (Clerk, Auth0, etc.)
  // For now, we'll extract from headers or return null
  const authHeader = opts.req.headers.authorization;
  
  let user: UserSession | null = null;
  
  // Placeholder: In production, verify JWT and load user
  if (authHeader?.startsWith('Bearer ')) {
    // const token = authHeader.substring(7);
    // user = await verifyAndDecodeToken(token);
    
    // For development, we'll use a mock user
    user = {
      id: 'user_123',
      email: 'john@example.com',
      name: 'John Doe',
      role: 'family_primary',
      funeralHomeId: 'fh_1',
    };
  }
  
  return {
    user,
    req: opts.req,
    res: opts.res,
    infrastructure: InfrastructureLayer,
    prisma, // For routers that need direct DB access (to be refactored)
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
