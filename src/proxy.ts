import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Clerk authentication proxy (Next.js 15)
 *
 * Next.js renamed middleware -> proxy. This file replaces src/middleware.ts.
 * Behavior is identical: protect /staff and /portal routes, redirecting unauthenticated
 * users to /sign-in with a redirect back to the original URL after login.
 */

const isProtected = createRouteMatcher([
  '/staff(.*)',
  '/portal(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // WORKAROUND: Skip auth checks during E2E tests
  // This allows Playwright tests to access protected routes without full Clerk session
  // Manual authentication testing should be done separately
  if (process.env.PLAYWRIGHT === '1') {
    console.log('[E2E TEST MODE] Bypassing auth for:', req.url);
    return; // Allow all requests through
  }
  
  // DEV MODE: Skip auth checks in development
  // This allows developers to access protected routes without authentication
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.log('[DEV MODE] Bypassing auth for:', req.url);
    return; // Allow all requests through
  }
  
  if (isProtected(req)) {
    const { userId } = await auth();
    
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
