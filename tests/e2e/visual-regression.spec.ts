import { test, expect } from '@playwright/test';

/**
 * Visual regression tests using Playwright screenshots
 * Run with: npx playwright test --update-snapshots to create baseline
 */

const routes = [
  { path: '/', name: 'homepage' },
  { path: '/about', name: 'about' },
  { path: '/services', name: 'services' },
  { path: '/contact', name: 'contact' },
  { path: '/obituaries', name: 'obituaries' },
  { path: '/pre-planning', name: 'pre-planning' },
];

test.describe('Visual Regression - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  for (const route of routes) {
    test(`${route.name} matches visual snapshot`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      
      // Wait for fonts to load
      await page.waitForTimeout(1000);
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot(`${route.name}-desktop.png`, {
        fullPage: true,
        maxDiffPixels: 100, // Allow small rendering differences
      });
    });
  }
});

test.describe('Visual Regression - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const route of routes) {
    test(`${route.name} matches mobile visual snapshot`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      
      // Wait for fonts to load
      await page.waitForTimeout(1000);
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot(`${route.name}-mobile.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });
  }
});

test.describe('Visual Regression - Component States', () => {
  test('mobile menu open state', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Find and click mobile menu button
    const menuButton = page.locator('header button').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500); // Wait for animation
      
      await expect(page).toHaveScreenshot('mobile-menu-open.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('contact form focus states', async ({ page }) => {
    await page.goto('/contact');
    
    // Focus first input
    const firstInput = page.locator('input').first();
    await firstInput.focus();
    await page.waitForTimeout(200);
    
    await expect(page).toHaveScreenshot('contact-form-focused.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Visual Regression - Above the Fold', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  for (const route of routes) {
    test(`${route.name} above the fold`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Take viewport screenshot only (above the fold)
      await expect(page).toHaveScreenshot(`${route.name}-atf.png`, {
        fullPage: false,
        maxDiffPixels: 100,
      });
    });
  }
});
