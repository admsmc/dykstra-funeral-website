import { test, expect } from '@playwright/test';

/**
 * Complete Case Workflow E2E Test
 * Tests the full lifecycle of a funeral case from creation to finalization
 */

test.describe('Complete Case Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to staff dashboard
    await page.goto('/staff/dashboard');
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should create case from lead and complete full workflow', async ({ page }) => {
    // Step 1: Navigate to cases page
    await page.goto('/staff/cases');
    await expect(page).toHaveTitle(/Cases/);

    // Step 2: Create new case
    // (Assuming there's a "New Case" button)
    const newCaseButton = page.getByRole('link', { name: /new case/i });
    if (await newCaseButton.isVisible()) {
      await newCaseButton.click();
      
      // Fill case form
      await page.fill('input[name="decedentName"]', 'John Smith');
      await page.selectOption('select[name="type"]', 'at_need');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for success
      await expect(page.getByText(/case created/i)).toBeVisible();
    }

    // Step 3: Verify case appears in list
    await page.goto('/staff/cases');
    await expect(page.getByText('John Smith')).toBeVisible();

    // Step 4: Update case status through workflow
    const actionsMenu = page.locator('[title="Actions"]').first();
    await actionsMenu.click();
    
    // Transition: inquiry → active
    await page.getByText('active', { exact: false }).click();
    await expect(page.getByText(/status updated/i)).toBeVisible();
    
    // Wait for list to refresh
    await page.waitForTimeout(1000);

    // Step 5: Schedule service
    await actionsMenu.click();
    await page.getByText(/schedule service/i).click();
    await expect(page.getByText(/service scheduled/i)).toBeVisible();

    // Step 6: Assign staff
    await actionsMenu.click();
    await page.getByText(/assign staff/i).click();
    await expect(page.getByText(/staff assigned/i)).toBeVisible();

    // Step 7: Generate documents
    await actionsMenu.click();
    await page.getByText(/generate documents/i).click();
    await expect(page.getByText(/documents generated/i)).toBeVisible();
  });

  test('should enforce workflow state machine', async ({ page }) => {
    await page.goto('/staff/cases');
    
    // Find an inquiry case
    const actionsMenu = page.locator('[title="Actions"]').first();
    await actionsMenu.click();
    
    // Verify only valid transitions are shown
    // From inquiry: should show active and archived, but not completed
    await expect(page.getByText('active')).toBeVisible();
    await expect(page.getByText('completed')).not.toBeVisible();
  });

  test('should display financial summary for each case', async ({ page }) => {
    await page.goto('/staff/cases');
    
    // Wait for financial data to load
    await page.waitForLoadState('networkidle');
    
    // Verify Balance Due column exists
    await expect(page.getByText('Balance Due')).toBeVisible();
    
    // Verify at least one balance amount is displayed
    const balanceCell = page.locator('[class*="DollarSign"]').first();
    await expect(balanceCell).toBeVisible();
  });

  test('should support bulk operations', async ({ page }) => {
    await page.goto('/staff/cases');
    
    // Select multiple cases
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(1).click(); // First data row (0 is header)
    await checkboxes.nth(2).click();
    
    // Verify bulk actions toolbar appears
    await expect(page.getByText(/selected/i)).toBeVisible();
    
    // Verify bulk action buttons
    await expect(page.getByRole('button', { name: /archive/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /generate docs/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /assign staff/i })).toBeVisible();
  });
});

test.describe('Document Generation Workflow', () => {
  test('should navigate to documents page and generate documents', async ({ page }) => {
    // Assuming we have a case ID to work with
    await page.goto('/staff/cases');
    
    // Click on first case to get ID
    const firstCase = page.locator('a[href*="/staff/cases/"]').first();
    await firstCase.click();
    
    // Get current URL to extract case ID
    const url = page.url();
    const caseId = url.split('/cases/')[1]?.split('/')[0];
    
    if (caseId) {
      // Navigate to documents page
      await page.goto(`/staff/cases/${caseId}/documents`);
      
      // Verify page loaded
      await expect(page.getByText('Document Generation')).toBeVisible();
      
      // Select templates
      await page.click('text=Service Program');
      await page.click('text=Prayer Card');
      
      // Verify selection
      await expect(page.locator('[class*="border-[--navy]"]')).toHaveCount(2);
      
      // Generate documents
      await page.click('button:has-text("Generate 2 Document(s)")');
      
      // Verify success
      await expect(page.getByText(/generated.*document/i)).toBeVisible();
    }
  });

  test('should preview template data mapping', async ({ page }) => {
    await page.goto('/staff/cases');
    const firstCase = page.locator('a[href*="/staff/cases/"]').first();
    await firstCase.click();
    
    const url = page.url();
    const caseId = url.split('/cases/')[1]?.split('/')[0];
    
    if (caseId) {
      await page.goto(`/staff/cases/${caseId}/documents`);
      
      // Click preview on first template
      await page.getByText(/preview data mapping/i).first().click();
      
      // Verify modal opens
      await expect(page.getByText('Data Mapping Preview')).toBeVisible();
      
      // Verify variables shown
      await expect(page.getByText(/{{.*}}/)).toBeVisible();
      
      // Close modal
      await page.click('text=Close Preview');
      await expect(page.getByText('Data Mapping Preview')).not.toBeVisible();
    }
  });
});

test.describe('Performance Tests', () => {
  test('should load cases page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/staff/cases');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle large number of cases', async ({ page }) => {
    await page.goto('/staff/cases');
    await page.waitForLoadState('networkidle');
    
    // Verify pagination or virtualization works
    const cases = page.locator('table tbody tr');
    const count = await cases.count();
    
    // Should display reasonable number (pagination)
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(50); // Default page size
  });
});
