import { Page, expect } from '@playwright/test';

/**
 * Common utilities for Playwright tests
 */

/**
 * Waits for all images on the page to load
 */
export async function waitForImages(page: Page) {
  await page.waitForLoadState('networkidle');
  
  const images = page.locator('img');
  const count = await images.count();
  
  for (let i = 0; i < count; i++) {
    await images.nth(i).evaluate((img: HTMLImageElement) => {
      if (!img.complete) {
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }
    });
  }
}

/**
 * Checks if page has any console errors
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Validates semantic HTML structure
 */
export async function validateSemanticHTML(page: Page) {
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBeGreaterThanOrEqual(1);
}

/**
 * Checks for horizontal scrollbar (bad on mobile)
 */
export async function checkNoHorizontalScroll(page: Page) {
  const hasScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  
  expect(hasScroll).toBe(false);
}

/**
 * Validates all images have loaded correctly
 */
export async function validateImages(page: Page) {
  const images = page.locator('img');
  const count = await images.count();
  
  for (let i = 0; i < count; i++) {
    const img = images.nth(i);
    const isComplete = await img.evaluate((el: HTMLImageElement) => el.complete);
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    
    expect(isComplete).toBe(true);
    expect(naturalWidth).toBeGreaterThan(0);
  }
}

/**
 * Validates all buttons have accessible names
 */
export async function validateButtonAccessibility(page: Page) {
  const buttons = page.locator('button');
  const count = await buttons.count();
  
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    const accessibleName = await button.evaluate((el) => {
      return el.textContent?.trim() || el.getAttribute('aria-label');
    });
    
    expect(accessibleName).toBeTruthy();
  }
}

/**
 * Validates all images have alt text
 */
export async function validateImageAltText(page: Page) {
  const images = page.locator('img');
  const count = await images.count();
  
  for (let i = 0; i < count; i++) {
    const img = images.nth(i);
    const alt = await img.getAttribute('alt');
    const role = await img.getAttribute('role');
    
    // Must have alt attribute (can be empty for decorative) or presentation role
    expect(alt !== null || role === 'presentation').toBe(true);
  }
}

/**
 * Takes a full page screenshot with consistent settings
 */
export async function takeFullPageScreenshot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Wait for fonts
  
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    maxDiffPixels: 100,
  });
}

/**
 * Common public routes for testing
 */
export const PUBLIC_ROUTES = [
  { path: '/', title: /Dykstra Funeral Home/i, name: 'homepage' },
  { path: '/about', title: /About/i, name: 'about' },
  { path: '/services', title: /Services/i, name: 'services' },
  { path: '/contact', title: /Contact/i, name: 'contact' },
  { path: '/obituaries', title: /Obituaries/i, name: 'obituaries' },
  { path: '/pre-planning', title: /Pre-Planning/i, name: 'pre-planning' },
];

/**
 * Common viewport sizes
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 },
};
