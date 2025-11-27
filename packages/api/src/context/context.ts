import type { inferAsyncReturnType } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { InfrastructureLayer, prisma } from '@dykstra/infrastructure';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * User session from authentication
 */
export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'FAMILY_PRIMARY' | 'FAMILY_MEMBER' | 'STAFF' | 'DIRECTOR' | 'FUNERAL_DIRECTOR' | 'ADMIN';
  funeralHomeId?: string;
}

/**
 * Create tRPC context
 * This runs on every request
 * 
 * @param opts - Fetch adapter options plus userId from Clerk auth()
 * The userId is extracted in the route handler because Clerk's auth()
 * requires Next.js request context which isn't available here.
 */
export const createContext = async (opts: FetchCreateContextFnOptions & { userId?: string | null }) => {
  // Get userId passed from route handler
  const { userId } = opts;
  
  let user: UserSession | null = null;
  
  // If user is authenticated, load their data from database
  if (userId) {
    try {
      let dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          funeralHomeId: true,
        },
      });
      
      // If user doesn't exist in database, create them
      // This happens on first login after Clerk signup
      if (!dbUser) {
        // Get user info from Clerk to populate database with real data
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        
        const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress 
                      || clerkUser.emailAddresses[0]?.emailAddress 
                      || `user-${userId}@unknown.email`;
        
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() 
                     || clerkUser.username 
                     || 'User';
        
        dbUser = await prisma.user.create({
          data: {
            id: userId,
            email,
            name,
            role: 'FAMILY_MEMBER', // Default role for new signups
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            funeralHomeId: true,
          },
        });
        
        console.log('[Auth] Created new user in database:', { userId, email, name });
      }
      
      if (dbUser) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role as UserSession['role'],
          funeralHomeId: dbUser.funeralHomeId || undefined,
        };
      }
    } catch (error) {
      console.error('Failed to load/create user from database:', error);
      // Continue with null user - will be caught by protected procedures
    }
  }
  
  return {
    user,
    req: opts.req,
    resHeaders: opts.resHeaders,
    infrastructure: InfrastructureLayer,
    prisma, // For routers that need direct DB access (to be refactored)
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
