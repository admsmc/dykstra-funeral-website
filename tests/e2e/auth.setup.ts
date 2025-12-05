import { test, expect } from '@playwright/test';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'node:fs/promises';
import path from 'path';

/**
 * Global setup: Configure Clerk Testing Tokens
 * This obtains a Testing Token when the test suite starts,
 * making it available for all subsequent tests.
 */
test.describe.configure({ mode: 'serial' });

test('global setup - configure Clerk', async () => {
  await clerkSetup();
});

/**
 * Authenticate staff user and save storage state
 * Uses Clerk's signIn helper which bypasses bot detection
 */
const authFile = path.join(__dirname, '../../playwright/.auth/staff.json');

test('authenticate staff user and save storage state', async ({ page }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
  const email = process.env.CLERK_TEST_USER_EMAIL;

  if (!email) {
    throw new Error('CLERK_TEST_USER_EMAIL environment variable is required');
  }

  // Navigate to an unprotected page that loads Clerk
  await page.goto(baseURL);

  // Wait for Clerk to load
  await clerk.loaded({ page });

  // Sign in using Clerk's Backend API (requires CLERK_SECRET_KEY)
  console.log('Signing in with email:', email);
  await clerk.signIn({
    page,
    emailAddress: email,
  });
  console.log('Sign in completed');

  // CRITICAL: Wait for Clerk session handshake to complete
  // Clerk makes a separate request after sign-in to set the __session cookie
  console.log('Waiting for session cookie...');
  await page.waitForFunction(
    () => document.cookie.includes('__session') || document.cookie.includes('__clerk'),
    { timeout: 10000 }
  );
  console.log('Session cookie detected');

  // Save storage state (tests will verify protected routes individually)
  await fs.mkdir(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
  
  console.log('Auth state saved to:', authFile);
});
