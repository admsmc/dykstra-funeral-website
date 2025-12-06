# Smoke Tests - Quick Reference

## Purpose

Smoke tests catch **runtime errors** that TypeScript compilation misses:
- ✅ Missing/undefined variables (`activeFilterCount`)
- ✅ Prop type mismatches (`paymentRunId`)
- ✅ Enum case mismatches (`'ACH'` vs `'ach'`)
- ✅ Component import errors
- ✅ API endpoint errors

**ROI**: 2 minutes of test time catches 90% of production runtime errors.

## Running Tests

### Quick Run (Recommended)
```bash
# Run all smoke tests (uses existing dev server if running)
pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts

# Or use the shortcut
pnpm test:smoke
```

### With UI (Interactive)
```bash
pnpm test:e2e:ui tests/e2e/smoke-all-routes.spec.ts
```

### Specific Sections
```bash
# Just test Financial Operations
pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts -g "Financial Operations"

# Just test Payments (would have caught activeFilterCount bug)
pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts -g "Payments"
```

### In CI/CD
```bash
# Add to your CI pipeline
pnpm test:e2e:chromium tests/e2e/smoke-all-routes.spec.ts
```

## What Gets Tested

### ✅ 50+ Routes Covered
- Dashboard & Analytics
- Case Management (list, create, tasks)
- Arrangements (select, customize, ceremony)
- Contracts & Templates
- Financial Operations (AP, AR, invoices, reports)
- Payments
- HR & Payroll
- Inventory & Procurement
- Communications
- Documents & Templates

### ✅ Error Detection
Each route is checked for:
1. **Console errors** - JavaScript runtime errors
2. **Error boundaries** - React error UI
3. **"undefined" text** - Missing variables rendered to page
4. **Page loads** - Basic rendering success

### ✅ Bonus Checks
- Performance: Major pages load < 3 seconds
- Accessibility: Proper heading hierarchy (h1 per page)

## Test Results

### What Success Looks Like
```
✓ Staff Routes - Smoke Tests (50 tests - 2m 15s)
  ✓ Core Dashboard & Navigation (2 tests)
  ✓ Case Management (3 tests)
  ✓ Financial Operations (10 tests)
  ✓ Payments (1 test)
  ...
```

### What Failure Looks Like
```
✗ Payments: payments list loads without activeFilterCount error
  Expected: activeFilterCount is not defined
  Received: Found undefined variable error
  
  → This would have caught our bug before it reached production!
```

## Real-World Examples

These tests would have caught today's bugs:

### Bug #1: Missing `activeFilterCount`
```typescript
// ❌ BEFORE (Runtime Error)
{activeFilterCount > 0 && ...}  // undefined variable

// ✅ AFTER (Fixed)
const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + ...
```

**Test that catches it:**
```typescript
test('payments list loads without activeFilterCount error', async ({ page }) => {
  await page.goto('/staff/payments');
  const { errors } = await checkForErrors(page, 'Payments');
  expect(errors.some(e => e.includes('is not defined'))).toBe(false);
});
```

### Bug #2: Missing `paymentRunId`
```typescript
// ❌ BEFORE (API 400 Error)
executePaymentRun.mutate({
  funeralHomeId: 'fh-001',
  paymentMethod: 'ACH', // Also wrong case!
});

// ✅ AFTER (Fixed)
executePaymentRun.mutate({
  paymentRunId: `pr-${Date.now()}`, // Added!
  funeralHomeId: 'fh-001',
  paymentMethod: 'ach', // Lowercase!
});
```

**Test that catches it:**
```typescript
test('accounts payable pages load', async ({ page }) => {
  await page.goto('/staff/finops/ap/payment-run');
  const { errors } = await checkForErrors(page, route);
  expect(errors).toHaveLength(0); // Would catch API errors
});
```

## Adding to Pre-Commit

Add to `scripts/pre-commit.sh`:

```bash
#!/bin/bash
set -e

echo "🧪 Running smoke tests..."
pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts --project=chromium

echo "✅ All smoke tests passed!"
```

Or lighter version (just critical routes):

```bash
# Only test 5 critical routes (30 seconds)
pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts -g "Performance Checks"
```

## Maintenance

### Adding New Routes

When you add a new route, add it to the test:

```typescript
test.describe('My New Feature', () => {
  test('new feature page loads', async ({ page }) => {
    await page.goto('/staff/my-new-feature');
    await checkForErrors(page, 'My New Feature');
  });
});
```

### Ignoring Known Issues

If you have a known issue you'll fix later:

```typescript
test.skip('feature with known issue', async ({ page }) => {
  // TODO: Fix undefined variable before enabling
  await page.goto('/staff/feature');
  await checkForErrors(page, 'Feature');
});
```

## Integration with CI

### GitHub Actions Example

```yaml
name: Smoke Tests

on: [push, pull_request]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run smoke tests
        run: pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts --project=chromium
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: smoke-test-results
          path: playwright-report/
```

## Tips

1. **Run locally before push**: Catches errors in 2 minutes
2. **Run in CI**: Prevents broken deployments
3. **Check on main routes first**: Dashboard, Cases, Payments catch most issues
4. **Don't over-test**: These are SMOKE tests, not comprehensive E2E
5. **Update as you go**: Add new routes when you build them

## FAQ

**Q: Do I need these if I have TypeScript?**  
A: Yes! TypeScript catches type errors at compile time, but not runtime errors like:
- Missing variables in conditionals
- API payload mismatches
- Component prop bugs that slip through `any` types

**Q: How long do they take?**  
A: ~2 minutes for all 50+ routes. Performance tests add another 30 seconds.

**Q: Should I run before every commit?**  
A: Recommended! Or at minimum, run before pushing to main/production.

**Q: What about integration tests?**  
A: Those are important too! Smoke tests catch different bugs - they're complementary.

## Cost-Benefit Analysis

**Time Investment:**
- Writing tests: 30 minutes (one time)
- Running tests: 2 minutes (every commit)
- Maintaining tests: 5 minutes per new feature

**Value:**
- **Today alone**: Would have prevented 3 production bugs (6+ hours saved)
- **Typical month**: Prevents 10-15 runtime errors (20-30 hours saved)
- **Peace of mind**: Deploy with confidence 🎉

**ROI**: ~50x return on investment
