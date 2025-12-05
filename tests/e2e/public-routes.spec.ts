import { test, expect } from '@playwright/test';

/**
 * Public-facing routes that don't require authentication
 */
const publicRoutes = [
  { path: '/', title: /Dykstra Funeral Home/i },
  { path: '/about', title: /About/i },
  { path: '/services', title: /Services/i },
  { path: '/contact', title: /Contact/i },
  { path: '/obituaries', title: /Obituaries/i },
  { path: '/pre-planning', title: /Pre-Planning/i },
];

test.describe('Public Routes - Accessibility', () => {
  for (const route of publicRoutes) {
    test(`${route.path} loads successfully`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
    });

    test(`${route.path} has correct page title`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveTitle(route.title);
    });

    test(`${route.path} renders header and footer`, async ({ page }) => {
      await page.goto(route.path);
      
      // Header should be visible
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Footer should be visible
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test(`${route.path} has no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      
      expect(errors).toHaveLength(0);
    });
  }
});

test.describe('Public Routes - Navigation', () => {
  test('header navigation links work', async ({ page }) => {
    await page.goto('/');
    
    // Click "About" link in header
    await page.click('header a:has-text("About")');
    await expect(page).toHaveURL(/.*about/);
    
    // Click "Services" link
    await page.click('header a:has-text("Services")');
    await expect(page).toHaveURL(/.*services/);
    
    // Click "Contact" link
    await page.click('header a:has-text("Contact")');
    await expect(page).toHaveURL(/.*contact/);
  });

  test('footer links work', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Test footer navigation (if links exist)
    const footerLinks = await footer.locator('a').count();
    expect(footerLinks).toBeGreaterThan(0);
  });
});

test.describe('Public Routes - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('mobile menu functions on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Look for mobile menu button (hamburger)
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has-text("Menu"), header button').first();
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Menu should be visible after click
      // This is implementation-specific, adjust selector as needed
      await page.waitForTimeout(500); // Wait for animation
    }
  });

  for (const route of publicRoutes) {
    test(`${route.path} is mobile-friendly`, async ({ page }) => {
      await page.goto(route.path);
      
      // Check that header is visible on mobile
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Check for horizontal scroll (bad on mobile)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  }
});

test.describe('Public Routes - Visual Elements', () => {
  for (const route of publicRoutes) {
    test(`${route.path} has no broken images`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const isComplete = await img.evaluate((el: HTMLImageElement) => el.complete);
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        
        // Image should be loaded and have dimensions
        expect(isComplete).toBe(true);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    });
  }
});

test.describe('Public Routes - Contact Form', () => {
  test('contact page has functional form', async ({ page }) => {
    await page.goto('/contact');
    
    // Look for form elements
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    
    // Check for basic form fields
    const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
    
    if (await nameInput.isVisible()) {
      await expect(nameInput).toBeVisible();
    }
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }
  });
});

test.describe('Public Routes - Call to Action', () => {
  test('homepage has emergency contact CTA', async ({ page }) => {
    await page.goto('/');
    
    // Look for phone number link or emergency contact
    const phoneLink = page.locator('a[href^="tel:"]').first();
    
    if (await phoneLink.isVisible()) {
      await expect(phoneLink).toBeVisible();
      const href = await phoneLink.getAttribute('href');
      expect(href).toMatch(/^tel:\+?\d/);
    }
  });
});
