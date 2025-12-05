import { test, expect } from '@playwright/test';

/**
 * Smoke tests - quick validation that basic functionality works
 * Run first to catch major issues before running full test suite
 */

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Dykstra Funeral Home/i);
  });

  test('can navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to About
    await page.click('a:has-text("About")');
    await expect(page).toHaveURL(/about/);
    
    // Navigate to Services
    await page.click('a:has-text("Services")');
    await expect(page).toHaveURL(/services/);
  });

  test('no JavaScript errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });
});
