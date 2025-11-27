# Prisma Type Safety Quick Start

**5-Minute Guide for Developers**

## TL;DR

✅ **DO**: Import types from `@prisma/client`  
❌ **DON'T**: Hardcode enum strings or create manual type definitions

## Quick Rules

### 1. Always Import from Prisma or Bridge

```typescript
// ✅ CORRECT
import { UserRole } from '@prisma/client';
// or
import { UserRole } from '@dykstra/shared/types/prisma-bridge';

// ❌ WRONG
type UserRole = 'staff' | 'director'; // Will drift from Prisma
```

### 2. Use Enum Values from Schema

```typescript
// ✅ CORRECT
const role: UserRole = 'STAFF'; // Uppercase matches Prisma

// ❌ WRONG
const role = 'staff'; // Lowercase doesn't match
```

### 3. Run Validation Before Commit

```bash
pnpm validate:prisma-types  # Check for type mismatches
pnpm validate               # Run all checks
```

## Common Scenarios

### Checking User Roles

```typescript
import { UserRole, STAFF_ROLES } from '@dykstra/shared/types/prisma-bridge';

const hasStaffAccess = (role: UserRole): boolean => {
  return STAFF_ROLES.includes(role);
};
```

### Context Types

```typescript
import { UserRole } from '@dykstra/shared/types/prisma-bridge';

interface UserSession {
  id: string;
  role: UserRole; // TypeScript enforces Prisma compatibility
}
```

### Repository Pattern

```typescript
import { UserRole } from '@prisma/client';

const toDomain = (prismaUser: PrismaUser): DomainUser => {
  return {
    ...prismaUser,
    role: prismaUser.role, // Already correct type
  };
};
```

## Troubleshooting

### Error: "Type 'staff' is not assignable to type 'UserRole'"

**Fix**: Use uppercase enum value
```typescript
// Change this
const role = 'staff';

// To this
const role: UserRole = 'STAFF';
```

### Error: "Cannot find module '@prisma/client'"

**Fix**: Generate Prisma client
```bash
pnpm prisma generate
```

## Files to Know

- **Bridge Module**: `packages/shared/src/types/prisma-bridge.ts` - Single source of truth
- **Validation Script**: `scripts/validate-prisma-types.ts` - Catches mismatches
- **Full Guide**: `docs/PRISMA_TYPE_SAFETY.md` - Complete documentation

## Validation Commands

```bash
# Check Prisma types only
pnpm validate:prisma-types

# Check dependency injection
pnpm validate:di

# Full validation suite
pnpm validate

# TypeScript only
pnpm type-check
```

## When Schema Changes

1. Update `packages/infrastructure/prisma/schema.prisma`
2. Run `pnpm prisma generate`
3. Run `pnpm validate:prisma-types`
4. Fix any reported issues
5. Commit changes

## Why This Matters

**Problem**: Case sensitivity mismatch causes runtime 403 errors  
**Solution**: Compiler catches issues before deployment  
**Result**: Zero runtime type errors ✅

---

**More Details**: See [PRISMA_TYPE_SAFETY.md](./PRISMA_TYPE_SAFETY.md)
