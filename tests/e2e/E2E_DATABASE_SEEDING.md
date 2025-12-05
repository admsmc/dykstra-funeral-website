# E2E Database Seeding

This document explains how to seed the database with test data for Playwright E2E tests.

## Overview

E2E tests require a database with consistent test data. The seeding script creates:

- **Test Funeral Home**: `test-funeral-home-e2e`
- **Test User**: `test@playwright.dev` (staff role)
- **Payment Policy**: Active policy with standard settings
- **3 Test Cases**: Active, completed, and pre-arrangement cases
- **2 Test Contracts**: Pending and fully signed contracts
- **3 Test Payments**: Successful, pending, and partial payments
- **3 Test Tasks**: TODO, in-progress, and completed tasks

## Usage

### Seed Test Data

Run before E2E tests to ensure the database has test data:

```bash
pnpm seed:e2e
```

This will create test data if it doesn't exist. If data already exists, it will skip creation (idempotent).

### Clean and Re-seed

To start fresh and recreate all test data:

```bash
pnpm seed:e2e:clean
```

This deletes all E2E test data and creates it again.

## Integration with Tests

### Automatic Seeding (Recommended)

The Playwright config automatically runs the seeding script before tests via the `globalSetup` option:

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './tests/e2e/global-setup.ts',
  // ...
});
```

### Manual Seeding

You can also seed manually before running tests:

```bash
pnpm seed:e2e          # Seed data
pnpm test:e2e:staff    # Run tests
```

## Test Data IDs

All test data uses consistent IDs for easy reference in tests:

### User
- **ID**: `test-user-playwright`
- **Email**: `test@playwright.dev`
- **Role**: STAFF
- **Funeral Home**: `test-funeral-home-e2e`

### Funeral Home
- **ID**: `test-funeral-home-e2e`
- **Name**: E2E Test Funeral Home

### Cases
- **case-e2e-001**: Active case (John Doe, Traditional Burial)
- **case-e2e-002**: Completed case (Jane Smith, Cremation)
- **case-e2e-003**: Pre-arrangement (Robert Johnson, Memorial Service)

### Contracts
- **contract-e2e-001**: Pending signatures ($9,010)
- **contract-e2e-002**: Fully signed ($4,452)

### Payments
- **payment-e2e-001**: Succeeded payment ($4,452, credit card)
- **payment-e2e-002**: Pending payment ($2,000, check)
- **payment-e2e-003**: Succeeded partial payment ($3,000, ACH)

### Tasks
- **task-e2e-001**: Complete death certificate (TODO, high priority)
- **task-e2e-002**: Order flowers (IN_PROGRESS, medium priority)
- **task-e2e-003**: Schedule service (DONE, normal priority)

## Referencing Test Data in Tests

Use the consistent IDs in your tests:

```typescript
test('displays case details', async ({ page }) => {
  await page.goto('/staff/cases/case-e2e-001');
  
  await expect(page.locator('h1')).toContainText('John Doe');
});

test('shows payment history', async ({ page }) => {
  await page.goto('/staff/payments');
  
  const successfulPayment = page.locator('[data-payment-id="payment-e2e-001"]');
  await expect(successfulPayment).toBeVisible();
});
```

## Database Connection

The seeding script uses the same database connection as the application:

- **Connection**: Uses `DATABASE_URL` from `.env.local`
- **Prisma Adapter**: PostgreSQL adapter via `pg` pool
- **Transaction Safety**: All operations use Prisma's transaction handling

## Cleaning Test Data

The clean operation respects foreign key constraints and deletes in the correct order:

1. Payments (references cases and users)
2. Contracts (references cases and users)
3. Tasks (references users and funeral home)
4. Cases (references funeral home and users)
5. Payment policies (references funeral home)
6. Users (references funeral home)
7. Funeral home

This prevents constraint violations during cleanup.

## Troubleshooting

### Seeding Fails with Foreign Key Errors

Make sure you're running `--clean` to remove existing data first:

```bash
pnpm seed:e2e:clean
```

### Test Data Not Found in Tests

1. Check that the seeding script ran successfully:
   ```bash
   pnpm seed:e2e
   ```

2. Verify the database URL is correct in `.env.local`

3. Check the Playwright config has the correct `globalSetup`

### Stale Test Data

If test data gets out of sync, clean and re-seed:

```bash
pnpm seed:e2e:clean
pnpm test:e2e:staff
```

## Adding New Test Data

To add new test data:

1. Edit `scripts/seed-e2e-data.ts`
2. Add your seed function (e.g., `seedTemplates()`)
3. Call it in the `main()` function
4. Update `cleanE2EData()` to clean your new data
5. Document the new data in this README

## CI/CD Integration

In CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Seed E2E Database
  run: pnpm seed:e2e:clean

- name: Run E2E Tests
  run: pnpm test:e2e:staff
```

The `--clean` flag ensures a fresh database state for each CI run.
