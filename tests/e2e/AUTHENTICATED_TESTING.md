# Authenticated E2E Testing Guide

Complete guide for testing staff dashboard and authenticated routes with Playwright and Clerk.

## Overview

The ERP system has comprehensive E2E tests for:
- ✅ Staff Dashboard navigation
- ✅ Case Management
- ✅ Contract Management  
- ✅ Payment Processing
- ✅ Financial Operations (FinOps)
- ✅ Payroll Management
- ✅ Template Library & Editor
- ✅ Workflow Approvals
- ✅ Analytics & Reporting
- ✅ Task Management

## Prerequisites

### 1. Create Test User in Clerk

1. Go to your Clerk Dashboard (https://dashboard.clerk.com)
2. Navigate to your application
3. Go to **Users** section
4. Create a new user:
   - Email: `test-staff@your domain.com`
   - Password: Create a strong password
   - Role: Staff (if using role-based access)

### 2. Set Environment Variables

Create `.env.test` file or add to your `.env.local`:

```bash
# Clerk Test Credentials
CLERK_TEST_USER_EMAIL=test-staff@yourdomain.com
CLERK_TEST_USER_PASSWORD=YourSecurePassword123!

# Clerk API Keys (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Configure Playwright

Ensure `playwright.config.ts` has environment variables:

```typescript
use: {
  baseURL: 'http://localhost:3000',
  // Clerk credentials from environment
},
```

## Running Tests

### All Staff Tests
```bash
pnpm test:e2e:staff
```

### All Public Tests (no auth required)
```bash
pnpm test:e2e:public
```

### All Tests (public + authenticated)
```bash
pnpm test:e2e
```

### Specific Test File
```bash
npx playwright test staff-dashboard.spec.ts
npx playwright test staff-erp-features.spec.ts
```

### Debug Mode (Recommended for First Run)
```bash
npx playwright test staff-dashboard.spec.ts --debug
```

### Interactive UI Mode
```bash
pnpm test:e2e:ui
```

## Test Structure

### Authentication Tests (`staff-dashboard.spec.ts`)
- ✅ Redirect unauthenticated users
- ✅ Sign in flow
- ✅ Session management
- ✅ Navigation between pages
- ✅ Layout structure
- ✅ User button and profile
- ✅ Theme toggle
- ✅ Cases, Contracts, Payments pages
- ✅ Analytics dashboard
- ✅ Tasks management

### ERP Features Tests (`staff-erp-features.spec.ts`)
- ✅ Financial Operations (FinOps) page
- ✅ Payroll Management page
- ✅ Template Library (list, search, filter)
- ✅ Template Editor interface
- ✅ Template Workflows
- ✅ Template Approvals queue
- ✅ Template Analytics
- ✅ Data table functionality (sorting, pagination)
- ✅ Form validation
- ✅ Performance benchmarks

## Authentication Utilities

Located in `auth-utils.ts`:

### Sign In
```typescript
import { signInWithClerk } from './auth-utils';

test('my test', async ({ page }) => {
  await signInWithClerk(page, {
    email: process.env.CLERK_TEST_USER_EMAIL,
    password: process.env.CLERK_TEST_USER_PASSWORD,
  });
  
  // Now authenticated - test protected routes
  await page.goto('/staff/dashboard');
});
```

### Check Authentication Status
```typescript
import { isAuthenticated } from './auth-utils';

const authenticated = await isAuthenticated(page);
expect(authenticated).toBe(true);
```

### Sign Out
```typescript
import { signOut } from './auth-utils';

await signOut(page);
```

### Route Constants
```typescript
import { StaffRoutes, PortalRoutes } from './auth-utils';

await page.goto(StaffRoutes.DASHBOARD);
await page.goto(StaffRoutes.CASES);
await page.goto(PortalRoutes.PROFILE);
```

## Test Coverage

### Staff Dashboard Routes
- `/staff/dashboard` - Main dashboard with KPIs
- `/staff/cases` - Case management list
- `/staff/cases/new` - New case form
- `/staff/cases/[id]` - Case details
- `/staff/contracts` - Contract management
- `/staff/contracts/builder` - Contract builder
- `/staff/contracts/templates` - Contract templates
- `/staff/payments` - Payment processing
- `/staff/payments/[id]` - Payment details
- `/staff/analytics` - Reports and insights
- `/staff/tasks` - Task management
- `/staff/families` - Family invitations
- `/staff/finops` - Financial operations
- `/staff/payroll` - Payroll management
- `/staff/template-library` - Template library
- `/staff/template-editor` - Template editor
- `/staff/template-workflows` - Workflow management
- `/staff/template-approvals` - Approval queue
- `/staff/template-analytics` - Template analytics
- `/staff/test-integration` - Go backend integration testing

### Portal Routes (Family Access)
- `/portal/dashboard` - Family dashboard
- `/portal/profile` - Profile management
- `/portal/cases/[id]` - Case view for families
- `/portal/memorials/[id]` - Memorial pages
- `/portal/payments/new` - Payment submission

## Writing New Tests

### Basic Template
```typescript
import { test, expect } from '@playwright/test';
import { signInWithClerk, StaffRoutes } from './auth-utils';

const testUser = {
  email: process.env.CLERK_TEST_USER_EMAIL || 'test@example.com',
  password: process.env.CLERK_TEST_USER_PASSWORD || 'password',
};

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await signInWithClerk(page, testUser);
  });

  test('feature works correctly', async ({ page }) => {
    await page.goto(StaffRoutes.MY_FEATURE);
    
    // Your test assertions
    await expect(page.locator('h1')).toHaveText('My Feature');
  });
});
```

### Testing Forms
```typescript
test('can submit form', async ({ page }) => {
  await page.goto(StaffRoutes.MY_FORM);
  
  // Fill form
  await page.fill('input[name="field1"]', 'value1');
  await page.fill('input[name="field2"]', 'value2');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify success
  await expect(page.locator('[role="alert"]')).toHaveText(/success/i);
});
```

### Testing Tables
```typescript
test('can sort table', async ({ page }) => {
  await page.goto(StaffRoutes.MY_TABLE);
  
  // Click column header to sort
  await page.click('th:has-text("Name")');
  
  // Verify sorted
  const firstRow = page.locator('tbody tr').first();
  await expect(firstRow).toBeVisible();
});
```

### Testing Navigation
```typescript
test('can navigate between sections', async ({ page }) => {
  await page.goto(StaffRoutes.DASHBOARD);
  
  // Click nav link
  await page.click('nav a:has-text("Cases")');
  
  // Verify URL changed
  await expect(page).toHaveURL(StaffRoutes.CASES);
  
  // Verify active state
  const activeLink = page.locator('nav a.bg-\\[--sage\\]');
  await expect(activeLink).toHaveText('Cases');
});
```

## Troubleshooting

### Authentication Failures

**Problem**: Tests fail at sign-in step
**Solution**:
1. Verify test user exists in Clerk dashboard
2. Check environment variables are set
3. Ensure Clerk is in test mode
4. Run with `--debug` flag to see what's happening

```bash
npx playwright test staff-dashboard.spec.ts --debug
```

### Clerk Not Loading

**Problem**: Clerk sign-in component doesn't appear
**Solution**:
1. Check NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set
2. Verify dev server is running
3. Check for JavaScript errors in console
4. Increase timeout in test

```typescript
await page.waitForSelector('input[name="identifier"]', { timeout: 15000 });
```

### Session Not Persisting

**Problem**: Tests pass individually but fail when run together
**Solution**:
Use separate browser contexts or clear storage:

```typescript
test.afterEach(async ({ page }) => {
  await page.context().clearCookies();
});
```

### Redirects Not Working

**Problem**: After sign-in, not redirected to expected page
**Solution**:
Wait for specific URL pattern:

```typescript
await page.waitForURL(/.*\/staff\/.*/, { timeout: 15000 });
```

### Tests Timing Out

**Problem**: Tests timeout waiting for page load
**Solution**:
1. Increase timeout in playwright.config.ts
2. Use more specific wait conditions
3. Check for slow backend API calls

```typescript
test.setTimeout(60000); // 60 seconds
```

## Performance Benchmarks

Tests track page load times:
- Dashboard: < 5 seconds
- Case list: < 5 seconds
- Payment processing: < 5 seconds

If tests exceed these thresholds, investigate:
- Slow database queries
- Unoptimized React renders
- Large bundle sizes
- Network requests in waterfall

## CI/CD Integration

Tests run automatically on GitHub Actions:
- Manual trigger: Repository Dispatch event
- Scheduled: Nightly at 2 AM
- Requires secrets:
  - `CLERK_TEST_USER_EMAIL`
  - `CLERK_TEST_USER_PASSWORD`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Add secrets in GitHub: Settings → Secrets → Actions

## Best Practices

### DO:
- ✅ Sign in once per test suite (beforeEach)
- ✅ Use route constants from `auth-utils.ts`
- ✅ Check for console errors
- ✅ Test both success and error paths
- ✅ Use semantic selectors (role, accessible name)
- ✅ Wait for network idle on data-heavy pages
- ✅ Test form validation
- ✅ Verify active navigation states
- ✅ Check for empty states when appropriate

### DON'T:
- ❌ Hard-code credentials in test files
- ❌ Rely on precise timing (use waitFor instead)
- ❌ Test implementation details
- ❌ Create test data that affects production
- ❌ Skip error handling tests
- ❌ Ignore console errors
- ❌ Test against production environment

## Security Notes

- Test credentials are separate from production
- Never commit `.env` files with real credentials
- Use Clerk test mode for all E2E tests
- Test users should have minimal permissions
- Rotate test passwords regularly
- Monitor test user activity logs

## Future Enhancements

Planned additions:
- [ ] Reusable authentication contexts (save/restore sessions)
- [ ] API mocking for faster tests
- [ ] Visual regression for staff UI
- [ ] Multi-user role testing (admin vs staff)
- [ ] Data seeding utilities
- [ ] Test data cleanup after runs
- [ ] Parallel test execution with isolated data

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Clerk Testing Guide](https://clerk.com/docs/testing/overview)
- [E2E Testing Best Practices](https://playwright.dev/docs/best-practices)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
