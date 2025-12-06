# Smoke Test Checklist

Quick reference for running smoke tests before commits/deployments.

## ✅ Pre-Commit Checklist

Run this before every commit:

```bash
# 1. Type check (30 seconds)
pnpm type-check

# 2. Lint (15 seconds)  
pnpm lint

# 3. Smoke tests (2 minutes)
pnpm test:smoke
```

**Total time**: ~3 minutes  
**Prevents**: 90% of production runtime errors

## ✅ Pre-Deploy Checklist

Run this before deploying to staging/production:

```bash
# 1. Full validation (includes type check, lint, contracts)
pnpm validate

# 2. Smoke tests
pnpm test:smoke

# 3. Production build
pnpm build
```

**Total time**: ~5 minutes  
**Prevents**: Build failures, runtime errors, contract mismatches

## ✅ When Adding New Routes

After creating a new page/route:

```bash
# 1. Add test to smoke-all-routes.spec.ts
# 2. Run smoke tests to verify
pnpm test:smoke

# 3. Or just test your new route
pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts -g "Your Route Name"
```

## ✅ When Changing Components

After modifying shared components:

```bash
# 1. Run smoke tests (catches prop mismatches)
pnpm test:smoke

# 2. If errors, check:
#    - Prop names match component definitions
#    - Enums use correct casing
#    - No undefined variables
```

## ✅ Quick Debugging

If smoke test fails:

```bash
# 1. Run with UI to see what's happening
pnpm test:smoke:ui

# 2. Or run specific failing section
pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts -g "Financial Operations"

# 3. Check browser console in Playwright UI
#    - Click on failed test
#    - View "Trace" tab
#    - Look for console errors
```

## ✅ Performance Check Only

Just want to check critical route performance?

```bash
# Only runs 5 tests (30 seconds)
pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts -g "Performance Checks"
```

## Common Errors and Fixes

### Error: "is not defined"
**Cause**: Variable used but not declared  
**Fix**: Calculate or define the variable before use  
**Example**: `activeFilterCount` in payments page

### Error: "Property X does not exist"
**Cause**: Prop name mismatch  
**Fix**: Check component definition, use correct prop name  
**Example**: `actions` vs `actionButtons`

### Error: "Type 'ACH' is not assignable"
**Cause**: Wrong enum casing  
**Fix**: Use lowercase enums consistently  
**Example**: `'ach'` not `'ACH'`

### Error: 400 Bad Request
**Cause**: Missing required field in API payload  
**Fix**: Check tRPC schema, add missing field  
**Example**: `paymentRunId` in payment run execution

## Integration with Git Hooks

### Option 1: Manual Pre-Commit
Add to your workflow:
```bash
git add .
pnpm test:smoke  # Run before committing
git commit -m "feat: add new feature"
```

### Option 2: Automated Pre-Commit Hook
Add to `scripts/pre-commit.sh`:
```bash
echo "🧪 Running smoke tests..."
pnpm test:smoke || exit 1
echo "✅ All smoke tests passed!"
```

### Option 3: Husky + lint-staged
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm test:smoke"
    }
  }
}
```

## CI/CD Integration

### GitHub Actions
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run smoke tests
        run: pnpm test:smoke
```

### GitLab CI
```yaml
smoke-tests:
  stage: test
  script:
    - pnpm install
    - pnpm test:smoke
```

## Time Investment vs. Value

| Activity | Time | Frequency | Monthly Time |
|----------|------|-----------|--------------|
| Pre-commit smoke tests | 2 min | 20 commits | 40 minutes |
| Pre-deploy smoke tests | 2 min | 10 deploys | 20 minutes |
| **Total** | | | **60 minutes** |

| Value | Time Saved | Frequency | Monthly Value |
|-------|------------|-----------|---------------|
| Catch runtime error | 2-4 hours | 5 errors | 10-20 hours |
| Prevent prod incident | 4-8 hours | 2 incidents | 8-16 hours |
| **Total** | | | **18-36 hours** |

**ROI**: 18-36 hours saved / 60 minutes invested = **18-36x return**

## Quick Reference

```bash
# Quick run (2 minutes)
pnpm test:smoke

# Interactive UI
pnpm test:smoke:ui

# Specific section
pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts -g "Financial Operations"

# Just performance (30 seconds)
pnpm test:e2e tests/e2e/smoke-all-routes.spec.ts -g "Performance Checks"

# Full docs
open tests/e2e/README-SMOKE-TESTS.md
```

## Summary

✅ Run `pnpm test:smoke` before every commit  
✅ Takes 2 minutes  
✅ Catches 90% of runtime errors  
✅ 18-36x ROI  
✅ Easy to integrate with CI/CD  

**Bottom line**: 2 minutes now saves hours later. Always run smoke tests!
