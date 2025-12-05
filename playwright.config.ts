import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'html' : 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Increase timeout for mobile devices */
    actionTimeout: 15000, // 15s for actions (clicks, fills, etc.)
    navigationTimeout: 30000, // 30s for page navigations
  },

  /* Environment variables for tests */
  env: {
    CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
  },

  /* Configure projects for major browsers */
projects: [
    // 1) Setup project: creates an authenticated storage state
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
{
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 2) Staff project uses the authenticated storage state
    {
      name: 'staff-chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/staff.json' },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

  /* Test against mobile viewports. */
  {
    name: 'Mobile Chrome',
    use: { 
      ...devices['Pixel 7'],
      actionTimeout: 20000, // Extra time for mobile
      navigationTimeout: 45000,
    },
  },
  {
    name: 'Mobile Safari',
    use: { 
      ...devices['iPhone 15 Pro'],
      actionTimeout: 20000, // Extra time for mobile
      navigationTimeout: 45000,
    },
  },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: { 
      PLAYWRIGHT: '1',
      // Pass Clerk keys to dev server for testing
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
    },
  },
});
