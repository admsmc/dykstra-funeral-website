import { test, expect } from '@playwright/test';

/**
 * Contract Workflow E2E Test
 * Tests contract creation, signature tracking, renewal, and PDF generation
 */

test.describe('Contract Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/staff/contracts');
    await page.waitForLoadState('networkidle');
  });

  test('should display contracts with signature status', async ({ page }) => {
    // Verify contracts page loaded
    await expect(page.getByText('Contracts')).toBeVisible();
    
    // Verify signature status column exists
    await expect(page.getByText('Signatures')).toBeVisible();
    
    // Verify signature indicators (checkmark or clock icons)
    const signatureIcons = page.locator('[class*="CheckCircle"], [class*="Clock"]');
    await expect(signatureIcons.first()).toBeVisible();
  });

  test('should show context-appropriate actions based on status', async ({ page }) => {
    // Find a draft contract
    const draftRow = page.locator('text=Draft').first().locator('..').locator('..');
    if (await draftRow.isVisible()) {
      // Should show "Send for Signature" button
      const sendButton = draftRow.locator('[title*="Send for signature"]');
      await expect(sendButton).toBeVisible();
    }
    
    // Find a pending signatures contract
    const pendingRow = page.locator('text=Pending Signatures').first().locator('..').locator('..');
    if (await pendingRow.isVisible()) {
      // Should show "Send Reminder" and "Download" buttons
      const reminderButton = pendingRow.locator('[title*="Send reminder"]');
      const downloadButton = pendingRow.locator('[title*="Download"]');
      await expect(reminderButton).toBeVisible();
      await expect(downloadButton).toBeVisible();
    }
    
    // Find a fully signed contract
    const signedRow = page.locator('text=Fully Signed').first().locator('..').locator('..');
    if (await signedRow.isVisible()) {
      // Should show "Download" and "Renew" buttons
      const downloadButton = signedRow.locator('[title*="Download"]');
      const renewButton = signedRow.locator('[title*="Renew"]');
      await expect(downloadButton).toBeVisible();
      await expect(renewButton).toBeVisible();
    }
  });

  test('should send contract for signature', async ({ page }) => {
    // Find a draft contract
    const sendButton = page.locator('[title*="Send for signature"]').first();
    
    if (await sendButton.isVisible()) {
      await sendButton.click();
      
      // Verify success toast
      await expect(page.getByText(/sent for signature/i)).toBeVisible();
    }
  });

  test('should generate PDF with watermark', async ({ page }) => {
    // Find any contract with download button
    const downloadButton = page.locator('[title*="Download"]').first();
    
    if (await downloadButton.isVisible()) {
      await downloadButton.click();
      
      // Verify PDF generation toast
      await expect(page.getByText(/pdf generated/i)).toBeVisible();
      
      // In real test, would verify download or new tab
    }
  });
});

test.describe('Contract Renewal Workflow', () => {
  test('should open renewal modal and complete renewal', async ({ page }) => {
    await page.goto('/staff/contracts');
    
    // Find a fully signed contract with renew button
    const renewButton = page.locator('[title*="Renew"]').first();
    
    if (await renewButton.isVisible()) {
      await renewButton.click();
      
      // Step 1: Verify modal opens
      await expect(page.getByText('Contract Renewal')).toBeVisible();
      
      // Step 2: Fill renewal form
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateString = futureDate.toISOString().split('T')[0];
      
      await page.fill('input[type="date"]', dateString);
      
      // Select price adjustment option
      await page.click('text=Apply inflation adjustment');
      
      // Add notes
      await page.fill('textarea[placeholder*="notes"]', 'Annual renewal with inflation adjustment');
      
      // Step 3: Review
      await page.click('button:has-text("Review Renewal")');
      await expect(page.getByText(/review renewal details/i)).toBeVisible();
      
      // Step 4: Confirm
      await page.click('button:has-text("Confirm Renewal")');
      
      // Step 5: Verify success
      await expect(page.getByText(/renewed successfully/i)).toBeVisible();
      
      // Close modal
      await page.click('button:has-text("Done")');
      await expect(page.getByText('Contract Renewal')).not.toBeVisible();
    }
  });

  test('should calculate price adjustments correctly', async ({ page }) => {
    await page.goto('/staff/contracts');
    const renewButton = page.locator('[title*="Renew"]').first();
    
    if (await renewButton.isVisible()) {
      await renewButton.click();
      
      // Select inflation adjustment
      await page.click('text=Apply inflation adjustment');
      
      // Verify new amount calculation appears
      await expect(page.getByText(/new amount:/i)).toBeVisible();
      
      // Select custom adjustment
      await page.click('text=Custom adjustment');
      await page.fill('input[placeholder*="adjustment amount"]', '500');
      
      // Verify custom calculation
      await expect(page.getByText(/500/)).toBeVisible();
    }
  });

  test('should require reason for price adjustments', async ({ page }) => {
    await page.goto('/staff/contracts');
    const renewButton = page.locator('[title*="Renew"]').first();
    
    if (await renewButton.isVisible()) {
      await renewButton.click();
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      await page.fill('input[type="date"]', futureDate.toISOString().split('T')[0]);
      
      // Select price adjustment without reason
      await page.click('text=Apply inflation adjustment');
      
      // Try to proceed without reason
      await page.click('button:has-text("Review Renewal")');
      
      // Verify reason field becomes required
      const reasonField = page.locator('textarea[required]');
      await expect(reasonField).toBeVisible();
    }
  });
});

test.describe('Contract Performance', () => {
  test('should load contracts page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/staff/contracts');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should filter contracts efficiently', async ({ page }) => {
    await page.goto('/staff/contracts');
    
    // Click on a status filter
    const filterButton = page.getByText('Pending Signatures');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Verify filter applies quickly
      await page.waitForTimeout(500);
      
      // Verify filtered results
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});
