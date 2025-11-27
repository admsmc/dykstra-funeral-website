# Validation & Best Practices

This document covers validation tooling and best practices for this Effect-based TypeScript application.

## Quick Start

**Before committing**, run:
```bash
pnpm validate
```

This catches most common issues that TypeScript alone won't detect.

## Common Issues Caught by Validation

### 1. Interface/Tag Naming Conflicts ⚠️ **CRITICAL**

**Problem**: Using the same name for both an interface and a Context.GenericTag causes circular type references that fail at runtime with `"ServiceName is not defined"`.

**Bad Pattern**:
```typescript
export interface StoragePort {
  upload: (file: FileUpload) => Effect.Effect<UploadResult, StorageError>;
}

export const StoragePort = Context.GenericTag<StoragePort>('@dykstra/StoragePort');
// ❌ Runtime error: "StoragePort is not defined"
```

**Good Pattern**:
```typescript
export interface StoragePortService {
  upload: (file: FileUpload) => Effect.Effect<UploadResult, StorageError>;
}

export const StoragePort = Context.GenericTag<StoragePortService>('@dykstra/StoragePort');
// ✅ Works correctly
```

**Why This Happens**:
- TypeScript allows interface and const with same name (namespace merging)
- The tag definition `Context.GenericTag<StoragePort>` creates a circular type reference
- TypeScript compiles fine, but fails at runtime during dependency injection

**Detection**: `pnpm validate` checks for this pattern automatically.

---

### 2. `await import()` in Layer Definitions 🚫

**Problem**: Top-level `await import()` in Layer exports causes dependency injection to fail because the import happens before the Effect runtime is initialized.

**Bad Pattern**:
```typescript
export const StripeAdapterLive = Layer.succeed(
  (await import('@dykstra/application')).PaymentPort,  // ❌ Breaks DI
  StripeAdapter
);
```

**Good Pattern**:
```typescript
import { PaymentPort } from '@dykstra/application';

export const StripeAdapterLive = Layer.succeed(
  PaymentPort,  // ✅ Proper import
  StripeAdapter
);
```

**Why This Happens**:
- `await import()` is evaluated at module initialization time
- Effect Layers need to be constructed lazily
- The service tag isn't available when the await happens

**Detection**: 
- `pnpm check:layers` finds these
- `pnpm validate` includes this check
- ESLint `no-restricted-syntax` rule catches top-level await

---

### 3. Circular Dependencies 🔄

**Problem**: Module A imports B, B imports C, C imports A. Can cause initialization failures or runtime errors.

**Detection**:
```bash
pnpm check:circular
```

Uses `madge` to analyze all TypeScript imports and report circular dependency chains.

**Common Causes**:
- Barrel exports (`index.ts`) re-exporting everything
- Shared types not extracted to separate files
- Repository implementations importing each other

**Fix**: Extract shared types to a separate file, or use dependency injection instead of direct imports.

---

### 4. Type-Aware Linting Issues

**Caught by ESLint with TypeScript parser**:
- `@typescript-eslint/no-floating-promises` - Forgot to await/handle Effect
- `@typescript-eslint/await-thenable` - Using await on non-Promise
- `import/no-cycle` - Import cycles (redundant with madge but faster)
- `import/no-self-import` - File importing itself

---

### 5. Prisma Schema Issues 🗄️

**Problem**: Invalid Prisma schema syntax or formatting causes database migration/generation failures.

**Caught by `prisma validate`**:
- Missing required fields
- Invalid relation definitions
- Syntax errors in schema
- Incorrect field types

**Caught by `prisma format --check`**:
- Inconsistent formatting
- Missing blank lines between models
- Incorrect indentation

**Detection**: `pnpm check:prisma`

---

### 6. Missing Environment Variables 🌍

**Problem**: Application crashes at runtime when required env vars are missing or malformed.

**Common Issues**:
- Missing `DATABASE_URL` causes Prisma to fail
- Missing Clerk keys causes auth to fail  
- Malformed AWS keys cause S3 operations to fail
- Using production DB URL in development

