# E2E Testing with Playwright

Automated end-to-end tests for the Dykstra Funeral Home website using Playwright.

## Test Suites

### 1. Public Routes (`public-routes.spec.ts`)
Tests core functionality of public-facing pages:
- ✅ Route accessibility (HTTP 200 responses)
- ✅ Page titles and metadata
- ✅ Header and footer rendering
- ✅ Console error detection
- ✅ Navigation functionality
- ✅ Mobile responsiveness
- ✅ Image loading
- ✅ Contact form presence
- ✅ Call-to-action elements

### 2. Accessibility (`accessibility.spec.ts`)
WCAG compliance and accessibility testing:
- ✅ Semantic HTML structure (header, main, footer)
- ✅ Heading hierarchy (h1 present)
- ✅ Keyboard navigation support
- ✅ ARIA labels on interactive elements
- ✅ Alt text on images
- ✅ Focus indicators
- ✅ Form label associations

### 3. Visual Regression (`visual-regression.spec.ts`)
Screenshot-based visual testing:
- ✅ Desktop layout snapshots (1280x720)
- ✅ Mobile layout snapshots (375x667)
- ✅ Component state screenshots (menus, forms)
- ✅ Above-the-fold captures

## Quick Start

### Run All Tests
```bash
pnpm test:e2e
```

### Run Specific Browser
```bash
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit
```

### Run Mobile Tests Only
```bash
pnpm test:e2e:mobile
```

### Interactive Mode (Debug)
```bash
pnpm test:e2e:ui
```

### Debug Mode (Step Through)
```bash
pnpm test:e2e:debug
```

### Headed Mode (See Browser)
```bash
pnpm test:e2e:headed
```

### View Test Report
```bash
pnpm test:e2e:report
```

## Visual Regression Testing

### First Time Setup (Create Baseline)
```bash
pnpm test:e2e:snapshots
```

This creates baseline screenshots in `tests/e2e/*-snapshots/` directories.

### Subsequent Runs
```bash
pnpm test:e2e
```

Tests will compare against baseline screenshots and fail if visual differences exceed threshold (100 pixels).

### Update Snapshots After Intentional Changes
```bash
pnpm test:e2e:snapshots
```

## Test Configuration

Configuration is in `playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Auto-starts dev server before tests
- Runs tests in 5 browsers: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- Parallel execution enabled
- Screenshots on failure
- Traces on retry

## Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/route');
  await expect(page.locator('selector')).toBeVisible();
});
```

### Best Practices
1. Use semantic selectors (data-testid, role, accessible name)
2. Wait for network idle on dynamic content
3. Avoid hard-coded timeouts (use `waitForSelector` instead)
4. Group related tests in `test.describe()` blocks
5. Use page object pattern for complex flows

## CI/CD Integration

Tests automatically:
- Retry twice on failure in CI
- Generate HTML report
- Capture traces on failure
- Take screenshots on error

## Troubleshooting

### Tests Failing Locally
1. Ensure dev server is running: `pnpm dev`
2. Clear Playwright cache: `npx playwright install --force`
3. Check console output for specific failures

### Visual Regression Failures
- Review diff images in `test-results/` directory
- If intentional change, update snapshots: `pnpm test:e2e:snapshots`
- Check for font loading issues (wait longer)

### Timeouts
- Increase timeout in `playwright.config.ts` if needed
- Check for slow API calls blocking page load
- Verify no pending network requests

## Coverage

Current test coverage:
- **6 public routes** fully tested
- **50+ accessibility checks** across routes
- **40+ visual snapshots** (desktop + mobile)
- **5 browsers** (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari)

## Authenticated Testing (Staff Routes)

### Prerequisites

**CRITICAL**: Before running staff tests, create a test user in Clerk Dashboard:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Users
2. Click "Create User"
3. Enter:
   - **Email**: `adm@snowmeltcity.com` (must match `.env.local`)
   - **Password**: (copy from `CLERK_TEST_USER_PASSWORD` in `.env.local`)
4. Ensure user is **activated** (not pending)

### Required Environment Variables

In `.env.local`:
```bash
# Clerk API Keys (from Clerk Dashboard → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Test User Credentials (must exist in Clerk Dashboard)
CLERK_TEST_USER_EMAIL=adm@snowmeltcity.com
CLERK_TEST_USER_PASSWORD=<your-password>
```

### Running Authenticated Tests

```bash
# Run all staff tests
pnpm test:e2e:staff

# Run specific staff test file
pnpm exec playwright test tests/e2e/staff-dashboard.spec.ts
```

### How It Works

We use Clerk's `@clerk/testing` package for reliable token-based authentication:

1. **Setup Phase** (`auth.setup.ts`):
   - Calls `clerkSetup()` to obtain a Testing Token
   - Signs in test user with `clerk.signIn({ emailAddress })`
   - Saves session to `playwright/.auth/staff.json`

2. **Test Phase**:
   - Tests load saved storageState for fast authentication
   - Falls back to `clerk.signIn()` if session expired

### Troubleshooting Authentication

#### "User not found" or Redirect to Sign-In

**Problem**: Test user doesn't exist in Clerk

**Solution**: Create the user in Clerk Dashboard (see Prerequisites above)

#### "Password is incorrect"

**Problem**: Password mismatch between `.env.local` and Clerk

**Solution**: Update one to match the other:
- Reset password in Clerk Dashboard, OR
- Update `CLERK_TEST_USER_PASSWORD` in `.env.local`

#### "CLERK_SECRET_KEY is required"

**Problem**: Missing or invalid Clerk secret key

**Solution**: Copy from Clerk Dashboard → API Keys → Secret Keys

#### Tests Pass in Setup but Fail in Main Tests

**Problem**: StorageState session expired or not loading

**Solution**: Tests automatically retry with `clerk.signIn()`. Check console for auth errors.

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Selectors Guide](https://playwright.dev/docs/selectors)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [Clerk Testing Guide](https://clerk.com/docs/testing/playwright/overview)
