import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Clerk authentication middleware
 * 
 * Protects:
 * - /portal/* - Family portal (requires family member authentication)
 * - /staff/* - Staff dashboard (requires staff authentication + role check)
 * - /api/trpc/* - API routes
 * Allows public access to main website pages
 */

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/portal(.*)',
  '/staff(.*)',    // Staff dashboard
  '/api/trpc(.*)', // Protect API routes
]);

export default clerkMiddleware((auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