**Detection**: `pnpm check:env`

Validates:
- All required variables exist
- Format matches expected pattern (e.g., `pk_` prefix for Clerk keys)
- Not accidentally using production DB in dev
- Correct file (.env.local vs .env)

---

### 7. Unused Code & Dependencies 🧹

**Problem**: Dead code and unused dependencies increase bundle size and maintenance burden.

**Caught by Knip**:
- Unused exports
- Unused dependencies in package.json
- Unreachable code
- Duplicate exports
- Unused types

**Detection**: `pnpm check:unused`

**Note**: Some warnings are false positives (e.g., Next.js conventions, Effect tags). Review carefully.

---

## Validation Tools

### Full Validation Suite
```bash
pnpm validate
```

Runs:
1. TypeScript compilation (`pnpm -r typecheck`)
2. ESLint across all packages (`pnpm lint`)
3. Circular dependency check (`madge`)
4. Effect Layer validation (grep-based checks)
5. Interface/tag naming conflict detection

**When to Run**: Before every commit, before pushing, in CI/CD.

---

### Individual Checks

#### TypeScript Only
```bash
pnpm type-check
# or for single package:
cd packages/infrastructure && pnpm type-check
```

#### Lint Only
```bash
pnpm lint
```

#### Circular Dependencies Only
```bash
pnpm check:circular
```

#### Effect Layer Validation Only
```bash
pnpm check:layers
```

#### Prisma Schema Validation
```bash
pnpm check:prisma
```
Validates Prisma schema syntax and formatting.

#### Environment Variables
```bash
pnpm check:env
```
Validates all required environment variables exist and have correct format.

#### Unused Code Detection
```bash
pnpm check:unused
```
Finds unused exports, dependencies, and dead code using Knip.

---

## ESLint Configuration

Located in `eslint.config.mjs`:

**Effect-Specific Rules**:
- `@effect/no-import-from-barrel-package` - Prevents circular imports via barrel files
- `no-restricted-syntax` - Blocks top-level await in exports

**Import Rules**:
- `import/no-cycle` - Detects circular imports
- `import/no-self-import` - Prevents file from importing itself

**TypeScript Rules**:
- `@typescript-eslint/consistent-type-imports` - Enforce `type` imports for types
- `@typescript-eslint/no-unused-vars` - Catch unused variables (allows `_` prefix)
- `@typescript-eslint/no-floating-promises` - Ensure Effect/Promise handling
- `@typescript-eslint/await-thenable` - Only await Promises/Effects

---

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Validate
  run: pnpm validate
```

This ensures all checks pass before merging.

---

## Why These Tools Matter

**Without validation tooling**, you'll encounter:
1. ✅ TypeScript compiles successfully
2. ✅ Tests pass
3. ❌ Runtime error: `"StoragePort is not defined"`
4. 🔍 Hours of debugging to find circular type reference

**With validation tooling**:
1. ✅ TypeScript compiles
2. ❌ `pnpm validate` fails with clear error message
3. ✅ Fix in 30 seconds
4. ✅ Commit with confidence

---

## Best Practices Summary

### DO ✅
- Suffix service interfaces with `Service` (e.g., `PaymentPortService`)
- Import service tags at top of file
- Run `pnpm validate` before committing
- Use `Layer.succeed(Tag, implementation)` pattern
- Keep domain logic pure (no Effect in domain layer)

### DON'T ❌
- Use same name for interface and Context tag
- Use `await import()` in Layer definitions
- Create circular dependencies between packages
- Put business logic in API routers
- Use Prisma types outside infrastructure layer

---

## Troubleshooting

### "Service not found" at runtime but TypeScript compiles
→ Check for interface/tag naming conflict. Run `pnpm validate`.

### "Cannot read property 'X' of undefined" in Layer initialization
→ Check for `await import()` in Layer definitions. Run `pnpm check:layers`.

### Build works locally but fails in CI
→ Circular dependency that works due to import order. Run `pnpm check:circular`.

### ESLint rule not working
→ Verify `parserOptions.project: true` is set and `tsconfig.json` exists.
