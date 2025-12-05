# Scripts

This directory contains utility scripts for the Dykstra Funeral Home Management System.

## E2E Testing Scripts

### Database Seeding

**Purpose**: Seed the database with consistent test data for E2E tests.

```bash
# Seed database with test data
pnpm seed:e2e

# Clean and re-seed database
pnpm seed:e2e:clean
```

**Test Data Created**:
- 1 test funeral home (`test-funeral-home-e2e`)
- 1 test user (`test-user-playwright`)
- 3 contract templates
- 3 cases (Active, Completed, Pre-Need)
- 2 contracts (Pending, Fully Signed)
- 3 payments (Credit Card, Check, ACH)
- 3 tasks (Pending, In Progress, Completed)

**Location**: `scripts/seed-e2e-data.ts`

**Documentation**: `tests/e2e/E2E_DATABASE_SEEDING.md`

---

### Test Documentation Generation

**Purpose**: Generate a comprehensive PDF document with test flows, results, and screenshots.

```bash
# Generate PDF documentation
pnpm docs:e2e
```

**Output**: `docs/E2E_Test_Documentation.pdf`

**PDF Contents**:
1. **Executive Summary** - Key metrics (78% pass rate, 233/300 tests)
2. **Testing Infrastructure Overview** - Playwright, browsers, test environment
3. **Test Coverage & Results** - Detailed breakdown by browser
4. **Test Flows** - 6 detailed flow diagrams:
   - Authentication Flow
   - Staff Dashboard Navigation
   - Case Management Flow
   - Contract Processing Flow
   - Payment Processing Flow
   - Template Management Flow
5. **Database Seeding** - Complete test data structure
6. **Architecture & Design** - Clean Architecture principles, error handling
7. **Screenshots** - Up to 9 embedded screenshots from test runs
8. **CI/CD Integration** - Commands, GitHub Actions workflow, best practices

**Location**: `scripts/generate-test-docs.ts`

**How Screenshots Work**:
- Screenshots are automatically captured on test failures by Playwright
- The PDF generator searches `test-results/` for PNG files
- Up to 3 screenshots per section are embedded in the PDF
- To get fresh screenshots, run tests first: `pnpm test:e2e:staff --project=chromium`

**Regenerating with Fresh Screenshots**:
```bash
# 1. Run tests to capture new screenshots
pnpm test:e2e:staff --project=chromium

# 2. Generate PDF with new screenshots
pnpm docs:e2e
```

---

## Validation Scripts

### Backend Contract Validation

**Purpose**: Validate that all Go backend ports have matching adapters.

```bash
# Validate backend contracts
pnpm validate:contracts

# Validate with OpenAPI spec
pnpm validate:contracts:openapi

# Detect breaking changes
pnpm validate:breaking-changes
```

**Documentation**: `docs/BACKEND_CONTRACT_VALIDATION_COMPLETE.md`

---

### Dependency Injection Validation

**Purpose**: Validate Effect-TS dependency injection setup.

```bash
# Validate DI configuration
pnpm validate:di
```

**Checks**:
- No `await import()` in Layer definitions
- Interface/tag naming conflicts
- Circular dependencies

---

### Pre-Commit Validation

**Purpose**: Run all validation checks before committing.

```bash
# Run all pre-commit checks
pnpm validate
```

**Includes**:
- TypeScript compilation
- ESLint with Effect-specific rules
- Circular dependency detection
- Layer validation
- Dependency injection validation
- Backend contract validation
- Breaking change detection

---

## Development Scripts

### Type Generation

**Purpose**: Generate TypeScript types from Go OpenAPI spec.

```bash
# Generate Go API types
pnpm generate:go-types
```

**Requires**: Go backend running at `http://localhost:8080`

---

## Script Development Guidelines

When adding new scripts:

1. **Add to package.json**: Create a named script entry for easy access
2. **Use tsx**: All TypeScript scripts should use `npx tsx` for execution
3. **Document**: Add script documentation to this README
4. **Error Handling**: Include proper error handling and exit codes
5. **Console Output**: Use clear, colorful console output (✅, ❌, ⚠️, 📄, etc.)
6. **Idempotent**: Scripts should be safe to run multiple times

### Example Script Template

```typescript
#!/usr/bin/env tsx
/**
 * Script Name
 * 
 * Brief description of what the script does.
 */

import { /* imports */ } from 'fs';

console.log('📄 Starting script...\n');

try {
  // Script logic here
  
  console.log('✅ Script completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Script failed:', error);
  process.exit(1);
}
```

---

## Troubleshooting

### "command not found: tsx"

Use `npx tsx` instead of just `tsx`:

```bash
npx tsx scripts/your-script.ts
```

### "Screenshots directory not found"

Run tests first to generate screenshots:

```bash
pnpm test:e2e:staff --project=chromium
```

### "Database connection failed"

Ensure `.env.local` exists and contains valid `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dykstra_dev"
```

### "PDF generation failed"

Install dependencies:

```bash
pnpm install -D pdfkit @types/pdfkit
```
