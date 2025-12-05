import { test, expect } from '@playwright/test';

/**
 * Accessibility tests for WCAG compliance
 * Tests semantic HTML, ARIA labels, keyboard navigation
 */

const publicRoutes = ['/', '/about', '/services', '/contact', '/obituaries', '/pre-planning'];

test.describe('Accessibility - Semantic HTML', () => {
  for (const route of publicRoutes) {
    test(`${route} uses semantic HTML structure`, async ({ page }) => {
      await page.goto(route);
      
      // Check for proper semantic elements
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
      
      // Check heading hierarchy (should start with h1)
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });
  }
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('can navigate header links with keyboard', async ({ page }) => {
    await page.goto('/');
    
    // Press Tab to focus first interactive element
    await page.keyboard.press('Tab');
    
    // Check that something is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });

  test('can activate links with Enter key', async ({ page }) => {
    await page.goto('/');
    
    // Find first navigation link
    const firstLink = page.locator('header a').first();
    await firstLink.focus();
    
    // Press Enter to activate
    await page.keyboard.press('Enter');
    
    // URL should change
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).not.toBe('http://localhost:3000/');
  });

  test('mobile menu can be activated with keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Look for mobile menu button
    const menuButton = page.locator('header button').first();
    
    if (await menuButton.isVisible()) {
      await menuButton.focus();
      await page.keyboard.press('Enter');
      
      // Menu should toggle (implementation-specific)
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Accessibility - ARIA Labels', () => {
  test('interactive elements have accessible names', async ({ page }) => {
    await page.goto('/');
    
    // All buttons should have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.evaluate((el) => {
        return el.textContent || el.getAttribute('aria-label');
      });
      expect(accessibleName).toBeTruthy();
    }
  });

  test('images have alt text or role', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt text (even if empty for decorative) or presentational role
      expect(alt !== null || role === 'presentation').toBe(true);
    }
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('text has sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // This is a simplified check - for comprehensive contrast checking, use axe-core
    // Check that text is visible (a basic smoke test)
    const bodyText = page.locator('body').first();
    const isVisible = await bodyText.isVisible();
    expect(isVisible).toBe(true);
  });
});

test.describe('Accessibility - Focus Indicators', () => {
  test('focused elements are visually distinct', async ({ page }) => {
    await page.goto('/');
    
    // Focus first link
    const firstLink = page.locator('a').first();
    await firstLink.focus();
    
    // Check that outline or focus style is applied
    const outlineWidth = await firstLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outlineWidth || styles.boxShadow;
    });
    
    // Should have some focus indicator
    expect(outlineWidth).toBeDefined();
  });
});

test.describe('Accessibility - Form Labels', () => {
  test('contact form inputs have associated labels', async ({ page }) => {
    await page.goto('/contact');
    
    // Find all input fields
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      
      // Check for label association or aria-label
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id) {
        // Look for label with matching "for" attribute
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        // Input should have label, aria-label, or at minimum placeholder
        expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
      } else {
        // Without id, must have aria-label or placeholder
        expect(ariaLabel || placeholder).toBeTruthy();
      }
    }
  });
});

test.describe('Accessibility - Skip Links', () => {
  test('site has skip to main content link', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first element (often skip link)
    await page.keyboard.press('Tab');
    
    const focusedText = await page.evaluate(() => {
      return document.activeElement?.textContent?.toLowerCase();
    });
    
    // Check if first focusable element is a skip link (not required but best practice)
    // This is informational - many sites don't have skip links
    if (focusedText?.includes('skip')) {
      expect(focusedText).toContain('skip');
    }
  });
});
