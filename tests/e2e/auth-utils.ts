import { Page } from '@playwright/test';

/**
 * Authentication utilities for Clerk-protected routes
 * 
 * Playwright with Clerk requires either:
 * 1. Using Clerk's testing tokens (recommended)
 * 2. Mocking authentication state
 * 3. Using actual test accounts
 * 
 * This file provides utilities for all approaches.
 */

/**
 * Environment variables needed for authenticated tests:
 * - CLERK_TEST_USER_EMAIL
 * - CLERK_TEST_USER_PASSWORD
 * - CLERK_PUBLISHABLE_KEY
 * - CLERK_SECRET_KEY
 */

export interface TestUser {
  email: string;
  password: string;
  role?: 'staff' | 'admin' | 'family';
}

/**
 * Signs in using Clerk UI (slowest but most realistic)
 */
export async function signInWithClerk(page: Page, user: TestUser) {
  // If already on sign-in page, don't navigate again
  if (!page.url().includes('sign-in')) {
    await page.goto('/sign-in');
  }
  
  // Wait for Clerk sign-in component to load
  await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
  
  // Enter email and continue
  await page.fill('input[name="identifier"]', user.email);
  
  // Click the visible Continue button (not the hidden aria submit)
  await page.locator('button:has-text("Continue"), button[type="submit"]:visible').first().click();
  
  // Wait for password field
  await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  
  // Enter password
  await page.fill('input[name="password"]', user.password);
  
  // Click the visible Continue/Sign in button
  await page.locator('button:has-text("Continue"), button:has-text("Sign in"), button[type="submit"]:visible').first().click();
  
  // Wait for sign-in page to disappear (authentication successful)
  // This indicates Clerk has processed the credentials and created a session
  await page.waitForURL(url => !url.toString().includes('/sign-in'), { timeout: 20000 });
}

/**
 * Signs in using Clerk's session token (fastest)
 * Requires CLERK_SECRET_KEY environment variable
 */
export async function signInWithToken(page: Page, userId?: string) {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  
  if (!clerkSecretKey) {
    throw new Error('CLERK_SECRET_KEY environment variable is required for token-based auth');
  }
  
  // Create a session using Clerk's Backend API
  // This is much faster than UI-based login
  const sessionToken = await createClerkSessionToken(userId);
  
  // Set the session token in cookies
  await page.context().addCookies([
    {
      name: '__session',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Helper to create a Clerk session token
 * In a real implementation, this would call Clerk's Backend API
 */
async function createClerkSessionToken(userId?: string): Promise<string> {
  // This is a placeholder - in production you'd use:
  // import { clerkClient } from '@clerk/nextjs/server';
  // const session = await clerkClient.sessions.createSession({ userId });
  // return session.id;
  
  throw new Error('Token-based auth not yet implemented. Use signInWithClerk() instead.');
}

/**
 * Checks if user is authenticated on the page
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for Clerk's UserButton component
    const userButton = page.locator('[data-clerk-user-button], button:has-text("Sign out")');
    await userButton.waitFor({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Signs out the current user
 */
export async function signOut(page: Page) {
  // Click user button
  const userButton = page.locator('[data-clerk-user-button]').first();
  await userButton.click();
  
  // Click sign out
  await page.click('button:has-text("Sign out"), [role="menuitem"]:has-text("Sign out")');
  
  // Wait for redirect to home or sign-in
  await page.waitForURL(/.*\/(|sign-in)/, { timeout: 5000 });
}

/**
 * Waits for Clerk to finish initializing
 */
export async function waitForClerkToLoad(page: Page) {
  // Wait for Clerk's data-clerk attribute
  await page.waitForSelector('[data-clerk-hydrated="true"]', { timeout: 10000 });
}

/**
 * Creates a test user context with authentication state
 * Useful for reusing authentication across tests
 */
export async function createAuthenticatedContext(user: TestUser) {
  // This would typically save the authentication state
  // for reuse in other tests
  throw new Error('Not yet implemented - use signInWithClerk() in each test for now');
}

/**
 * Staff-specific navigation helpers
 */
export const StaffRoutes = {
  DASHBOARD: '/staff/dashboard',
  CASES: '/staff/cases',
  CASES_NEW: '/staff/cases/new',
  CONTRACTS: '/staff/contracts',
  PAYMENTS: '/staff/payments',
  ANALYTICS: '/staff/analytics',
  TASKS: '/staff/tasks',
  FAMILIES: '/staff/families',
  FINOPS: '/staff/finops',
  PAYROLL: '/staff/payroll',
  TEMPLATE_LIBRARY: '/staff/template-library',
  TEMPLATE_EDITOR: '/staff/template-editor',
  TEMPLATE_WORKFLOWS: '/staff/template-workflows',
  TEMPLATE_APPROVALS: '/staff/template-approvals',
  TEMPLATE_ANALYTICS: '/staff/template-analytics',
} as const;

/**
 * Portal-specific navigation helpers
 */
export const PortalRoutes = {
  DASHBOARD: '/portal/dashboard',
  PROFILE: '/portal/profile',
  PAYMENTS_NEW: '/portal/payments/new',
} as const;
