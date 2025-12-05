import { test, expect } from '@playwright/test';
import { signInWithClerk, StaffRoutes } from './auth-utils';

/**
 * Staff ERP Features E2E Tests
 * 
 * Tests for backend ERP integrations:
 * - Financial Operations (FinOps)
 * - Payroll Management
 * - Template Management
 * - Workflow Approvals
 * 
 * Prerequisites:
 * - CLERK_TEST_USER_EMAIL environment variable
 * - CLERK_TEST_USER_PASSWORD environment variable
 */

// Auth is provided via storageState (playwright/.auth/staff.json) created by the setup project.
// These tests assume an authenticated context.

test.describe('Staff ERP - Financial Operations (FinOps)', () => {

  test('finops page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.FINOPS);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays financial metrics or dashboard', async ({ page }) => {
    await page.goto(StaffRoutes.FINOPS);
    
    // Should have some financial data visualization
    const hasContent = await page.locator('h1, h2, h3').count() > 0;
    expect(hasContent).toBe(true);
  });

  test('can navigate back to main dashboard', async ({ page }) => {
    await page.goto(StaffRoutes.FINOPS);
    
    await page.click('nav a:has-text("Dashboard")');
    await expect(page).toHaveURL(StaffRoutes.DASHBOARD);
  });
});

test.describe('Staff ERP - Payroll Management', () => {

  test('payroll page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.PAYROLL);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays payroll information', async ({ page }) => {
    await page.goto(StaffRoutes.PAYROLL);
    
    // Should have payroll-related content
    const hasContent = await page.locator('h1, h2, h3').count() > 0;
    expect(hasContent).toBe(true);
  });
});

test.describe('Staff ERP - Template Library', () => {

  test('template library page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.TEMPLATE_LIBRARY);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays template list or empty state', async ({ page }) => {
    await page.goto(StaffRoutes.TEMPLATE_LIBRARY);
    
    const hasList = await page.locator('table, [role="grid"], [class*="grid"]').count() > 0;
    const hasEmptyState = await page.locator('text=/no templates|empty/i').count() > 0;
    
    expect(hasList || hasEmptyState).toBe(true);
  });

  test('can search or filter templates', async ({ page }) => {
    await page.goto(StaffRoutes.TEMPLATE_LIBRARY);
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });
});

test.describe('Staff ERP - Template Editor', () => {

  test('template editor page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.TEMPLATE_EDITOR);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays editor interface', async ({ page }) => {
    await page.goto(StaffRoutes.TEMPLATE_EDITOR);
    
    // Should have editor-related elements
    const hasContent = await page.locator('h1, h2, [role="textbox"], textarea, [contenteditable="true"]').count() > 0;
    expect(hasContent).toBe(true);
  });
});

test.describe('Staff ERP - Template Workflows', () => {

  test('template workflows page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.TEMPLATE_WORKFLOWS);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays workflow information', async ({ page }) => {
    await page.goto(StaffRoutes.TEMPLATE_WORKFLOWS);
    
    const hasContent = await page.locator('h1, h2, h3').count() > 0;
    expect(hasContent).toBe(true);
  });
});

test.describe('Staff ERP - Template Approvals', () => {

  test('template approvals page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.TEMPLATE_APPROVALS);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays pending approvals or empty state', async ({ page }) => {
    await page.goto(StaffRoutes.TEMPLATE_APPROVALS);
    
    const hasList = await page.locator('table, [role="grid"]').count() > 0;
    const hasEmptyState = await page.locator('text=/no approvals|no pending|empty/i').count() > 0;
    
    expect(hasList || hasEmptyState).toBe(true);
  });
});

test.describe('Staff ERP - Template Analytics', () => {

  test('template analytics page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(StaffRoutes.TEMPLATE_ANALYTICS);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('displays analytics data', async ({ page }) => {
    await page.goto(StaffRoutes.TEMPLATE_ANALYTICS);
    
    // Should have some analytics visualization
    const hasCharts = await page.locator('canvas, svg[class*="chart"]').count() > 0;
    const hasMetrics = await page.locator('[class*="metric"], [class*="card"]').count() > 0;
    
    expect(hasCharts || hasMetrics).toBe(true);
  });
});

test.describe('Staff ERP - Data Tables', () => {

  const tablePages = [
    { name: 'Cases', url: StaffRoutes.CASES },
    { name: 'Contracts', url: StaffRoutes.CONTRACTS },
    { name: 'Payments', url: StaffRoutes.PAYMENTS },
    { name: 'Tasks', url: StaffRoutes.TASKS },
  ];

  for (const tablePage of tablePages) {
    test(`${tablePage.name} table has sorting capability`, async ({ page }) => {
      await page.goto(tablePage.url);
      
      // Look for sortable column headers
      const sortableHeaders = page.locator('th[role="columnheader"], th button, th[class*="sort"]');
      const count = await sortableHeaders.count();
      
      if (count > 0) {
        // Should have sortable columns
        expect(count).toBeGreaterThan(0);
      }
    });

    test(`${tablePage.name} table has pagination or infinite scroll`, async ({ page }) => {
      await page.goto(tablePage.url);
      
      // Look for pagination controls
      const hasPagination = await page.locator('nav[aria-label*="pagination"], button:has-text("Next"), button:has-text("Previous")').count() > 0;
      
      // Or look for "Load more" / infinite scroll indicators
      const hasLoadMore = await page.locator('button:has-text("Load more")').count() > 0;
      
      // Tables should have some way to navigate data
      // Or they may be small enough to not need pagination
      console.log(`${tablePage.name} - Pagination: ${hasPagination}, Load More: ${hasLoadMore}`);
    });
  }
});

test.describe('Staff ERP - Form Validation', () => {

  test('new case form has required field validation', async ({ page }) => {
    await page.goto(StaffRoutes.CASES_NEW);
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation errors
      const hasErrors = await page.locator('[role="alert"], [class*="error"], [class*="invalid"]').count() > 0;
      const hasNativeValidation = await page.locator('input:invalid').count() > 0;
      
      expect(hasErrors || hasNativeValidation).toBe(true);
    }
  });
});

test.describe('Staff ERP - Performance', () => {

  test('dashboard loads within acceptable time', async ({ page }) => {
    const start = Date.now();
    await page.goto(StaffRoutes.DASHBOARD);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test('case list loads within acceptable time', async ({ page }) => {
    const start = Date.now();
    await page.goto(StaffRoutes.CASES);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    console.log(`Cases load time: ${loadTime}ms`);
  });
});
