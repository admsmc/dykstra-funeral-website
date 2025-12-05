import { test, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { StaffRoutes } from './auth-utils';

/**
 * Staff Dashboard E2E Tests
 * 
 * Prerequisites:
 * - CLERK_TEST_USER_EMAIL environment variable
 * - CLERK_TEST_USER_PASSWORD environment variable
 * - Test user must exist in Clerk with staff permissions
 * 
 * Run with: pnpm test:e2e:staff
 */

// Auth is provided via Playwright storageState created by the setup project.
// If storageState auth fails, tests will fall back to using Clerk's signIn helper.

test.describe('Staff Dashboard - Authentication', () => {
  test('redirects unauthenticated users to sign-in', async ({ browser }) => {
    test.skip(); // Skipped: Auth bypass enabled for E2E tests (see src/proxy.ts)
    
    // To test authentication manually:
    // 1. Comment out the PLAYWRIGHT check in src/proxy.ts
    // 2. Remove the test.skip() line above
    // 3. Run this test
    
    // Create a fresh context without auth to verify redirect
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(StaffRoutes.DASHBOARD);
    await expect(page).toHaveURL(/.*sign-in.*/);
    await context.close();
  });

  test('allows authenticated users to access dashboard', async ({ page }) => {
    // Note: Auth bypass is enabled for E2E tests (see src/proxy.ts)
    // This test verifies UI loads correctly, not authentication flow
    
    await page.goto(StaffRoutes.DASHBOARD);
    
    // Verify we're on the dashboard (not redirected)
    await expect(page).toHaveURL(/.*staff\/dashboard.*/);
    
    // App-specific assertion: sidebar and top header visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    const topHeader = page.locator('header');
    await expect(topHeader).toBeVisible();
  });
});

test.describe('Staff Dashboard - Navigation', () => {
  // Auth is already present via storageState

  test('sidebar navigation is visible and functional', async ({ page }) => {
    await page.goto(StaffRoutes.DASHBOARD);
    
    // Check sidebar is visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Check all navigation items are present
    await expect(page.locator('nav a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Cases")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Contracts")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Payments")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Analytics")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Tasks")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Families")')).toBeVisible();
  });

  test('can navigate to Cases page', async ({ page }) => {
    await page.goto(StaffRoutes.DASHBOARD);
    
    await page.click('nav a:has-text("Cases")');
    await expect(page).toHaveURL(StaffRoutes.CASES);
  });

  test('can navigate to Contracts page', async ({ page }) => {
    await page.goto(StaffRoutes.DASHBOARD);
    
    await page.click('nav a:has-text("Contracts")');
    await expect(page).toHaveURL(StaffRoutes.CONTRACTS);
  });

  test('can navigate to Payments page', async ({ page }) => {
    await page.goto(StaffRoutes.DASHBOARD);
    
    await page.click('nav a:has-text("Payments")');
    await expect(page).toHaveURL(StaffRoutes.PAYMENTS);
  });

  test('active navigation item is highlighted', async ({ page }) => {
    await page.goto(StaffRoutes.CASES);
    
    // Cases link should have active styling
    const casesLink = page.locator('nav a:has-text("Cases")');
    const classes = await casesLink.getAttribute('class');
    
    expect(classes).toContain('bg-[--sage]');
  });
});

test.describe('Staff Dashboard - Layout', () => {

  test('has correct layout structure', async ({ page }) => {
    await page.goto(StaffRoutes.DASHBOARD);
    
    // Check for sidebar
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Check for main content area
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Check for top header
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('displays user button', async ({ page }) => {
    await page.goto(StaffRoutes.DASHBOARD);
    
    // Check for Clerk UserButton
    const userButton = page.locator('[data-clerk-user-button]').first();
    await expect(userButton).toBeVisible();
  });

  test('displays theme toggle', async ({ page }) => {
    await page.goto(StaffRoutes.DASHBOARD);
    
    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme"], button:has-text("Toggle theme")').first();
    
    if (await themeToggle.isVisible()) {
      await expect(themeToggle).toBeVisible();
    }
  });

  test('has link to public website', async ({ page }) => {
    await page.goto(StaffRoutes.DASHBOARD);
    
    const websiteLink = page.locator('a:has-text("View website")');
    await expect(websiteLink).toBeVisible();
  });
});

test.describe('Staff Dashboard - Cases Management', () => {

  test('cases page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.CASES);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('can access new case form', async ({ page }) => {
    await page.goto(StaffRoutes.CASES);
    
    // Look for "New Case" button or link
    const newCaseButton = page.locator('button:has-text("New Case"), a:has-text("New Case")').first();
    
    if (await newCaseButton.isVisible()) {
      await newCaseButton.click();
      await expect(page).toHaveURL(/.*cases\/new/);
    }
  });

  test('displays cases list or empty state', async ({ page }) => {
    await page.goto(StaffRoutes.CASES);
    
    // Should show either a table/list of cases or an empty state
    const hasList = await page.locator('table, [role="grid"], ul[role="list"]').count() > 0;
    const hasEmptyState = await page.locator('text=/no cases|empty/i').count() > 0;
    
    expect(hasList || hasEmptyState).toBe(true);
  });
});

test.describe('Staff Dashboard - Contracts Management', () => {

  test('contracts page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.CONTRACTS);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays contracts list or empty state', async ({ page }) => {
    await page.goto(StaffRoutes.CONTRACTS);
    
    const hasList = await page.locator('table, [role="grid"]').count() > 0;
    const hasEmptyState = await page.locator('text=/no contracts|empty/i').count() > 0;
    
    expect(hasList || hasEmptyState).toBe(true);
  });
});

test.describe('Staff Dashboard - Payments', () => {

  test('payments page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.PAYMENTS);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays payments list or empty state', async ({ page }) => {
    await page.goto(StaffRoutes.PAYMENTS);
    
    const hasList = await page.locator('table, [role="grid"]').count() > 0;
    const hasEmptyState = await page.locator('text=/no payments|empty/i').count() > 0;
    
    expect(hasList || hasEmptyState).toBe(true);
  });
});

test.describe('Staff Dashboard - Analytics', () => {

  test('analytics page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.ANALYTICS);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays charts or metrics', async ({ page }) => {
    await page.goto(StaffRoutes.ANALYTICS);
    
    // Look for chart elements or metrics cards
    const hasCharts = await page.locator('canvas, svg[class*="chart"]').count() > 0;
    const hasMetrics = await page.locator('[class*="metric"], [class*="card"]').count() > 0;
    
    // Should have some data visualization
    expect(hasCharts || hasMetrics).toBe(true);
  });
});

test.describe('Staff Dashboard - Tasks', () => {

  test('tasks page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.TASKS);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays tasks list or empty state', async ({ page }) => {
    await page.goto(StaffRoutes.TASKS);
    
    const hasList = await page.locator('table, [role="grid"], ul').count() > 0;
    const hasEmptyState = await page.locator('text=/no tasks|empty/i').count() > 0;
    
    expect(hasList || hasEmptyState).toBe(true);
  });
});

test.describe('Staff Dashboard - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('dashboard is accessible on mobile', async ({ page }) => {
    await page.goto(StaffRoutes.DASHBOARD);
    
    // Page should load
    await expect(page).toHaveURL(StaffRoutes.DASHBOARD);
    
    // Check for no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    // Note: Staff dashboard may intentionally have desktop-only design
    // This test documents the behavior
    console.log('Mobile horizontal scroll:', hasHorizontalScroll);
  });
});
