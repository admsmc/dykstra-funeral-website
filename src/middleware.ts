import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Clerk authentication middleware
 * 
 * By default, clerkMiddleware() will not protect any routes.
 * All routes are public unless you opt-in to protection.
 * 
 * To protect specific routes, use createRouteMatcher() and auth().protect().
 * See: https://clerk.com/docs/references/nextjs/clerk-middleware
 */

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
